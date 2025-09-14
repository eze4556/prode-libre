"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/lib/groups"
import { getUserMatches, submitPrediction, canPredict, getUserPrediction, getMatchStatus } from "@/lib/matches"
import type { Group, Match, PredictionStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Target, CheckCircle, XCircle, Trophy, Calendar, Users, Eye, EyeOff } from "lucide-react"

export function PredictionSystem() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      console.log("PredictionSystem loadData called with userProfile:", userProfile.uid)
      
      const userGroups = await getUserGroups(userProfile.uid)
      console.log("User groups loaded:", userGroups.length)
      console.log("Group IDs:", userGroups.map(g => g.id))
      
      setGroups(userGroups)

      const groupIds = userGroups.map((g) => g.id)
      const userMatches = await getUserMatches(groupIds)
      console.log("User matches loaded:", userMatches.length)
      
      setMatches(userMatches)
    } catch (error) {
      console.error("Error in PredictionSystem loadData:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPrediction = async (matchId: string, predictionStats: PredictionStats) => {
    if (!userProfile) return

    setSubmitting(matchId)
    try {
      console.log("Submitting prediction for match:", matchId, "stats:", predictionStats)
      await submitPrediction(matchId, userProfile.uid, predictionStats)
      toast({
        title: "¡Pronóstico guardado!",
        description: "Tu predicción ha sido registrada correctamente",
      })
      loadData() // Reload to show updated prediction
    } catch (error: any) {
      console.error("Error submitting prediction:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el pronóstico",
        variant: "destructive",
      })
    } finally {
      setSubmitting(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    return group?.name || "Grupo desconocido"
  }

  const upcomingMatches = matches.filter((m) => !m.isFinished)
  const finishedMatches = matches.filter((m) => m.isFinished)

  const calculatePersonalStats = () => {
    if (!userProfile) return { totalPoints: 0, exactScores: 0, partialScores: 0, averagePoints: 0 }

    let totalPoints = 0
    let totalPredictions = 0
    let exactScores = 0
    let partialScores = 0

    finishedMatches.forEach(match => {
      const prediction = match.predictions[userProfile.uid]
      if (prediction && prediction.points !== undefined) {
        totalPredictions++
        totalPoints += prediction.points

        if (prediction.breakdown) {
          if (prediction.breakdown.exactScore > 0) {
            exactScores++
          } else if (prediction.breakdown.result > 0) {
            partialScores++
          }
        }
      }
    })

    return {
      totalPoints,
      exactScores,
      partialScores,
      averagePoints: totalPredictions > 0 ? (totalPoints / totalPredictions).toFixed(1) : "0.0"
    }
  }

  const calculateGroupUserStats = (userId: string, finishedMatches: Match[]) => {
    let totalPoints = 0
    let totalPredictions = 0
    let exactScores = 0
    let partialScores = 0

    finishedMatches.forEach(match => {
      const prediction = match.predictions[userId]
      if (prediction && prediction.points !== undefined) {
        totalPredictions++
        totalPoints += prediction.points

        if (prediction.breakdown) {
          if (prediction.breakdown.exactScore > 0) {
            exactScores++
          } else if (prediction.breakdown.result > 0) {
            partialScores++
          }
        }
      }
    })

    return {
      totalPoints,
      exactScores,
      partialScores,
      totalPredictions,
      averagePoints: totalPredictions > 0 ? (totalPoints / totalPredictions).toFixed(1) : "0.0"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando pronósticos...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Debes iniciar sesión para hacer pronósticos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mis Pronósticos</h2>
          <p className="text-slate-600">Realiza tus predicciones para los próximos partidos</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResults(!showResults)}
            className="flex items-center gap-2"
          >
            {showResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showResults ? "Ocultar Resultados" : "Ver Resultados"}
          </Button>
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
            <p className="text-xs text-muted-foreground">Grupos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">Partidos por jugar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedMatches.length}</div>
            <p className="text-xs text-muted-foreground">Partidos jugados</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Stats */}
      {finishedMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Mis Estadísticas</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Puntos Totales</CardTitle>
                <Trophy className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{calculatePersonalStats().totalPoints}</div>
                <p className="text-xs text-blue-600">Puntos acumulados</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Aciertos Exactos</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{calculatePersonalStats().exactScores}</div>
                <p className="text-xs text-green-600">Resultado + goles</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">Aciertos Parciales</CardTitle>
                <CheckCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{calculatePersonalStats().partialScores}</div>
                <p className="text-xs text-yellow-600">Solo resultado</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Promedio</CardTitle>
                <Trophy className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{calculatePersonalStats().averagePoints}</div>
                <p className="text-xs text-purple-600">Puntos por partido</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Group Rankings */}
      {groups.length > 0 && finishedMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Ranking por Grupo</h3>
          <div className="space-y-4">
            {groups.map(group => {
              const groupMatches = matches.filter(match => match.groupId === group.id)
              const finishedGroupMatches = groupMatches.filter(match => match.isFinished)
              
              if (finishedGroupMatches.length === 0) return null

              const participants = Object.keys(group.participantNames || {})
              const participantStats = participants.map(userId => ({
                userId,
                userName: group.participantNames?.[userId] || "Usuario desconocido",
                stats: calculateGroupUserStats(userId, finishedGroupMatches)
              })).sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)

              return (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>
                      {participantStats.length} participantes • {finishedGroupMatches.length} partidos finalizados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {participantStats.slice(0, 5).map((participant, index) => (
                        <div key={participant.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                              index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-500" :
                              index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                              "bg-gradient-to-r from-blue-500 to-blue-700"
                            }`}>
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {participant.userName}
                                {participant.userId === userProfile?.uid && " (Tú)"}
                              </p>
                              <p className="text-sm text-slate-600">
                                {participant.stats.totalPredictions} pronósticos • Promedio: {participant.stats.averagePoints} pts
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-slate-800">{participant.stats.totalPoints}</div>
                            <div className="text-sm text-slate-600">puntos</div>
                          </div>
                        </div>
                      ))}
                      {participantStats.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          ... y {participantStats.length - 5} participantes más
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Próximos Partidos</TabsTrigger>
          <TabsTrigger value="finished">Partidos Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay partidos próximos</h3>
                <p className="text-muted-foreground">Los administradores aún no han creado partidos</p>
              </CardContent>
            </Card>
          ) : (
            upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userProfile={userProfile}
                onSubmit={handleSubmitPrediction}
                submitting={submitting === match.id}
                showResults={showResults}
                getGroupName={getGroupName}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-6">
          {finishedMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay partidos finalizados</h3>
                <p className="text-muted-foreground">Los resultados aparecerán aquí una vez que se carguen</p>
              </CardContent>
            </Card>
          ) : (
            // Agrupar partidos por grupo
            groups.map(group => {
              const groupFinishedMatches = finishedMatches.filter(match => match.groupId === group.id)
              
              if (groupFinishedMatches.length === 0) return null
              
              return (
                <div key={group.id} className="space-y-4">
                  {/* Header del grupo */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
                      <p className="text-sm text-slate-600">{groupFinishedMatches.length} partido{groupFinishedMatches.length !== 1 ? 's' : ''} finalizado{groupFinishedMatches.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  {/* Partidos del grupo */}
                  <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                    {groupFinishedMatches.map((match) => (
                      <div key={match.id} className="relative">
                        <MatchCard
                          match={match}
                          userProfile={userProfile}
                          onSubmit={handleSubmitPrediction}
                          submitting={submitting === match.id}
                          showResults={true}
                          getGroupName={getGroupName}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MatchCardProps {
  match: Match
  userProfile: any
  onSubmit: (matchId: string, predictionStats: PredictionStats) => Promise<void>
  submitting: boolean
  showResults: boolean
  getGroupName: (groupId: string) => string
}

function MatchCard({ match, userProfile, onSubmit, submitting, showResults, getGroupName }: MatchCardProps) {
  const [predictionStats, setPredictionStats] = useState<PredictionStats>({
    homeScore: 0,
    awayScore: 0,
    homeCorners: 0,
    awayCorners: 0,
    homePenalties: 0,
    awayPenalties: 0,
    homeFreeKicks: 0,
    awayFreeKicks: 0,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
  })

  const userPrediction = match.predictions[userProfile.uid]
  const canMakePredict = canPredict(match, userProfile.uid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(match.id, predictionStats)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card className={`${match.isFinished ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md' : 'border-slate-200'} transition-all duration-300 hover:shadow-lg`}>
      <CardHeader className={`${match.isFinished ? 'bg-green-100/50 border-b border-green-200' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`text-lg ${match.isFinished ? 'text-green-800' : 'text-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {match.homeTeamLogo && (
                    <img 
                      src={match.homeTeamLogo} 
                      alt={match.homeTeam}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span>{match.homeTeam}</span>
                </div>
                <span className="text-muted-foreground">vs</span>
                <div className="flex items-center gap-2">
                  <span>{match.awayTeam}</span>
                  {match.awayTeamLogo && (
                    <img 
                      src={match.awayTeamLogo} 
                      alt={match.awayTeam}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </CardTitle>
            <CardDescription className={`flex items-center gap-2 mt-1 ${match.isFinished ? 'text-green-700' : 'text-slate-600'}`}>
              <Calendar className="w-4 h-4" />
              {formatDate(match.matchDate)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${match.isFinished ? 'border-green-300 text-green-700' : ''}`}>
              {getGroupName(match.groupId)}
            </Badge>
            <Badge className={`${match.isFinished ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-blue-500 text-white border-blue-500'}`}>
              {match.isFinished ? (
                <>
                  <Trophy className="w-3 h-3 mr-1" />
                  Finalizado
                </>
              ) : (
                <>
                  <Target className="w-3 h-3 mr-1" />
                  Próximo
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showResults && match.isFinished && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Resultado Final</h4>
            </div>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  {match.homeTeamLogo && (
                    <img 
                      src={match.homeTeamLogo} 
                      alt={match.homeTeam}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span className="text-lg font-semibold text-green-700">{match.homeTeam}</span>
                </div>
                <div className="text-3xl font-bold text-green-700">
                  {match.stats?.homeScore || 0} - {match.stats?.awayScore || 0}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-green-700">{match.awayTeam}</span>
                  {match.awayTeamLogo && (
                    <img 
                      src={match.awayTeamLogo} 
                      alt={match.awayTeam}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            {match.stats && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="font-medium text-green-700">Corners:</span>
                  <span className="text-green-600">{match.stats.homeCorners || 0} - {match.stats.awayCorners || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="font-medium text-green-700">Penales:</span>
                  <span className="text-green-600">{match.stats.homePenalties || 0} - {match.stats.awayPenalties || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="font-medium text-green-700">Tiros Libres:</span>
                  <span className="text-green-600">{match.stats.homeFreeKicks || 0} - {match.stats.awayFreeKicks || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="font-medium text-green-700">Tarjetas:</span>
                  <span className="text-green-600">
                    🟨{match.stats.homeYellowCards || 0} 🟥{match.stats.homeRedCards || 0} - 
                    🟨{match.stats.awayYellowCards || 0} 🟥{match.stats.awayRedCards || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!showResults && (
          <div>
            {userPrediction && !canMakePredict ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Pronóstico guardado</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {userPrediction.stats.homeScore} - {userPrediction.stats.awayScore}
                </p>
                <div className="mt-2 text-xs text-green-600">
                  <div>Corners: {userPrediction.stats.homeCorners || 0} - {userPrediction.stats.awayCorners || 0}</div>
                  <div>Penales: {userPrediction.stats.homePenalties || 0} - {userPrediction.stats.awayPenalties || 0}</div>
                  <div>Tiros Libres: {userPrediction.stats.homeFreeKicks || 0} - {userPrediction.stats.awayFreeKicks || 0}</div>
                  <div>Tarjetas: 🟨{userPrediction.stats.homeYellowCards || 0} 🟥{userPrediction.stats.homeRedCards || 0} - 🟨{userPrediction.stats.awayYellowCards || 0} 🟥{userPrediction.stats.awayRedCards || 0}</div>
                </div>
              </div>
            ) : canMakePredict ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Goles */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">⚽ Goles</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homeScore-${match.id}`} className="text-blue-700">Local</Label>
                      <Input
                        id={`homeScore-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homeScore}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayScore-${match.id}`} className="text-blue-700">Visitante</Label>
                      <Input
                        id={`awayScore-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayScore}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Corners */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3">📐 Corners</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homeCorners-${match.id}`} className="text-green-700">Local</Label>
                      <Input
                        id={`homeCorners-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homeCorners || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homeCorners: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayCorners-${match.id}`} className="text-green-700">Visitante</Label>
                      <Input
                        id={`awayCorners-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayCorners || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayCorners: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Penales */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-3">⚽ Penales</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homePenalties-${match.id}`} className="text-purple-700">Local</Label>
                      <Input
                        id={`homePenalties-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homePenalties || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homePenalties: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayPenalties-${match.id}`} className="text-purple-700">Visitante</Label>
                      <Input
                        id={`awayPenalties-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayPenalties || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayPenalties: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Tiros Libres */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-3">🎯 Tiros Libres</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homeFreeKicks-${match.id}`} className="text-orange-700">Local</Label>
                      <Input
                        id={`homeFreeKicks-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homeFreeKicks || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homeFreeKicks: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayFreeKicks-${match.id}`} className="text-orange-700">Visitante</Label>
                      <Input
                        id={`awayFreeKicks-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayFreeKicks || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayFreeKicks: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjetas Amarillas */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-3">🟨 Tarjetas Amarillas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homeYellowCards-${match.id}`} className="text-yellow-700">Local</Label>
                      <Input
                        id={`homeYellowCards-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homeYellowCards || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homeYellowCards: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayYellowCards-${match.id}`} className="text-yellow-700">Visitante</Label>
                      <Input
                        id={`awayYellowCards-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayYellowCards || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayYellowCards: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjetas Rojas */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-3">🟥 Tarjetas Rojas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`homeRedCards-${match.id}`} className="text-red-700">Local</Label>
                      <Input
                        id={`homeRedCards-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.homeRedCards || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, homeRedCards: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`awayRedCards-${match.id}`} className="text-red-700">Visitante</Label>
                      <Input
                        id={`awayRedCards-${match.id}`}
                        type="number"
                        min="0"
                        value={predictionStats.awayRedCards || 0}
                        onChange={(e) => setPredictionStats(prev => ({ ...prev, awayRedCards: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-md font-medium"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Target className="w-4 h-4 mr-2 animate-pulse" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Guardar Pronóstico Completo
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  ⚠️ Una vez guardado, no podrás modificar tu pronóstico
                </p>
              </form>
            ) : (
              <div className="text-center py-6">
                {userPrediction ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">Pronóstico Guardado</p>
                      <p className="text-lg font-bold text-green-700">
                        {userPrediction.stats.homeScore} - {userPrediction.stats.awayScore}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Guardado el {new Intl.DateTimeFormat("es-ES").format(userPrediction.createdAt)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Los pronósticos no se pueden modificar una vez guardados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-2">
                        {match.isFinished ? "Partido Finalizado" : "Pronósticos Cerrados"}
                      </p>
                      <p className="text-xs text-red-600">
                        {match.isFinished
                          ? "Este partido ya ha finalizado"
                          : "Ya no se pueden hacer pronósticos para este partido"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}