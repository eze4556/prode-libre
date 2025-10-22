"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/lib/groups"
import { getUserMatches, getMatchesByJornada } from "@/lib/matches"
import { getJornadasByGroup } from "@/lib/jornadas"
import type { Group, Match, Prediction, Jornada } from "@/lib/types"
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
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>("")

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const userGroups = await getUserGroups(userProfile.uid)
      const adminGroups = userGroups.filter(group => group.adminId === userProfile.uid)
      setGroups(adminGroups)

      // Load jornadas for all groups
      const allJornadas: Jornada[] = []
      for (const group of adminGroups) {
        const groupJornadas = await getJornadasByGroup(group.id)
        allJornadas.push(...groupJornadas)
      }
      setJornadas(allJornadas)

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
    // Si hay nombre, mostrarlo; si no, mostrar el userId parcialmente, nunca 'Usuario desconocido'
    if (group.participantNames?.[userId]) return group.participantNames[userId]
    if (userId) return `ID: ${userId.slice(0, 6)}...`
    return "Participante"
  }

  const getJornadasByGroupId = (groupId: string) => {
    return jornadas.filter(jornada => jornada.groupId === groupId)
  }

  const getMatchesByJornadaId = async (jornadaId: string) => {
    try {
      return await getMatchesByJornada(jornadaId)
    } catch (error) {
      console.error("Error loading jornada matches:", error)
      return []
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Gestión de Participantes</h2>
          <p className="text-sm sm:text-base text-slate-600">Ve las puntuaciones y perfiles de tus grupos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Grupos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Grupos administrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Partidos</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">Total de partidos</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Finalizados</CardTitle>
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{matches.filter(m => m.isFinished).length}</div>
            <p className="text-xs text-muted-foreground">Con resultados</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <div className="space-y-3 sm:space-y-4">
        {groups.map((group) => {
          const groupMatches = getGroupMatches(group.id)
          const finishedMatches = groupMatches.filter(match => match.isFinished)
          // Filtrar adminId del listado de participantes
          const participants = Object.keys(group.participantNames || {}).filter(uid => uid !== group.adminId)
          
          return (
            <Card key={group.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Group Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 truncate">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                        <span className="truncate">{group.name}</span>
                      </CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          {participants.length - 1} participantes
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          {groupMatches.length} partidos
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          {finishedMatches.length} finalizados
                        </span>
                      </CardDescription>
                    </div>
                    
                    {/* Button */}
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedGroup(selectedGroup?.id === group.id ? null : group)
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto touch-manipulation min-h-[44px] text-xs sm:text-sm"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate">
                        {selectedGroup?.id === group.id ? "Ocultar" : "Ver Participantes"}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedGroup?.id === group.id && (
                <CardContent className="p-3 sm:p-6 pt-0">
                  {/* Filtros */}
                  <div className="mb-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Filtrar por:</label>
                        <select
                          value={selectedJornadaId}
                          onChange={(e) => setSelectedJornadaId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Todos los partidos del grupo</option>
                          {getJornadasByGroupId(group.id).map((jornada) => (
                            <option key={jornada.id} value={jornada.id}>
                              {jornada.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="group-ranking" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8 sm:h-10">
                      <TabsTrigger value="group-ranking" className="text-xs sm:text-sm">Ranking Grupo</TabsTrigger>
                      <TabsTrigger value="jornada-ranking" className="text-xs sm:text-sm">Ranking Jornada</TabsTrigger>
                      <TabsTrigger value="participants" className="text-xs sm:text-sm">Participantes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="group-ranking" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-2 sm:space-y-3">
                        {participants.length - 1 === 0 ? (
                          <div className="text-center py-6 sm:py-8">
                            <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-muted-foreground">No hay participantes en este grupo</p>
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

                    <TabsContent value="jornada-ranking" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      {selectedJornadaId ? (
                        <JornadaRanking 
                          group={group} 
                          jornadaId={selectedJornadaId}
                          participants={participants}
                          getUserName={getUserName}
                        />
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                          <p className="text-sm sm:text-base text-muted-foreground">Selecciona una jornada para ver su ranking</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="participants" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
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
    <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 ${getPositionColor(position)}`}>
          {getPositionIcon(position)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{participant.userName}</h4>
          <p className="text-xs sm:text-sm text-slate-600 truncate">
            {participant.stats.totalPredictions} pronósticos • Promedio: {participant.stats.averagePoints} pts
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <div className="text-lg sm:text-2xl font-bold text-slate-800">{participant.stats.totalPoints}</div>
        <div className="text-xs sm:text-sm text-slate-600">puntos</div>
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
    .map(match => ({
      prediction: match.predictions[userId],
      match: match
    }))
    .filter(item => item.prediction && item.prediction.points !== undefined)

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
          <span className="truncate">{userName}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Participante desde {new Intl.DateTimeFormat("es-ES").format(group.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-blue-700">{stats.totalPoints}</div>
            <div className="text-xs sm:text-sm text-blue-600">Puntos Totales</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-green-700">{stats.exactScores}</div>
            <div className="text-xs sm:text-sm text-green-600">Aciertos Exactos</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-yellow-700">{stats.partialScores}</div>
            <div className="text-xs sm:text-sm text-yellow-600">Aciertos Parciales</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-red-700">{stats.currentStreak}</div>
            <div className="text-xs sm:text-sm text-red-600">Racha Actual</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
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
            <h5 className="font-semibold mb-2 text-slate-700 text-sm sm:text-base">Últimos Pronósticos</h5>
            <div className="space-y-1">
              {userPredictions.slice(-3).map((item, index) => (
                <div key={index} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground truncate">
                    {new Intl.DateTimeFormat("es-ES").format(item.match.matchDate)}
                  </span>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                    {item.prediction.points} pts
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

// Component for Jornada Ranking
function JornadaRanking({ 
  group, 
  jornadaId, 
  participants, 
  getUserName 
}: { 
  group: Group
  jornadaId: string
  participants: string[]
  getUserName: (userId: string, group: Group) => string
}) {
  const [jornadaMatches, setJornadaMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJornadaMatches = async () => {
      try {
        const matches = await getMatchesByJornada(jornadaId)
        setJornadaMatches(matches)
      } catch (error) {
        console.error("Error loading jornada matches:", error)
      } finally {
        setLoading(false)
      }
    }
    loadJornadaMatches()
  }, [jornadaId])

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm sm:text-base text-muted-foreground">Cargando ranking de jornada...</p>
      </div>
    )
  }

  if (jornadaMatches.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <Target className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-muted-foreground">No hay partidos en esta jornada</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {participants
        .map(userId => ({
          userId,
          userName: getUserName(userId, group),
          stats: calculateUserStats(userId, jornadaMatches),
          position: getRankingPosition(userId, jornadaMatches)
        }))
        .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
        .map((participant, index) => (
          <ParticipantRankingCard
            key={participant.userId}
            participant={participant}
            position={index + 1}
            groupMatches={jornadaMatches}
          />
        ))}
    </div>
  )
}

// Helper function to get ranking position
function getRankingPosition(userId: string, groupMatches: Match[]) {
  const finishedMatches = groupMatches.filter(match => match.isFinished)
  
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


