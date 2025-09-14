import type { MatchStats, PredictionStats, Prediction } from "./types"

export interface ScoringBreakdown {
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

export interface ScoringConfig {
  exactScore: number
  result: number
  corners: number
  penalties: number
  freeKicks: number
  yellowCards: number
  redCards: number
  streakBonusMultiplier: number
}

// Configuración de puntuación por defecto
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  exactScore: 3,      // Acierto exacto (resultado + cantidad)
  result: 1,          // Acierto parcial (solo resultado)
  corners: 1,         // Acierto en corners
  penalties: 2,      // Acierto en penales
  freeKicks: 1,       // Acierto en tiros libres
  yellowCards: 1,     // Acierto en tarjetas amarillas
  redCards: 2,        // Acierto en tarjetas rojas
  streakBonusMultiplier: 0.5, // Bonus por racha (50% extra)
}

// Función para calcular puntos de un pronóstico
export function calculatePredictionPoints(
  prediction: PredictionStats,
  actualStats: MatchStats,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  streakCount: number = 0
): ScoringBreakdown {
  const breakdown: ScoringBreakdown = {
    exactScore: 0,
    result: 0,
    corners: 0,
    penalties: 0,
    freeKicks: 0,
    yellowCards: 0,
    redCards: 0,
    streakBonus: 0,
    total: 0,
  }

  // 1. Acierto Exacto (3 puntos)
  if (prediction.homeScore === actualStats.homeScore && 
      prediction.awayScore === actualStats.awayScore) {
    breakdown.exactScore = config.exactScore
  }

  // 2. Acierto Parcial - Solo Resultado (1 punto)
  if (breakdown.exactScore === 0) {
    const predictionResult = getMatchResult(prediction.homeScore, prediction.awayScore)
    const actualResult = getMatchResult(actualStats.homeScore, actualStats.awayScore)
    
    if (predictionResult === actualResult) {
      breakdown.result = config.result
    }
  }

  // 3. Corners (1 punto cada uno)
  if (prediction.homeCorners !== undefined && actualStats.homeCorners !== undefined) {
    breakdown.corners += Math.min(config.corners, Math.abs(prediction.homeCorners - actualStats.homeCorners) === 0 ? config.corners : 0)
  }
  if (prediction.awayCorners !== undefined && actualStats.awayCorners !== undefined) {
    breakdown.corners += Math.min(config.corners, Math.abs(prediction.awayCorners - actualStats.awayCorners) === 0 ? config.corners : 0)
  }

  // 4. Penales (2 puntos cada uno)
  if (prediction.homePenalties !== undefined && actualStats.homePenalties !== undefined) {
    breakdown.penalties += Math.min(config.penalties, Math.abs(prediction.homePenalties - actualStats.homePenalties) === 0 ? config.penalties : 0)
  }
  if (prediction.awayPenalties !== undefined && actualStats.awayPenalties !== undefined) {
    breakdown.penalties += Math.min(config.penalties, Math.abs(prediction.awayPenalties - actualStats.awayPenalties) === 0 ? config.penalties : 0)
  }

  // 5. Tiros Libres (1 punto cada uno)
  if (prediction.homeFreeKicks !== undefined && actualStats.homeFreeKicks !== undefined) {
    breakdown.freeKicks += Math.min(config.freeKicks, Math.abs(prediction.homeFreeKicks - actualStats.homeFreeKicks) === 0 ? config.freeKicks : 0)
  }
  if (prediction.awayFreeKicks !== undefined && actualStats.awayFreeKicks !== undefined) {
    breakdown.freeKicks += Math.min(config.freeKicks, Math.abs(prediction.awayFreeKicks - actualStats.awayFreeKicks) === 0 ? config.freeKicks : 0)
  }

  // 6. Tarjetas Amarillas (1 punto cada una)
  if (prediction.homeYellowCards !== undefined && actualStats.homeYellowCards !== undefined) {
    breakdown.yellowCards += Math.min(config.yellowCards, Math.abs(prediction.homeYellowCards - actualStats.homeYellowCards) === 0 ? config.yellowCards : 0)
  }
  if (prediction.awayYellowCards !== undefined && actualStats.awayYellowCards !== undefined) {
    breakdown.yellowCards += Math.min(config.yellowCards, Math.abs(prediction.awayYellowCards - actualStats.awayYellowCards) === 0 ? config.yellowCards : 0)
  }

  // 7. Tarjetas Rojas (2 puntos cada una)
  if (prediction.homeRedCards !== undefined && actualStats.homeRedCards !== undefined) {
    breakdown.redCards += Math.min(config.redCards, Math.abs(prediction.homeRedCards - actualStats.homeRedCards) === 0 ? config.redCards : 0)
  }
  if (prediction.awayRedCards !== undefined && actualStats.awayRedCards !== undefined) {
    breakdown.redCards += Math.min(config.redCards, Math.abs(prediction.awayRedCards - actualStats.awayRedCards) === 0 ? config.redCards : 0)
  }

  // 8. Bonus por Racha
  if (streakCount > 0) {
    const basePoints = breakdown.exactScore + breakdown.result + breakdown.corners + 
                      breakdown.penalties + breakdown.freeKicks + breakdown.yellowCards + breakdown.redCards
    breakdown.streakBonus = Math.floor(basePoints * config.streakBonusMultiplier * streakCount)
  }

  // Total
  breakdown.total = breakdown.exactScore + breakdown.result + breakdown.corners + 
                   breakdown.penalties + breakdown.freeKicks + breakdown.yellowCards + 
                   breakdown.redCards + breakdown.streakBonus

  return breakdown
}

// Función auxiliar para determinar el resultado del partido
function getMatchResult(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

// Función para calcular estadísticas de usuario
export function calculateUserStats(
  predictions: Prediction[],
  groupId: string,
  userId: string
) {
  let totalPoints = 0
  let correctResults = 0
  let exactScores = 0
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  predictions.forEach((prediction) => {
    if (prediction.points) {
      totalPoints += prediction.points
    }

    if (prediction.breakdown) {
      if (prediction.breakdown.exactScore > 0) {
        exactScores++
        tempStreak++
      } else if (prediction.breakdown.result > 0) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }

      if (prediction.breakdown.result > 0 || prediction.breakdown.exactScore > 0) {
        correctResults++
      }
    }
  })

  longestStreak = Math.max(longestStreak, tempStreak)
  currentStreak = tempStreak

  return {
    uid: userId,
    groupId,
    totalPoints,
    correctResults,
    exactScores,
    totalPredictions: predictions.length,
    position: 0, // Se calculará después
    currentStreak,
    longestStreak,
    avgPointsPerMatch: predictions.length > 0 ? totalPoints / predictions.length : 0,
  }
}

// Función para obtener el emoji de resultado
export function getResultEmoji(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return '🏠'
  if (awayScore > homeScore) return '✈️'
  return '🤝'
}

// Función para formatear estadísticas para mostrar
export function formatStatsForDisplay(stats: MatchStats | PredictionStats): string {
  const parts = []
  
  parts.push(`⚽ ${stats.homeScore}-${stats.awayScore}`)
  
  if (stats.homeCorners !== undefined || stats.awayCorners !== undefined) {
    parts.push(`📐 ${stats.homeCorners || 0}-${stats.awayCorners || 0}`)
  }
  
  if (stats.homePenalties !== undefined || stats.awayPenalties !== undefined) {
    parts.push(`🎯 ${stats.homePenalties || 0}-${stats.awayPenalties || 0}`)
  }
  
  if (stats.homeFreeKicks !== undefined || stats.awayFreeKicks !== undefined) {
    parts.push(`⚡ ${stats.homeFreeKicks || 0}-${stats.awayFreeKicks || 0}`)
  }
  
  if (stats.homeYellowCards !== undefined || stats.awayYellowCards !== undefined) {
    parts.push(`🟨 ${stats.homeYellowCards || 0}-${stats.awayYellowCards || 0}`)
  }
  
  if (stats.homeRedCards !== undefined || stats.awayRedCards !== undefined) {
    parts.push(`🟥 ${stats.homeRedCards || 0}-${stats.awayRedCards || 0}`)
  }
  
  return parts.join(' • ')
}


