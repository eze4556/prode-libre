export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'banned'

export interface GroupMembership {
  uid: string
  userName: string
  userEmail: string
  status: MembershipStatus
  requestedAt: Date
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectedBy?: string
  rejectionReason?: string
}

export interface Group {
  id: string
  name: string
  description: string
  adminId: string
  adminName: string
  participants: string[]
  participantNames: { [uid: string]: string }
  memberships: { [uid: string]: GroupMembership }
  createdAt: Date
  isActive: boolean
  joinCode: string
  maxParticipants?: number
  requiresApproval: boolean
}

export interface Jornada {
  id: string
  groupId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  createdBy: string
}

export interface MatchStats {
  // Solo resultado del partido (sin goles)
  result: 'local' | 'empate' | 'visitante'
}

export interface PredictionStats {
  // Solo resultado predicho
  result: 'local' | 'empate' | 'visitante'
}

export interface Match {
  id: string
  groupId: string
  jornadaId: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo?: string | null
  awayTeamLogo?: string | null
  matchDate: Date
  isFinished: boolean
  predictions: { [uid: string]: Prediction }
  stats?: MatchStats
}

export interface Prediction {
  uid: string
  createdAt: Date
  updatedAt?: Date
  points?: number
  breakdown?: {
    result: number  // Solo puntos por resultado correcto
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
