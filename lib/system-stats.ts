import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc 
} from "firebase/firestore"
import { db } from "./firebase"
import type { Match, Prediction, UserStats } from "./types"

export interface SystemStats {
  totalUsers: number
  totalAdmins: number
  totalParticipants: number
  activeMatches: number
  totalMatches: number
  totalPredictions: number
  correctPredictions: number
  totalGroups: number
  activeGroups: number
}

export interface UserRoleStats {
  totalUsers: number
  admins: number
  participants: number
  superAdmins: number
}

// Obtener estadísticas de usuarios por rol
export async function getUserRoleStats(): Promise<UserRoleStats> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    
    let totalUsers = 0
    let admins = 0
    let participants = 0
    let superAdmins = 0

    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      totalUsers++
      
      switch (userData.role) {
        case "admin":
          admins++
          break
        case "participant":
          participants++
          break
        case "superadmin":
          superAdmins++
          break
      }
    })

    return {
      totalUsers,
      admins,
      participants,
      superAdmins
    }
  } catch (error) {
    console.error("Error getting user role stats:", error)
    throw error
  }
}

// Obtener estadísticas de partidos
export async function getMatchStats(): Promise<{
  totalMatches: number
  activeMatches: number
  finishedMatches: number
}> {
  try {
    const matchesSnapshot = await getDocs(collection(db, "matches"))
    
    let totalMatches = 0
    let activeMatches = 0
    let finishedMatches = 0

    matchesSnapshot.forEach((doc) => {
      const matchData = doc.data()
      totalMatches++
      
      if (matchData.isFinished) {
        finishedMatches++
      } else {
        activeMatches++
      }
    })

    return {
      totalMatches,
      activeMatches,
      finishedMatches
    }
  } catch (error) {
    console.error("Error getting match stats:", error)
    throw error
  }
}

// Obtener estadísticas de pronósticos
export async function getPredictionStats(): Promise<{
  totalPredictions: number
  correctPredictions: number
  exactScorePredictions: number
  resultOnlyPredictions: number
}> {
  try {
    const matchesSnapshot = await getDocs(collection(db, "matches"))
    
    let totalPredictions = 0
    let correctPredictions = 0
    let exactScorePredictions = 0
    let resultOnlyPredictions = 0

    matchesSnapshot.forEach((doc) => {
      const matchData = doc.data()
      
      if (matchData.predictions) {
        Object.values(matchData.predictions).forEach((prediction: any) => {
          totalPredictions++
          
          if (prediction.breakdown) {
            // Si tiene breakdown, significa que el partido terminó y se calculó
            if (prediction.breakdown.exactScore > 0) {
              exactScorePredictions++
              correctPredictions++
            } else if (prediction.breakdown.result > 0) {
              resultOnlyPredictions++
              correctPredictions++
            }
          }
        })
      }
    })

    return {
      totalPredictions,
      correctPredictions,
      exactScorePredictions,
      resultOnlyPredictions
    }
  } catch (error) {
    console.error("Error getting prediction stats:", error)
    throw error
  }
}

// Obtener estadísticas de grupos
export async function getGroupStats(): Promise<{
  totalGroups: number
  activeGroups: number
  inactiveGroups: number
}> {
  try {
    const groupsSnapshot = await getDocs(collection(db, "groups"))
    
    let totalGroups = 0
    let activeGroups = 0
    let inactiveGroups = 0

    groupsSnapshot.forEach((doc) => {
      const groupData = doc.data()
      totalGroups++
      
      if (groupData.isActive) {
        activeGroups++
      } else {
        inactiveGroups++
      }
    })

    return {
      totalGroups,
      activeGroups,
      inactiveGroups
    }
  } catch (error) {
    console.error("Error getting group stats:", error)
    throw error
  }
}

// Obtener todas las estadísticas del sistema
export async function getSystemStats(): Promise<SystemStats> {
  try {
    const [
      userStats,
      matchStats,
      predictionStats,
      groupStats
    ] = await Promise.all([
      getUserRoleStats(),
      getMatchStats(),
      getPredictionStats(),
      getGroupStats()
    ])

    return {
      totalUsers: userStats.totalUsers,
      totalAdmins: userStats.admins,
      totalParticipants: userStats.participants,
      activeMatches: matchStats.activeMatches,
      totalMatches: matchStats.totalMatches,
      totalPredictions: predictionStats.totalPredictions,
      correctPredictions: predictionStats.correctPredictions,
      totalGroups: groupStats.totalGroups,
      activeGroups: groupStats.activeGroups
    }
  } catch (error) {
    console.error("Error getting system stats:", error)
    throw error
  }
}

// Obtener estadísticas de partidos en simultáneo (partidos activos hoy)
export async function getConcurrentMatches(): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const matchesSnapshot = await getDocs(
      query(
        collection(db, "matches"),
        where("matchDate", ">=", today),
        where("matchDate", "<", tomorrow),
        where("isFinished", "==", false)
      )
    )

    return matchesSnapshot.size
  } catch (error) {
    console.error("Error getting concurrent matches:", error)
    throw error
  }
}
