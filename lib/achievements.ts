import { doc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'accuracy' | 'streak' | 'participation' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: {
    type: 'exact_scores' | 'total_points' | 'streak' | 'predictions_count' | 'perfect_match' | 'comeback'
    threshold: number
    description: string
  }
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

export interface UserAchievements {
  userId: string
  achievements: Achievement[]
  totalUnlocked: number
  lastUpdated: Date
}

// Definición de todos los logros disponibles
export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Logros de Precisión
  {
    id: 'first_exact',
    name: 'Primer Acierto Exacto',
    description: 'Acierta tu primer resultado exacto',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'common',
    condition: {
      type: 'exact_scores',
      threshold: 1,
      description: 'Acierta 1 resultado exacto'
    }
  },
  {
    id: 'exact_master',
    name: 'Maestro de la Precisión',
    description: 'Acierta 10 resultados exactos',
    icon: '🏹',
    category: 'accuracy',
    rarity: 'rare',
    condition: {
      type: 'exact_scores',
      threshold: 10,
      description: 'Acierta 10 resultados exactos'
    }
  },
  {
    id: 'exact_legend',
    name: 'Leyenda de la Precisión',
    description: 'Acierta 25 resultados exactos',
    icon: '👑',
    category: 'accuracy',
    rarity: 'legendary',
    condition: {
      type: 'exact_scores',
      threshold: 25,
      description: 'Acierta 25 resultados exactos'
    }
  },
  {
    id: 'perfect_match',
    name: 'Partido Perfecto',
    description: 'Acierta todos los aspectos de un partido (goles, corners, tarjetas, etc.)',
    icon: '💎',
    category: 'accuracy',
    rarity: 'epic',
    condition: {
      type: 'perfect_match',
      threshold: 1,
      description: 'Acierta un partido perfecto'
    }
  },

  // Logros de Racha
  {
    id: 'first_streak',
    name: 'Primera Racha',
    description: 'Consigue una racha de 3 aciertos seguidos',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: {
      type: 'streak',
      threshold: 3,
      description: 'Consigue una racha de 3 aciertos'
    }
  },
  {
    id: 'hot_streak',
    name: 'Racha Ardiente',
    description: 'Consigue una racha de 7 aciertos seguidos',
    icon: '🌋',
    category: 'streak',
    rarity: 'rare',
    condition: {
      type: 'streak',
      threshold: 7,
      description: 'Consigue una racha de 7 aciertos'
    }
  },
  {
    id: 'unstoppable',
    name: 'Imparable',
    description: 'Consigue una racha de 15 aciertos seguidos',
    icon: '⚡',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'streak',
      threshold: 15,
      description: 'Consigue una racha de 15 aciertos'
    }
  },
  {
    id: 'prophet',
    name: 'Profeta del Fútbol',
    description: 'Consigue una racha de 25 aciertos seguidos',
    icon: '🔮',
    category: 'streak',
    rarity: 'legendary',
    condition: {
      type: 'streak',
      threshold: 25,
      description: 'Consigue una racha de 25 aciertos'
    }
  },

  // Logros de Participación
  {
    id: 'first_prediction',
    name: 'Primer Pronóstico',
    description: 'Haz tu primer pronóstico',
    icon: '🎲',
    category: 'participation',
    rarity: 'common',
    condition: {
      type: 'predictions_count',
      threshold: 1,
      description: 'Haz 1 pronóstico'
    }
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Haz 50 pronósticos',
    icon: '📊',
    category: 'participation',
    rarity: 'rare',
    condition: {
      type: 'predictions_count',
      threshold: 50,
      description: 'Haz 50 pronósticos'
    }
  },
  {
    id: 'veteran',
    name: 'Veterano',
    description: 'Haz 100 pronósticos',
    icon: '🏆',
    category: 'participation',
    rarity: 'epic',
    condition: {
      type: 'predictions_count',
      threshold: 100,
      description: 'Haz 100 pronósticos'
    }
  },
  {
    id: 'legend',
    name: 'Leyenda',
    description: 'Haz 250 pronósticos',
    icon: '🌟',
    category: 'participation',
    rarity: 'legendary',
    condition: {
      type: 'predictions_count',
      threshold: 250,
      description: 'Haz 250 pronósticos'
    }
  },

  // Logros de Puntos
  {
    id: 'first_points',
    name: 'Primeros Puntos',
    description: 'Consigue tus primeros 10 puntos',
    icon: '⭐',
    category: 'special',
    rarity: 'common',
    condition: {
      type: 'total_points',
      threshold: 10,
      description: 'Consigue 10 puntos'
    }
  },
  {
    id: 'point_master',
    name: 'Maestro de Puntos',
    description: 'Consigue 100 puntos',
    icon: '💯',
    category: 'special',
    rarity: 'rare',
    condition: {
      type: 'total_points',
      threshold: 100,
      description: 'Consigue 100 puntos'
    }
  },
  {
    id: 'point_legend',
    name: 'Leyenda de Puntos',
    description: 'Consigue 500 puntos',
    icon: '🏅',
    category: 'special',
    rarity: 'epic',
    condition: {
      type: 'total_points',
      threshold: 500,
      description: 'Consigue 500 puntos'
    }
  },
  {
    id: 'point_god',
    name: 'Dios de los Puntos',
    description: 'Consigue 1000 puntos',
    icon: '👑',
    category: 'special',
    rarity: 'legendary',
    condition: {
      type: 'total_points',
      threshold: 1000,
      description: 'Consigue 1000 puntos'
    }
  },

  // Logros Especiales
  {
    id: 'comeback_king',
    name: 'Rey del Remonte',
    description: 'Acierta un resultado después de fallar 5 pronósticos seguidos',
    icon: '🔄',
    category: 'special',
    rarity: 'epic',
    condition: {
      type: 'comeback',
      threshold: 1,
      description: 'Acierta después de fallar 5 seguidos'
    }
  }
]

// Función para calcular logros basados en estadísticas del usuario
export function calculateAchievements(
  userStats: {
    totalPoints: number
    exactScores: number
    totalPredictions: number
    longestStreak: number
    currentStreak: number
  },
  predictions: Array<{
    points?: number
    breakdown?: {
      exactScore: number
      result: number
      corners: number
      penalties: number
      freeKicks: number
      yellowCards: number
      redCards: number
      total: number
    }
  }>
): Achievement[] {
  const unlockedAchievements: Achievement[] = []

  // Calcular progreso para cada logro
  ALL_ACHIEVEMENTS.forEach(achievement => {
    let progress = 0
    let maxProgress = achievement.condition.threshold
    let isUnlocked = false

    switch (achievement.condition.type) {
      case 'exact_scores':
        progress = userStats.exactScores
        isUnlocked = progress >= achievement.condition.threshold
        break

      case 'total_points':
        progress = userStats.totalPoints
        isUnlocked = progress >= achievement.condition.threshold
        break

      case 'streak':
        progress = userStats.longestStreak
        isUnlocked = progress >= achievement.condition.threshold
        break

      case 'predictions_count':
        progress = userStats.totalPredictions
        isUnlocked = progress >= achievement.condition.threshold
        break

      case 'perfect_match':
        // Contar partidos perfectos (todos los aspectos acertados)
        progress = predictions.filter(p => 
          p.breakdown && 
          p.breakdown.exactScore > 0 && 
          p.breakdown.corners > 0 && 
          p.breakdown.penalties > 0 && 
          p.breakdown.freeKicks > 0 && 
          p.breakdown.yellowCards > 0 && 
          p.breakdown.redCards > 0
        ).length
        isUnlocked = progress >= achievement.condition.threshold
        break

      case 'comeback':
        // Lógica para detectar remontes (simplificada)
        let consecutiveMisses = 0
        let comebackCount = 0
        
        predictions.forEach(p => {
          if (p.breakdown && (p.breakdown.exactScore > 0 || p.breakdown.result > 0)) {
            if (consecutiveMisses >= 5) {
              comebackCount++
            }
            consecutiveMisses = 0
          } else {
            consecutiveMisses++
          }
        })
        
        progress = comebackCount
        isUnlocked = progress >= achievement.condition.threshold
        break
    }

    // Crear el logro con progreso
    const achievementWithProgress: Achievement = {
      ...achievement,
      progress: Math.min(progress, maxProgress),
      maxProgress,
      unlockedAt: isUnlocked ? new Date() : undefined
    }

    unlockedAchievements.push(achievementWithProgress)
  })

  return unlockedAchievements
}

// Función para obtener el color según la rareza
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'text-gray-600 bg-gray-100'
    case 'rare':
      return 'text-blue-600 bg-blue-100'
    case 'epic':
      return 'text-purple-600 bg-purple-100'
    case 'legendary':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Función para obtener el color del borde según la rareza
export function getRarityBorderColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'border-gray-300'
    case 'rare':
      return 'border-blue-300'
    case 'epic':
      return 'border-purple-300'
    case 'legendary':
      return 'border-yellow-300'
    default:
      return 'border-gray-300'
  }
}

// Función para obtener el emoji de categoría
export function getCategoryEmoji(category: Achievement['category']): string {
  switch (category) {
    case 'accuracy':
      return '🎯'
    case 'streak':
      return '🔥'
    case 'participation':
      return '📊'
    case 'special':
      return '⭐'
    default:
      return '🏆'
  }
}

// Nueva función para calcular y guardar logros en el perfil del usuario
export async function updateUserAchievements(userId: string, predictions: any[], userStats: any) {
  const achievements = calculateAchievements(userStats, predictions)
  // Solo guardar los logros desbloqueados
  const unlocked = achievements.filter(a => a.unlockedAt).map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    unlockedAt: a.unlockedAt,
    rarity: a.rarity
  }))
  // Guardar en el perfil del usuario (colección 'users')
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, { achievements: unlocked })
}