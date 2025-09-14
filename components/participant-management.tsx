"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/lib/groups"
import { getUserMatches } from "@/lib/matches"
import type { Group, Match, Prediction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Users, Trophy, Target, Calendar, Crown, Eye, BarChart3 } from "lucide-react"

export function ParticipantManagement() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const userGroups = await getUserGroups(userProfile.uid)
      const adminGroups = userGroups.filter(group => group.adminId === userProfile.uid)
      setGroups(adminGroups)

      if (adminGroups.length > 0) {
        const groupIds = adminGroups.map(g => g.id)
        const userMatches = await getUserMatches(groupIds)
        setMatches(userMatches)
      }
    } catch (error) {
      console.error("Error loading participant data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getUserName = (userId: string, group: Group) => {
    return group.participantNames?.[userId] || "Usuario desconocido"
  }

  const getGroupMatches = (groupId: string) => {
    return matches.filter(match => match.groupId === groupId)
  }

  const calculateUserStats = (userId: string, groupMatches: Match[]) => {
    let totalPoints = 0
    let totalPredictions = 0
    let exactScores = 0
    let partialScores = 0
    let noScores = 0
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const finishedMatches = groupMatches.filter(match => match.isFinished)

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
            partialScores++
            tempStreak++
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            noScores++
            tempStreak = 0
          }
        }
      }
    })

    currentStreak = tempStreak

    return {
      totalPoints,
      totalPredictions,
      exactScores,
      partialScores,
      noScores,
      currentStreak,
      longestStreak,
      averagePoints: totalPredictions > 0 ? (totalPoints / totalPredictions).toFixed(1) : 0
    }
  }

  const getRankingPosition = (userId: string, groupMatches: Match[]) => {
    const finishedMatches = groupMatches.filter(match => match.isFinished)
    const userStats = calculateUserStats(userId, groupMatches)
    
    const allUsers = new Set<string>()
    finishedMatches.forEach(match => {
      Object.keys(match.predictions).forEach(uid => {
        if (match.predictions[uid] && match.predictions[uid].points !== undefined) {
          allUsers.add(uid)
        }
      })
    })

    const sortedUsers = Array.from(allUsers).sort((a, b) => {
      const statsA = calculateUserStats(a, groupMatches)
      const statsB = calculateUserStats(b, groupMatches)
      return statsB.totalPoints - statsA.totalPoints
    })

    return sortedUsers.indexOf(userId) + 1
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando participantes...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Debes iniciar sesión para gestionar participantes</p>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes grupos administrados</h3>
          <p className="text-muted-foreground">Crea un grupo para poder gestionar participantes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Participantes</h2>
          <p className="text-slate-600">Ve las puntuaciones y perfiles de tus grupos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Grupos administrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">Total de partidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.filter(m => m.isFinished).length}</div>
            <p className="text-xs text-muted-foreground">Con resultados</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {groups.map((group) => {
          const groupMatches = getGroupMatches(group.id)
          const finishedMatches = groupMatches.filter(match => match.isFinished)
          const participants = Object.keys(group.participantNames || {})
          
          return (
            <Card key={group.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      {group.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {participants.length} participantes
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {groupMatches.length} partidos
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {finishedMatches.length} finalizados
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {selectedGroup?.id === group.id ? "Ocultar" : "Ver Participantes"}
                  </Button>
                </div>
              </CardHeader>

              {selectedGroup?.id === group.id && (
                <CardContent>
                  <Tabs defaultValue="ranking" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="ranking">Ranking</TabsTrigger>
                      <TabsTrigger value="participants">Participantes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ranking" className="space-y-4">
                      <div className="space-y-3">
                        {participants.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay participantes en este grupo</p>
                          </div>
                        ) : (
                          participants
                            .map(userId => ({
                              userId,
                              userName: getUserName(userId, group),
                              stats: calculateUserStats(userId, groupMatches),
                              position: getRankingPosition(userId, groupMatches)
                            }))
                            .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
                            .map((participant, index) => (
                              <ParticipantRankingCard
                                key={participant.userId}
                                participant={participant}
                                position={index + 1}
                                groupMatches={groupMatches}
                              />
                            ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="participants" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {participants.map((userId) => (
                          <ParticipantProfileCard
                            key={userId}
                            userId={userId}
                            userName={getUserName(userId, group)}
                            group={group}
                            groupMatches={groupMatches}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

interface ParticipantRankingCardProps {
  participant: {
    userId: string
    userName: string
    stats: any
    position: number
  }
  position: number
  groupMatches: Match[]
}

function ParticipantRankingCard({ participant, position, groupMatches }: ParticipantRankingCardProps) {
  const getPositionIcon = (pos: number) => {
    switch (pos) {
      case 1: return "🥇"
      case 2: return "🥈"
      case 3: return "🥉"
      default: return `#${pos}`
    }
  }

  const getPositionColor = (pos: number) => {
    switch (pos) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600"
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500"
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-600"
      default: return "bg-gradient-to-r from-blue-500 to-blue-700"
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getPositionColor(position)}`}>
          {getPositionIcon(position)}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{participant.userName}</h4>
          <p className="text-sm text-slate-600">
            {participant.stats.totalPredictions} pronósticos • Promedio: {participant.stats.averagePoints} pts
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-800">{participant.stats.totalPoints}</div>
        <div className="text-sm text-slate-600">puntos totales</div>
      </div>
    </div>
  )
}

interface ParticipantProfileCardProps {
  userId: string
  userName: string
  group: Group
  groupMatches: Match[]
}

function ParticipantProfileCard({ userId, userName, group, groupMatches }: ParticipantProfileCardProps) {
  const stats = calculateUserStats(userId, groupMatches)
  const finishedMatches = groupMatches.filter(match => match.isFinished)
  const userPredictions = finishedMatches
    .map(match => match.predictions[userId])
    .filter(prediction => prediction && prediction.points !== undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          {userName}
        </CardTitle>
        <CardDescription>
          Participante desde {new Intl.DateTimeFormat("es-ES").format(group.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.totalPoints}</div>
            <div className="text-sm text-blue-600">Puntos Totales</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.exactScores}</div>
            <div className="text-sm text-green-600">Aciertos Exactos</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{stats.partialScores}</div>
            <div className="text-sm text-yellow-600">Aciertos Parciales</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{stats.currentStreak}</div>
            <div className="text-sm text-red-600">Racha Actual</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pronósticos realizados:</span>
            <span className="font-medium">{stats.totalPredictions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Promedio por partido:</span>
            <span className="font-medium">{stats.averagePoints} puntos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mejor racha:</span>
            <span className="font-medium">{stats.longestStreak} partidos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sin acierto:</span>
            <span className="font-medium">{stats.noScores} partidos</span>
          </div>
        </div>

        {/* Recent Predictions */}
        {userPredictions.length > 0 && (
          <div>
            <h5 className="font-semibold mb-2 text-slate-700">Últimos Pronósticos</h5>
            <div className="space-y-1">
              {userPredictions.slice(-3).map((prediction, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Intl.DateTimeFormat("es-ES").format(prediction.createdAt)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {prediction.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to calculate user stats (moved outside component to avoid re-creation)
function calculateUserStats(userId: string, groupMatches: Match[]) {
  let totalPoints = 0
  let totalPredictions = 0
  let exactScores = 0
  let partialScores = 0
  let noScores = 0
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const finishedMatches = groupMatches.filter(match => match.isFinished)

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
          partialScores++
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          noScores++
          tempStreak = 0
        }
      }
    }
  })

  currentStreak = tempStreak

  return {
    totalPoints,
    totalPredictions,
    exactScores,
    partialScores,
    noScores,
    currentStreak,
    longestStreak,
    averagePoints: totalPredictions > 0 ? (totalPoints / totalPredictions).toFixed(1) : 0
  }
}


