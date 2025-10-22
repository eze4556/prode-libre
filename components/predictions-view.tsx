"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/lib/groups"
import { getUserMatches } from "@/lib/matches"
import { getJornadasByGroup } from "@/lib/jornadas"
import type { Group, Match, Prediction, Jornada } from "@/lib/types"
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
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  // Estados para "Cargar más"
  const [upcomingLimit, setUpcomingLimit] = useState(10)
  const [finishedLimit, setFinishedLimit] = useState(10)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const userGroups = await getUserGroups(userProfile.uid)
      setGroups(userGroups)

      // Load jornadas for all groups
      const allJornadas: Jornada[] = []
      for (const group of userGroups) {
        const groupJornadas = await getJornadasByGroup(group.id)
        allJornadas.push(...groupJornadas)
      }
      setJornadas(allJornadas)
      
      // Set first jornada as selected if none selected
      if (allJornadas.length > 0 && !selectedJornadaId) {
        setSelectedJornadaId(allJornadas[0].id)
      }

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

  // Get matches for selected jornada
  const getJornadaMatches = () => {
    if (!selectedJornadaId) return []
    return matches.filter(match => match.jornadaId === selectedJornadaId)
  }

  // Group matches by date
  const groupMatchesByDate = (matches: Match[]) => {
    const grouped: { [date: string]: Match[] } = {}
    matches.forEach(match => {
      const dateKey = match.matchDate.toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(match)
    })
    return grouped
  }

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    return group?.name || "Grupo desconocido"
  }

  const getUserName = (userId: string, groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    return group?.participantNames?.[userId] || "Usuario desconocido"
  }

  const upcomingMatches = getJornadaMatches().filter((m) => !m.isFinished)
  const finishedMatches = getJornadaMatches().filter((m) => m.isFinished)
  
  // Partidos limitados para mostrar
  const limitedUpcomingMatches = upcomingMatches.slice(0, upcomingLimit)
  const limitedFinishedMatches = finishedMatches.slice(0, finishedLimit)

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pronósticos del Grupo</h2>
          <p className="text-sm sm:text-base text-slate-600">Ve los pronósticos de otros participantes</p>
        </div>
      </div>

      {/* Jornada Selector */}
      {jornadas.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Jornada:</span>
            </div>
            <select
              value={selectedJornadaId}
              onChange={(e) => setSelectedJornadaId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {jornadas.map((jornada) => (
                <option key={jornada.id} value={jornada.id}>
                  {jornada.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Grupos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Grupos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Próximos</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">Partidos por jugar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Finalizados</CardTitle>
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{finishedMatches.length}</div>
            <p className="text-xs text-muted-foreground">Partidos jugados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Próximos</TabsTrigger>
          <TabsTrigger value="finished" className="text-xs sm:text-sm">Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 sm:space-y-4">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Target className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No hay partidos próximos</h3>
                <p className="text-sm sm:text-base text-muted-foreground">No hay partidos próximos en esta jornada</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {limitedUpcomingMatches.map((match) => (
                <MatchPredictionsCard
                  key={match.id}
                  match={match}
                  userProfile={userProfile}
                  groups={groups}
                  getUserName={getUserName}
                  formatDate={formatDate}
                />
              ))}
              
              {/* Botón "Cargar más" para partidos próximos */}
              {upcomingMatches.length > upcomingLimit && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setUpcomingLimit(prev => prev + 10)}
                    className="bg-white border-slate-300 hover:bg-slate-50"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Cargar más partidos ({upcomingMatches.length - upcomingLimit} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-4 sm:space-y-6">
          {finishedMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No hay partidos finalizados</h3>
                <p className="text-sm sm:text-base text-muted-foreground">No hay partidos finalizados en esta jornada</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Agrupar partidos por grupo */}
              {groups.map(group => {
                const groupFinishedMatches = finishedMatches.filter(match => match.groupId === group.id)
                const limitedGroupMatches = groupFinishedMatches.slice(0, finishedLimit)
                
                if (groupFinishedMatches.length === 0) return null
                
                return (
                  <div key={group.id} className="space-y-3 sm:space-y-4">
                    {/* Header del grupo */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{group.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-600">{groupFinishedMatches.length} partido{groupFinishedMatches.length !== 1 ? 's' : ''} finalizado{groupFinishedMatches.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    {/* Partidos del grupo */}
                    <div className="space-y-2 sm:space-y-3 pl-3 sm:pl-4 border-l-2 border-slate-200">
                      {limitedGroupMatches.map((match) => (
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
              })}
              
              {/* Botón "Cargar más" para partidos finalizados */}
              {finishedMatches.length > finishedLimit && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setFinishedLimit(prev => prev + 10)}
                    className="bg-white border-slate-300 hover:bg-slate-50"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Cargar más partidos ({finishedMatches.length - finishedLimit} restantes)
                  </Button>
                </div>
              )}
            </>
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
    <Card className="mb-4">
      {/* Header vertical centrado */}
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Equipo local */}
          <div className="flex flex-col items-center">
            {match.homeTeamLogo && (
              <img 
                src={match.homeTeamLogo} 
                alt={match.homeTeam}
                className="w-12 h-12 object-contain rounded-lg bg-white border-2 border-gray-200 shadow-sm mb-2"
              />
            )}
            <h3 className="font-bold text-lg text-gray-800 text-center">{match.homeTeam}</h3>
          </div>
          
          {/* VS */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-px bg-gray-300"></div>
            <span className="text-gray-500 font-bold text-sm px-3 py-1 bg-gray-100 rounded-full">VS</span>
            <div className="w-8 h-px bg-gray-300"></div>
          </div>
          
          {/* Equipo visitante */}
          <div className="flex flex-col items-center">
            {match.awayTeamLogo && (
              <img 
                src={match.awayTeamLogo} 
                alt={match.awayTeam}
                className="w-12 h-12 object-contain rounded-lg bg-white border-2 border-gray-200 shadow-sm mb-2"
              />
            )}
            <h3 className="font-bold text-lg text-gray-800 text-center">{match.awayTeam}</h3>
          </div>
          
          {/* Información del partido */}
          <div className="flex flex-col items-center space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(match.matchDate)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{predictions.length} pronósticos</span>
            </div>
            <Badge variant={match.isFinished ? "secondary" : "default"} className="text-xs">
              {match.isFinished ? "Finalizado" : "Próximo"}
            </Badge>
            <span className="text-xs text-gray-500">{getGroupName(match.groupId)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Resultado si está finalizado */}
        {showResults && match.isFinished && match.stats && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-center">
              <h4 className="font-bold text-green-800 mb-3 text-lg">🏆 Resultado Final</h4>
              <div className="text-2xl font-bold text-green-700">
                {match.stats.result === 'local' && `Gana ${match.homeTeam}`}
                {match.stats.result === 'empate' && 'Empate'}
                {match.stats.result === 'visitante' && `Gana ${match.awayTeam}`}
              </div>
            </div>
          </div>
        )}

        {/* Tabs de pronósticos */}
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-1 h-10 mb-4">
            <TabsTrigger value="mine" className="text-xs">Mi Pronóstico</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-3">
            {userPrediction ? (
              <PredictionItem
                prediction={userPrediction}
                userName="Tú"
                isCurrentUser={true}
                showResults={showResults}
                matchStats={match.stats}
                matchFinished={match.isFinished}
              />
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No has hecho pronóstico para este partido</p>
              </div>
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
  matchFinished?: boolean
}

function PredictionItem({ 
  prediction, 
  userName, 
  isCurrentUser, 
  showResults, 
  matchStats,
  matchFinished = false
}: PredictionItemProps) {
  const stats = prediction.stats

  return (
    <div className={`p-4 rounded-xl border-2 ${
      isCurrentUser 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
    }`}>
      {/* Header del usuario */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            isCurrentUser ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {isCurrentUser ? 'TÚ' : userName.charAt(0).toUpperCase()}
          </div>
          <span className={`font-bold text-sm ${
            isCurrentUser ? 'text-blue-800' : 'text-gray-800'
          }`}>
            {userName}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }).format(prediction.createdAt)}
        </span>
      </div>

      {/* Pronóstico */}
      <div className="mb-3">
        <div className="text-center">
          {isCurrentUser || matchFinished ? (
            <div className="text-lg font-bold text-gray-700 mb-1">
              {stats.result === 'local' && 'Gana Local'}
              {stats.result === 'empate' && 'Empate'}
              {stats.result === 'visitante' && 'Gana Visitante'}
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-400 mb-1">
              🔒 Pronóstico oculto
            </div>
          )}
        </div>
      </div>

      {/* Resultado del administrador si está disponible */}
      {showResults && matchStats && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-green-600 mb-1">Resultado real:</div>
            <div className="text-sm font-semibold text-green-700">
              {matchStats.result === 'local' && 'Gana Local'}
              {matchStats.result === 'empate' && 'Empate'}
              {matchStats.result === 'visitante' && 'Gana Visitante'}
            </div>
          </div>
        </div>
      )}

      {/* Puntos si hay resultados */}
      {showResults && prediction.points !== undefined && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Puntos obtenidos:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              prediction.points > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {prediction.points} pts
            </div>
          </div>
        </div>
      )}
    </div>
  )
}