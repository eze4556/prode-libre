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
import { Users, Eye, Target, Calendar, Trophy } from "lucide-react"

export function PredictionsView() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const userGroups = await getUserGroups(userProfile.uid)
      setGroups(userGroups)

      const groupIds = userGroups.map((g) => g.id)
      const userMatches = await getUserMatches(groupIds)
      setMatches(userMatches)
    } catch (error) {
      console.error("Error loading predictions data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const getUserName = (userId: string, groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    return group?.participantNames?.[userId] || "Usuario desconocido"
  }

  const upcomingMatches = matches.filter((m) => !m.isFinished)
  const finishedMatches = matches.filter((m) => m.isFinished)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando pronósticos...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Debes iniciar sesión para ver pronósticos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pronósticos del Grupo</h2>
          <p className="text-slate-600">Ve los pronósticos de otros participantes</p>
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
              <MatchPredictionsCard
                key={match.id}
                match={match}
                userProfile={userProfile}
                groups={groups}
                getUserName={getUserName}
                formatDate={formatDate}
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
                        <MatchPredictionsCard
                          match={match}
                          userProfile={userProfile}
                          groups={groups}
                          getUserName={getUserName}
                          formatDate={formatDate}
                          showResults={true}
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

interface MatchPredictionsCardProps {
  match: Match
  userProfile: any
  groups: Group[]
  getUserName: (userId: string, groupId: string) => string
  formatDate: (date: Date) => string
  showResults?: boolean
}

function MatchPredictionsCard({ 
  match, 
  userProfile, 
  groups, 
  getUserName, 
  formatDate, 
  showResults = false 
}: MatchPredictionsCardProps) {
  const predictions = Object.values(match.predictions || {})
  const userPrediction = match.predictions[userProfile.uid]
  const otherPredictions = predictions.filter(p => p.uid !== userProfile.uid)

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    return group?.name || "Grupo desconocido"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{match.homeTeam} vs {match.awayTeam}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {formatDate(match.matchDate)}
              <span className="mx-2">•</span>
              <Users className="w-4 h-4" />
              {getGroupName(match.groupId)}
            </CardDescription>
          </div>
          <Badge variant={match.isFinished ? "secondary" : "default"}>
            {match.isFinished ? "Finalizado" : "Próximo"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {showResults && match.isFinished && match.stats && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-slate-800">Resultado Final</h4>
            <div className="text-2xl font-bold text-slate-700">
              {match.stats.homeScore} - {match.stats.awayScore}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Corners:</span> {match.stats.homeCorners || 0} - {match.stats.awayCorners || 0}
              </div>
              <div>
                <span className="font-medium">Penales:</span> {match.stats.homePenalties || 0} - {match.stats.awayPenalties || 0}
              </div>
              <div>
                <span className="font-medium">Tiros Libres:</span> {match.stats.homeFreeKicks || 0} - {match.stats.awayFreeKicks || 0}
              </div>
              <div>
                <span className="font-medium">Tarjetas:</span> 
                <span className="text-yellow-600"> {match.stats.homeYellowCards || 0}🟨</span>
                <span className="text-red-600"> {match.stats.homeRedCards || 0}🟥</span>
                <span className="text-yellow-600"> {match.stats.awayYellowCards || 0}🟨</span>
                <span className="text-red-600"> {match.stats.awayRedCards || 0}🟥</span>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos ({predictions.length})</TabsTrigger>
            <TabsTrigger value="mine">Mi Pronóstico</TabsTrigger>
            <TabsTrigger value="others">Otros ({otherPredictions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {predictions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aún no hay pronósticos para este partido</p>
              </div>
            ) : (
              predictions.map((prediction) => (
                <PredictionItem
                  key={prediction.uid}
                  prediction={prediction}
                  userName={getUserName(prediction.uid, match.groupId)}
                  isCurrentUser={prediction.uid === userProfile.uid}
                  showResults={showResults}
                  matchStats={match.stats}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-3">
            {userPrediction ? (
              <PredictionItem
                prediction={userPrediction}
                userName="Tú"
                isCurrentUser={true}
                showResults={showResults}
                matchStats={match.stats}
              />
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No has hecho pronóstico para este partido</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="others" className="space-y-3">
            {otherPredictions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Otros participantes aún no han hecho pronósticos</p>
              </div>
            ) : (
              otherPredictions.map((prediction) => (
                <PredictionItem
                  key={prediction.uid}
                  prediction={prediction}
                  userName={getUserName(prediction.uid, match.groupId)}
                  isCurrentUser={false}
                  showResults={showResults}
                  matchStats={match.stats}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface PredictionItemProps {
  prediction: Prediction
  userName: string
  isCurrentUser: boolean
  showResults: boolean
  matchStats?: any
}

function PredictionItem({ 
  prediction, 
  userName, 
  isCurrentUser, 
  showResults, 
  matchStats 
}: PredictionItemProps) {
  const stats = prediction.stats

  return (
    <div className={`p-4 rounded-lg border ${
      isCurrentUser 
        ? 'bg-blue-50 border-blue-200' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${
            isCurrentUser ? 'text-blue-800' : 'text-slate-800'
          }`}>
            {userName}
          </span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">Tú</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("es-ES").format(prediction.createdAt)}
        </span>
      </div>

      {/* Goles */}
      <div className="mb-3">
        <div className="text-lg font-bold text-slate-700">
          ⚽ {stats.homeScore} - {stats.awayScore}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Corners:</span>
          <span className="font-medium">{stats.homeCorners || 0} - {stats.awayCorners || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Penales:</span>
          <span className="font-medium">{stats.homePenalties || 0} - {stats.awayPenalties || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tiros Libres:</span>
          <span className="font-medium">{stats.homeFreeKicks || 0} - {stats.awayFreeKicks || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tarjetas:</span>
          <span className="font-medium">
            🟨{stats.homeYellowCards || 0} 🟥{stats.homeRedCards || 0} - 
            🟨{stats.awayYellowCards || 0} 🟥{stats.awayRedCards || 0}
          </span>
        </div>
      </div>

      {/* Puntos si hay resultados */}
      {showResults && prediction.points !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Puntos obtenidos:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {prediction.points} pts
            </Badge>
          </div>
          {prediction.breakdown && (
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Acierto exacto:</span>
                <span>{prediction.breakdown.exactScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Resultado:</span>
                <span>{prediction.breakdown.result} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Corners:</span>
                <span>{prediction.breakdown.corners} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Penales:</span>
                <span>{prediction.breakdown.penalties} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Tiros Libres:</span>
                <span>{prediction.breakdown.freeKicks} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Tarjetas:</span>
                <span>{prediction.breakdown.yellowCards + prediction.breakdown.redCards} pts</span>
              </div>
              {prediction.breakdown.streakBonus > 0 && (
                <div className="flex justify-between">
                  <span>Bonus racha:</span>
                  <span>{prediction.breakdown.streakBonus} pts</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}