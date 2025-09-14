export interface Group {
  id: string
  name: string
  description: string
  adminId: string
  adminName: string
  participants: string[]
  participantNames: { [uid: string]: string }
  createdAt: Date
  isActive: boolean
  joinCode: string
  maxParticipants?: number
}

export interface MatchStats {
  // Resultado principal
  homeScore: number
  awayScore: number
  
  // Estadísticas adicionales
  homeCorners?: number
  awayCorners?: number
  homePenalties?: number
  awayPenalties?: number
  homeFreeKicks?: number
  awayFreeKicks?: number
  homeYellowCards?: number
  awayYellowCards?: number
  homeRedCards?: number
  awayRedCards?: number
}

export interface PredictionStats {
  // Pronóstico principal
  homeScore: number
  awayScore: number
  
  // Pronósticos adicionales
  homeCorners?: number
  awayCorners?: number
  homePenalties?: number
  awayPenalties?: number
  homeFreeKicks?: number
  awayFreeKicks?: number
  homeYellowCards?: number
  awayYellowCards?: number
  homeRedCards?: number
  awayRedCards?: number
}

export interface Match {
  id: string
  groupId: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  matchDate: Date
  isFinished: boolean
  predictions: { [uid: string]: Prediction }
  stats?: MatchStats
}

export interface Prediction {
  uid: string
  createdAt: Date
  points?: number
  breakdown?: {
    exactScore: number
    result: number
    corners: number
    penalties: number
    freeKicks: number
    yellowCards: number
    redCards: number
    streakBonus: number
    total: number
  }
  stats: PredictionStats
}

export interface UserStats {
  uid: string
  groupId: string
  totalPoints: number
  correctResults: number
  exactScores: number
  totalPredictions: number
  position: number
  currentStreak: number
  longestStreak: number
  avgPointsPerMatch: number
}
