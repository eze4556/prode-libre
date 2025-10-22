import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Match, Prediction, MatchStats, PredictionStats } from "./types"
import { updateUserAchievements } from "./achievements"
import { calculateUserStats } from "./scoring"

// Helper function to safely convert Firestore timestamp to Date
function convertToDate(timestamp: any): Date {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp)
  }
  return new Date()
}

// Create a new match (admin only)
export async function createMatch(
  groupId: string,
  jornadaId: string,
  homeTeam: string,
  awayTeam: string,
  matchDate: Date,
  homeTeamLogo?: string,
  awayTeamLogo?: string,
): Promise<string> {
  try {
    console.log("Creating match with data:", {
      groupId,
      jornadaId,
      homeTeam,
      awayTeam,
      matchDate: matchDate.toISOString()
    })

    // Validar que si se especifica una jornada, la fecha del partido esté dentro del rango
    if (jornadaId) {
      const { getJornada } = await import("./jornadas")
      const jornada = await getJornada(jornadaId)
      
      if (jornada) {
        // Crear fechas en hora local para evitar problemas de zona horaria
        const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate(), 0, 0, 0, 0)
        
        const jornadaStartDate = new Date(jornada.startDate.getFullYear(), jornada.startDate.getMonth(), jornada.startDate.getDate(), 0, 0, 0, 0)
        const jornadaEndDate = new Date(jornada.endDate.getFullYear(), jornada.endDate.getMonth(), jornada.endDate.getDate(), 23, 59, 59, 999)
        
        if (matchDateOnly < jornadaStartDate || matchDateOnly > jornadaEndDate) {
          throw new Error(`La fecha del partido debe estar entre ${jornada.startDate.toLocaleDateString('es-ES')} y ${jornada.endDate.toLocaleDateString('es-ES')}`)
        }
      }
    }

    const matchData: Omit<Match, "id"> = {
      groupId,
      jornadaId,
      homeTeam,
      awayTeam,
      homeTeamLogo: homeTeamLogo || null,
      awayTeamLogo: awayTeamLogo || null,
      matchDate,
      isFinished: false,
      predictions: {},
    }

    console.log("Match data to save:", matchData)

    const docRef = await addDoc(collection(db, "matches"), matchData)
    console.log("Match created successfully with ID:", docRef.id)
    
    return docRef.id
  } catch (error) {
    console.error("Error creating match:", error)
    throw error
  }
}

// Get matches for a jornada
export async function getMatchesByJornada(jornadaId: string): Promise<Match[]> {
  try {
    const matchesRef = collection(db, "matches")
    const q = query(matchesRef, where("jornadaId", "==", jornadaId), orderBy("matchDate", "asc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          matchDate: convertToDate(doc.data().matchDate),
        }) as Match,
    )
  } catch (error) {
    console.error("Error getting matches by jornada:", error)
    throw new Error("No se pudieron cargar los partidos de la jornada")
  }
}

// Get matches for a group
export async function getGroupMatches(groupId: string): Promise<Match[]> {
  const matchesRef = collection(db, "matches")
  const q = query(matchesRef, where("groupId", "==", groupId), orderBy("matchDate", "asc"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        matchDate: doc.data().matchDate.toDate(),
      }) as Match,
  )
}

// Get all matches for user's groups
export async function getUserMatches(groupIds: string[]): Promise<Match[]> {
  try {
    console.log("getUserMatches called with groupIds:", groupIds)
    
    if (groupIds.length === 0) {
      console.log("No group IDs provided")
      return []
    }

    const matchesRef = collection(db, "matches")
    const q = query(matchesRef, where("groupId", "in", groupIds), orderBy("matchDate", "asc"))
    const querySnapshot = await getDocs(q)

    console.log("Matches found for user groups:", querySnapshot.docs.length)
    console.log("Match IDs:", querySnapshot.docs.map(doc => doc.id))

    const matches = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          matchDate: convertToDate(doc.data().matchDate),
        }) as Match,
    )

    console.log("Returning matches for user:", matches.length)
    return matches
  } catch (error) {
    console.error("Error in getUserMatches:", error)
    throw error
  }
}

// Get admin matches (matches from groups where user is admin)
export async function getAdminMatches(adminId: string): Promise<Match[]> {
  try {
    console.log("getAdminMatches called with adminId:", adminId)
    
    // First get groups where user is admin
    const groupsRef = collection(db, "groups")
    const groupsQuery = query(groupsRef, where("adminId", "==", adminId))
    const groupsSnapshot = await getDocs(groupsQuery)

    console.log("Groups found for admin:", groupsSnapshot.docs.length)
    console.log("Group IDs:", groupsSnapshot.docs.map(doc => doc.id))

    if (groupsSnapshot.empty) {
      console.log("No groups found for admin")
      return []
    }

    const groupIds = groupsSnapshot.docs.map((doc) => doc.id)

    // Then get matches for those groups
    const matchesRef = collection(db, "matches")
    const matchesQuery = query(matchesRef, where("groupId", "in", groupIds), orderBy("matchDate", "desc"))
    const matchesSnapshot = await getDocs(matchesQuery)

    console.log("Matches found for admin groups:", matchesSnapshot.docs.length)
    console.log("Match IDs:", matchesSnapshot.docs.map(doc => doc.id))

    const matches = matchesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          matchDate: convertToDate(doc.data().matchDate),
        }) as Match,
    )

    console.log("Returning matches:", matches.length)
    return matches
  } catch (error) {
    console.error("Error in getAdminMatches:", error)
    throw error
  }
}

// Submit a prediction
export async function submitPrediction(
  matchId: string,
  userId: string,
  predictionStats: PredictionStats,
): Promise<void> {
  try {
    console.log("Submitting prediction:", { matchId, userId, predictionStats })
    
    const matchRef = doc(db, "matches", matchId)
    const matchDoc = await getDoc(matchRef)

    if (!matchDoc.exists()) {
      throw new Error("Partido no encontrado")
    }

    const matchData = matchDoc.data()
    const match = {
      ...matchData,
      matchDate: convertToDate(matchData.matchDate)
    } as Match
    console.log("Match data:", match)

    // Check if match has started (30 minutes before)
    const now = new Date()
    const matchStart = new Date(match.matchDate.getTime() - 30 * 60 * 1000) // 30 min before

    console.log("Time check:", { now: now.toISOString(), matchStart: matchStart.toISOString() })

    if (now > matchStart) {
      throw new Error("Ya no se pueden hacer pronósticos para este partido")
    }

    if (match.isFinished) {
      throw new Error("Este partido ya ha finalizado")
    }

    // Check if user already has a prediction
    const existingPrediction = match.predictions[userId]
    if (existingPrediction) {
      // Validar si aún se puede modificar (30 min antes del partido)
      const now = new Date()
      const matchStart = new Date(match.matchDate.getTime() - 30 * 60 * 1000)
      
      if (now > matchStart) {
        throw new Error("Ya no puedes modificar tu pronóstico. El plazo cerró 30 minutos antes del partido.")
      }
      // Si aún puede modificarlo, continuamos con la actualización
    }

    const prediction: Prediction = {
      uid: userId,
      createdAt: existingPrediction?.createdAt || new Date(), // Mantener fecha original o nueva
      stats: predictionStats,
    }
    
    // Solo agregar updatedAt si existía un pronóstico previo
    if (existingPrediction) {
      prediction.updatedAt = new Date()
    }

    console.log("New prediction:", prediction)

    const updatedPredictions = {
      ...match.predictions,
      [userId]: prediction,
    }

    console.log("Updating predictions:", Object.keys(updatedPredictions).length)

    await updateDoc(matchRef, {
      predictions: updatedPredictions,
    })

    console.log("Prediction submitted successfully")
  } catch (error) {
    console.error("Error submitting prediction:", error)
    throw error
  }
}

// Update match result (admin only)
export async function updateMatchResult(matchId: string, matchStats: MatchStats): Promise<void> {
  const matchRef = doc(db, "matches", matchId)

  await updateDoc(matchRef, {
    stats: matchStats,
    isFinished: true,
  })

  // Calculate points for all predictions
  await calculatePredictionPoints(matchId, matchStats)
}

// Delete match (admin only)
export async function deleteMatch(matchId: string): Promise<void> {
  await deleteDoc(doc(db, "matches", matchId))
}

// Calculate points for predictions
async function calculatePredictionPoints(matchId: string, matchStats: MatchStats): Promise<void> {
  const matchRef = doc(db, "matches", matchId)
  const matchDoc = await getDoc(matchRef)

  if (!matchDoc.exists()) return

  const matchData = matchDoc.data()
  const match = {
    ...matchData,
    matchDate: convertToDate(matchData.matchDate)
  } as Match
  const updatedPredictions = { ...match.predictions }

  const actualResult = matchStats.result

  // Calculate points for each prediction
  for (const [userId, prediction] of Object.entries(updatedPredictions)) {
    const predictedResult = prediction.stats.result
    const isCorrect = predictedResult === actualResult
    
    updatedPredictions[userId] = {
      ...prediction,
      points: isCorrect ? 1 : 0, // 1 punto por resultado correcto
      breakdown: {
        result: isCorrect ? 1 : 0,
        total: isCorrect ? 1 : 0,
      },
    }
  }

  await updateDoc(matchRef, {
    predictions: updatedPredictions,
  })

  // Actualizar logros de cada usuario
  for (const [userId, prediction] of Object.entries(updatedPredictions)) {
    // Obtener todas las predicciones de este usuario en todos los partidos de este grupo
    const userPredictions = Object.values(updatedPredictions).filter(p => p.uid === userId)
    // Calcular stats del usuario
    const userStats = calculateUserStats(userPredictions, match.groupId, userId)
    // Actualizar logros
    await updateUserAchievements(userId, userPredictions, userStats)
  }
}

// Get user's prediction for a match
export function getUserPrediction(match: Match, userId: string): Prediction | null {
  return match.predictions[userId] || null
}

// Check if predictions are still allowed for a match
export function canPredict(match: Match, userId?: string): boolean {
  const now = new Date()
  const matchStart = new Date(match.matchDate.getTime() - 30 * 60 * 1000) // 30 min before
  
  // Check if match is finished
  if (match.isFinished) {
    return false
  }
  
  // Check if match has started
  if (now > matchStart) {
    return false
  }
  
  // Check if user already has a prediction
  if (userId && match.predictions[userId]) {
    return false
  }
  
  return true
}

// Función para verificar si se puede modificar un pronóstico (permitir hasta 30 min antes)
export function canModifyPrediction(match: Match): boolean {
  const now = new Date()
  const matchStart = new Date(match.matchDate.getTime() - 30 * 60 * 1000) // 30 min before
  
  // No se puede si el partido ya terminó
  if (match.isFinished) {
    return false
  }
  
  // No se puede si ya pasaron los 30 minutos antes del partido
  if (now > matchStart) {
    return false
  }
  
  return true
}

// Get match status for display
export function getMatchStatus(match: Match): { label: string; color: string } {
  if (match.isFinished) {
    return { label: "Finalizado", color: "secondary" }
  }

  const now = new Date()
  const matchStart = new Date(match.matchDate.getTime() - 30 * 60 * 1000)

  if (now > matchStart) {
    return { label: "En Curso", color: "destructive" }
  }

  return { label: "Próximo", color: "default" }
}
