"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Target, 
  Flame, 
  BarChart3, 
  Star, 
  Lock, 
  CheckCircle,
  Filter,
  Search
} from "lucide-react"
import { 
  Achievement, 
  ALL_ACHIEVEMENTS, 
  getRarityColor, 
  getRarityBorderColor, 
  getCategoryEmoji 
} from "@/lib/achievements"

interface AchievementsDisplayProps {
  achievements: Achievement[]
  totalUnlocked: number
}

export function AchievementsDisplay({ achievements, totalUnlocked }: AchievementsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")

  const unlockedAchievements = achievements.filter(a => a.unlockedAt)
  const lockedAchievements = achievements.filter(a => !a.unlockedAt)

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || achievement.category === selectedCategory
    const matchesRarity = selectedRarity === "all" || achievement.rarity === selectedRarity
    
    return matchesSearch && matchesCategory && matchesRarity
  })

  const categories = [
    { id: "all", name: "Todos", icon: "🏆" },
    { id: "accuracy", name: "Precisión", icon: "🎯" },
    { id: "streak", name: "Rachas", icon: "🔥" },
    { id: "participation", name: "Participación", icon: "📊" },
    { id: "special", name: "Especiales", icon: "⭐" }
  ]

  const rarities = [
    { id: "all", name: "Todas", color: "gray" },
    { id: "common", name: "Común", color: "gray" },
    { id: "rare", name: "Raro", color: "blue" },
    { id: "epic", name: "Épico", color: "purple" },
    { id: "legendary", name: "Legendario", color: "yellow" }
  ]

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Sistema de Logros
          </CardTitle>
          <CardDescription>
            Desbloquea logros mientras mejoras tus pronósticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalUnlocked}</div>
              <div className="text-sm text-muted-foreground">Desbloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((totalUnlocked / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progreso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {achievements.filter(a => a.rarity === 'legendary' && a.unlockedAt).length}
              </div>
              <div className="text-sm text-muted-foreground">Legendarios</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar logros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtros de categoría y rareza */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Categoría:</span>
              </div>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Rareza:</span>
              {rarities.map(rarity => (
                <Button
                  key={rarity.id}
                  variant={selectedRarity === rarity.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRarity(rarity.id)}
                  className={`text-xs ${
                    rarity.id !== "all" ? `border-${rarity.color}-300 hover:bg-${rarity.color}-50` : ""
                  }`}
                >
                  {rarity.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para logros desbloqueados y bloqueados */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unlocked" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Desbloqueados ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Bloqueados ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements
              .filter(a => a.unlockedAt)
              .map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} isUnlocked={true} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements
              .filter(a => !a.unlockedAt)
              .map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} isUnlocked={false} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface AchievementCardProps {
  achievement: Achievement
  isUnlocked: boolean
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  const progressPercentage = achievement.progress && achievement.maxProgress 
    ? (achievement.progress / achievement.maxProgress) * 100 
    : 0

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${
      isUnlocked 
        ? `${getRarityBorderColor(achievement.rarity)} border-2` 
        : 'border-gray-200 opacity-75'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
              {achievement.icon}
            </div>
            <div>
              <CardTitle className={`text-sm sm:text-base ${isUnlocked ? '' : 'text-muted-foreground'}`}>
                {achievement.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getRarityColor(achievement.rarity)}`}
                >
                  {achievement.rarity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getCategoryEmoji(achievement.category)}
                </Badge>
              </div>
            </div>
          </div>
          {isUnlocked && (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className={`text-sm mb-3 ${isUnlocked ? '' : 'text-muted-foreground'}`}>
          {achievement.description}
        </CardDescription>
        
        {/* Progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className={isUnlocked ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
              {achievement.condition.description}
            </span>
            <span className={isUnlocked ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
              {achievement.progress || 0}/{achievement.maxProgress || 0}
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isUnlocked ? '' : 'opacity-50'}`}
          />
          
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-green-600 font-medium">
              Desbloqueado: {achievement.unlockedAt instanceof Date ? 
                achievement.unlockedAt.toLocaleDateString('es-ES') : 
                new Date(achievement.unlockedAt).toLocaleDateString('es-ES')
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
