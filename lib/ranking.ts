import type { Group, Match, Jornada, Prediction } from "./types"
import { getUserGroups, getGroup } from "./groups"
import { getUserMatches } from "./matches"
import { getJornadasByGroup } from "./jornadas"

export interface UserRanking {
  userId: string
  userName: string
  totalPoints: number
  totalPredictions: number
  correctResults: number
  exactScores: number
  currentStreak: number
  longestStreak: number
  averagePoints: number
  position: number
}

export interface JornadaRanking {
  jornadaId: string
  jornadaName: string
  userRankings: UserRanking[]
}

// Calcular estadísticas de usuario para un conjunto de partidos
export function calculateUserStatsForMatches(
  userId: string, 
  matches: Match[]
): {
  totalPoints: number
  totalPredictions: number
  correctResults: number
  exactScores: number
  currentStreak: number
  longestStreak: number
  averagePoints: number
} {
  let totalPoints = 0
  let totalPredictions = 0
  let correctResults = 0
  let exactScores = 0
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Solo considerar partidos finalizados
  const finishedMatches = matches.filter(match => match.isFinished)

  finishedMatches.forEach(match => {
    const prediction = match.predictions[userId]
    if (prediction && prediction.points !== undefined) {
      totalPredictions++
      totalPoints += prediction.points

      if (prediction.breakdown) {
        if (prediction.breakdown.exactScore > 0) {
          exactScores++
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else if (prediction.breakdown.result > 0) {
          correctResults++
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }
    }
  })

  currentStreak = tempStreak

  return {
    totalPoints,
    totalPredictions,
    correctResults,
    exactScores,
    currentStreak,
    longestStreak,
    averagePoints: totalPredictions > 0 ? Number((totalPoints / totalPredictions).toFixed(1)) : 0
  }
}

// Obtener ranking general de un grupo
export async function getGroupRanking(groupId: string): Promise<UserRanking[]> {
  try {
    const group = await getGroup(groupId)
    if (!group) {
      throw new Error("Grupo no encontrado")
    }

    const groupMatches = await getUserMatches([groupId])
    const finishedMatches = groupMatches.filter(match => match.isFinished)

    // Obtener TODOS los usuarios del grupo (incluidos los que no hicieron pronósticos)
    const allUsers = Object.keys(group.participantNames)

    // Calcular estadísticas para cada usuario
    const userRankings: UserRanking[] = allUsers.map(userId => {
      const stats = calculateUserStatsForMatches(userId, finishedMatches)
      return {
        userId,
        userName: group.participantNames[userId] || "Usuario desconocido",
        ...stats,
        position: 0 // Se calculará después
      }
    })

    // Ordenar por puntos totales (descendente)
    userRankings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      // En caso de empate, ordenar por promedio de puntos
      return b.averagePoints - a.averagePoints
    })

    // Asignar posiciones
    userRankings.forEach((ranking, index) => {
      ranking.position = index + 1
    })

    return userRankings
  } catch (error) {
    console.error("Error getting group ranking:", error)
    throw error
  }
}

// Obtener ranking por jornada
export async function getJornadaRanking(groupId: string, jornadaId: string): Promise<UserRanking[]> {
  try {
    const group = await getGroup(groupId)
    if (!group) {
      throw new Error("Grupo no encontrado")
    }

    const groupMatches = await getUserMatches([groupId])
    const jornadaMatches = groupMatches.filter(match => match.jornadaId === jornadaId)
    const finishedMatches = jornadaMatches.filter(match => match.isFinished)

    // Obtener TODOS los usuarios del grupo (incluidos los que no hicieron pronósticos en esta jornada)
    const allUsers = Object.keys(group.participantNames)

    // Calcular estadísticas para cada usuario en esta jornada
    const userRankings: UserRanking[] = allUsers.map(userId => {
      const stats = calculateUserStatsForMatches(userId, finishedMatches)
      return {
        userId,
        userName: group.participantNames[userId] || "Usuario desconocido",
        ...stats,
        position: 0 // Se calculará después
      }
    })

    // Ordenar por puntos totales (descendente)
    userRankings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      // En caso de empate, ordenar por promedio de puntos
      return b.averagePoints - a.averagePoints
    })

    // Asignar posiciones
    userRankings.forEach((ranking, index) => {
      ranking.position = index + 1
    })

    return userRankings
  } catch (error) {
    console.error("Error getting jornada ranking:", error)
    throw error
  }
}

// Obtener rankings de todas las jornadas de un grupo
export async function getAllJornadaRankings(groupId: string): Promise<JornadaRanking[]> {
  try {
    const jornadas = await getJornadasByGroup(groupId)
    const rankings: JornadaRanking[] = []

    for (const jornada of jornadas) {
      const userRankings = await getJornadaRanking(groupId, jornada.id)
      // Incluir jornada aunque algunos usuarios no participen (tendrán 0 puntos)
      rankings.push({
        jornadaId: jornada.id,
        jornadaName: jornada.name,
        userRankings
      })
    }

    return rankings
  } catch (error) {
    console.error("Error getting all jornada rankings:", error)
    throw error
  }
}

// Obtener ranking general de todos los grupos del usuario
export async function getUserGroupsRanking(userId: string): Promise<{group: Group, ranking: UserRanking[]}[]> {
  try {
    const userGroups = await getUserGroups(userId)
    const groupRankings: {group: Group, ranking: UserRanking[]}[] = []

    for (const group of userGroups) {
      const ranking = await getGroupRanking(group.id)
      // Incluir grupo aunque algunos usuarios no participen (tendrán 0 puntos)
      groupRankings.push({ group, ranking })
    }

    return groupRankings
  } catch (error) {
    console.error("Error getting user groups ranking:", error)
    throw error
  }
}

// Obtener posición del usuario en un grupo
export function getUserPositionInGroup(userId: string, ranking: UserRanking[]): number {
  const userRanking = ranking.find(r => r.userId === userId)
  return userRanking ? userRanking.position : 0
}

// Obtener estadísticas del usuario en un grupo
export function getUserStatsInGroup(userId: string, ranking: UserRanking[]): UserRanking | null {
  return ranking.find(r => r.userId === userId) || null
}

