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
  homeTeam: string,
  awayTeam: string,
  matchDate: Date,
  homeTeamLogo?: string,
  awayTeamLogo?: string,
): Promise<string> {
  try {
    console.log("Creating match with data:", {
      groupId,
      homeTeam,
      awayTeam,
      matchDate: matchDate.toISOString()
    })

    const matchData: Omit<Match, "id"> = {
      groupId,
      homeTeam,
      awayTeam,
      homeTeamLogo,
      awayTeamLogo,
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
      throw new Error("Ya tienes un pronóstico para este partido. No se puede modificar.")
    }

    const prediction: Prediction = {
      uid: userId,
      createdAt: new Date(),
      stats: predictionStats,
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

  // Import scoring functions
  const { calculatePredictionPoints: calcPoints } = await import("./scoring")

  // Calculate points for each prediction
  for (const [userId, prediction] of Object.entries(updatedPredictions)) {
    const breakdown = calcPoints(prediction.stats, matchStats)
    
    updatedPredictions[userId] = {
      ...prediction,
      points: breakdown.total,
      breakdown,
    }
  }

  await updateDoc(matchRef, {
    predictions: updatedPredictions,
  })
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
