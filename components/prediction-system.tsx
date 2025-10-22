"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/lib/groups"
import { getUserMatches, submitPrediction, canPredict, getUserPrediction, getMatchStatus, getMatchesByJornada, canModifyPrediction } from "@/lib/matches"
import { getJornadasByGroup } from "@/lib/jornadas"
import type { Group, Match, PredictionStats, Jornada } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Target, CheckCircle, XCircle, Trophy, Calendar, Users, Eye, EyeOff, Clock, Edit } from "lucide-react"
import { calculateAchievements } from "@/lib/achievements"
import { AchievementsDisplay } from "@/components/achievements-display"

export function PredictionSystem() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [selectedResults, setSelectedResults] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards')
  // Estado para paginación de 'Cargar más' en próximos
  const [upcomingLimit, setUpcomingLimit] = useState(10)
  // Estado para manejar edición de pronósticos existentes
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)

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
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
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

  // Modernizar renderGridView para fixture visual moderno
  const renderGridView = (matches: Match[]) => {
    if (matches.length === 0) return null
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-100">
          {matches.map((match) => (
            <div key={match.id} className="grid grid-cols-3 gap-2 p-4 items-center hover:bg-blue-50/40 transition rounded-xl">
              {/* Equipo Local */}
              <div className="flex flex-col items-center">
                {match.homeTeamLogo ? (
                  <img 
                    src={match.homeTeamLogo} 
                    alt={match.homeTeam} 
                    className="w-10 h-10 object-contain mb-1"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMTAgMTVIMzBWMjVIMTBWMTVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm text-gray-500">?</span>
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-800 mt-1 text-center">{match.homeTeam}</span>
              </div>
              {/* Hora y Pronóstico */}
              <div className="text-center flex flex-col items-center justify-center">
                <span className="text-base font-bold text-blue-700">
                  {new Intl.DateTimeFormat("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }).format(match.matchDate)}
                </span>
                {/* Tu pronóstico */}
                {match.predictions[userProfile.uid] && (
                  <div className="mt-2 mb-1">
                    <span className="block text-xs text-gray-500 mb-1">Tu pronóstico:</span>
                    <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold shadow">
                      {match.predictions[userProfile.uid].stats.result === 'local' && 'Gana Local'}
                      {match.predictions[userProfile.uid].stats.result === 'empate' && 'Empate'}
                      {match.predictions[userProfile.uid].stats.result === 'visitante' && 'Gana Visitante'}
                    </span>
                  </div>
                )}
                {/* Resultado real */}
                {match.isFinished && match.stats && (
                  <div className="mt-1">
                    <span className="block text-xs text-gray-500 mb-1">Resultado:</span>
                    <span className="inline-block rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold shadow">
                      {match.stats.result === 'local' && 'Gana Local'}
                      {match.stats.result === 'empate' && 'Empate'}
                      {match.stats.result === 'visitante' && 'Gana Visitante'}
                    </span>
                  </div>
                )}
              </div>
              {/* Equipo Visitante */}
              <div className="flex flex-col items-center">
                {match.awayTeamLogo ? (
                  <img 
                    src={match.awayTeamLogo} 
                    alt={match.awayTeam} 
                    className="w-10 h-10 object-contain mb-1"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMTAgMTVIMzBWMjVIMTBWMTVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm text-gray-500">?</span>
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-800 mt-1 text-center">{match.awayTeam}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleSelectResult = (matchId: string, result: string) => {
    setSelectedResults((prev) => ({ ...prev, [matchId]: result }))
  }

  const handleStartEdit = (matchId: string) => {
    setEditingMatchId(matchId)
    const match = matches.find(m => m.id === matchId)
    if (match && match.predictions[userProfile.uid]) {
      setSelectedResults((prev) => ({ ...prev, [matchId]: match.predictions[userProfile.uid].stats.result }))
    }
  }

  const handleCancelEdit = (matchId: string) => {
    setEditingMatchId(null)
    setSelectedResults((prev) => ({ ...prev, [matchId]: '' }))
  }

  const handleSave = async (matchId: string) => {
    if (!userProfile) return
    setSubmitting(matchId)
    try {
      await submitPrediction(matchId, userProfile.uid, { result: selectedResults[matchId] })
      const isEditing = editingMatchId === matchId
      toast({ 
        title: isEditing ? "¡Pronóstico modificado!" : "¡Pronóstico guardado!", 
        description: isEditing ? "Tu predicción ha sido actualizada correctamente" : "Tu predicción ha sido registrada correctamente"
      })
      loadData()
      setEditingMatchId(null)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar el pronóstico", variant: "destructive" })
    } finally {
      setSubmitting(null)
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
      <h2 className="text-xl font-bold text-center mb-4">Pronósticos</h2>
      
      {/* Jornada Selector */}
      {jornadas.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
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
          
          {/* Vista Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">Vista:</span>
            <div className="flex bg-white border border-gray-300 rounded-lg p-1 w-full sm:w-auto">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="flex-1 sm:flex-none h-8 sm:h-8 px-2 sm:px-3 text-xs font-medium"
              >
                <Eye className="w-3 h-3 mr-1 sm:mr-1" />
                <span className="hidden sm:inline">Individual</span>
                <span className="sm:hidden">Ind.</span>
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex-1 sm:flex-none h-8 sm:h-8 px-2 sm:px-3 text-xs font-medium"
              >
                <Target className="w-3 h-3 mr-1 sm:mr-1" />
                <span className="hidden sm:inline">Grilla</span>
                <span className="sm:hidden">Grid</span>
              </Button>
            </div>
          </div>
          
          {/* Nota informativa */}
          {viewMode === 'grid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-blue-700 text-center leading-relaxed">
                💡 Vista de grilla: Solo para visualizar partidos. Para seleccionar pronóstico, cambia a vista individual.
              </p>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 mb-4">
          <TabsTrigger value="upcoming" className="text-sm">Próximos</TabsTrigger>
          <TabsTrigger value="finished" className="text-sm">Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {getJornadaMatches().filter(m => !m.isFinished).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay partidos próximos en esta jornada</p>
            </div>
          ) : viewMode === 'grid' ? (
            renderGridView(getJornadaMatches().filter(m => !m.isFinished).slice(0, upcomingLimit))
          ) : (
            Object.entries(groupMatchesByDate(getJornadaMatches().filter(m => !m.isFinished).slice(0, upcomingLimit))).map(([date, dayMatches]) => (
              <div key={date} className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-800 text-center">
                    {new Date(date).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    }).toUpperCase()}
                  </h3>
                </div>
                {dayMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center w-full">
                    {/* Equipo local */}
                    <div className="flex flex-col items-center mb-1">
                  {match.homeTeamLogo && (
                        <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-12 h-12 object-contain rounded bg-white border border-gray-200 mb-1" />
                      )}
                      <span className="font-bold text-lg text-gray-800 text-center">{match.homeTeam}</span>
                    </div>
                    
                    {/* VS */}
                    <div className="flex items-center space-x-2 my-2">
                      <div className="w-8 h-px bg-gray-300"></div>
                      <span className="text-gray-500 font-bold text-sm px-3 py-1 bg-gray-100 rounded-full">VS</span>
                      <div className="w-8 h-px bg-gray-300"></div>
                    </div>
                    
                    {/* Equipo visitante */}
                    <div className="flex flex-col items-center mb-2">
                      {match.awayTeamLogo && (
                        <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-12 h-12 object-contain rounded bg-white border border-gray-200 mb-1" />
                      )}
                      <span className="font-bold text-lg text-gray-800 text-center">{match.awayTeam}</span>
                    </div>
                    
                    {/* Fecha */}
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Intl.DateTimeFormat("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(match.matchDate)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Mostrar si NO puede cambiar ya (30 min antes del partido) */}
                  {match.predictions[userProfile.uid] && !canModifyPrediction(match) ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-slate-600 mb-3">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">Pronóstico Bloqueado</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-700 mb-2">
                          {match.predictions[userProfile.uid].stats.result === 'local' && `Gana ${match.homeTeam}`}
                          {match.predictions[userProfile.uid].stats.result === 'empate' && 'Empate'}
                          {match.predictions[userProfile.uid].stats.result === 'visitante' && `Gana ${match.awayTeam}`}
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                          El plazo para modificar cerró hace 30 minutos
                        </p>
                        {match.predictions[userProfile.uid].updatedAt && (
                          <p className="text-xs text-slate-400">
                            Modificado: {new Intl.DateTimeFormat("es-ES").format(match.predictions[userProfile.uid].updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mostrar si el usuario ya tiene ponóstico pero puede modificarlo */}
                      {match.predictions[userProfile.uid] && editingMatchId !== match.id ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center gap-2 text-green-700 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">¡Pronóstico Guardado!</span>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-700 mb-2">
                              {match.predictions[userProfile.uid].stats.result === 'local' && `Gana ${match.homeTeam}`}
                              {match.predictions[userProfile.uid].stats.result === 'empate' && 'Empate'}
                              {match.predictions[userProfile.uid].stats.result === 'visitante' && `Gana ${match.awayTeam}`}
                            </div>
                            <p className="text-sm text-green-600 mb-3">
                              Puedes modificar tu pronóstico hasta 30 minutos antes del partido
                            </p>
                            {match.predictions[userProfile.uid].updatedAt && (
                              <p className="text-xs text-green-500 mb-3">
                                Modificado: {new Intl.DateTimeFormat("es-ES").format(match.predictions[userProfile.uid].updatedAt)}
                              </p>
                            )}
                            <Button
                              onClick={() => handleStartEdit(match.id)}
                              variant="outline"
                              size="sm"
                              className="bg-white border-green-300 hover:bg-green-50 text-green-700"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modificar Pronóstico
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant={selectedResults[match.id] === 'local' ? 'default' : 'outline'}
                              onClick={() => handleSelectResult(match.id, 'local')}
                              className="h-10 text-sm font-semibold"
                            >
                              Gana {match.homeTeam}
                            </Button>
                            <Button
                              variant={selectedResults[match.id] === 'empate' ? 'default' : 'outline'}
                              onClick={() => handleSelectResult(match.id, 'empate')}
                              className="h-10 text-sm font-semibold"
                            >
                              Empate
                            </Button>
                            <Button
                              variant={selectedResults[match.id] === 'visitante' ? 'default' : 'outline'}
                              onClick={() => handleSelectResult(match.id, 'visitante')}
                              className="h-10 text-sm font-semibold"
                            >
                              Gana {match.awayTeam}
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSave(match.id)}
                              disabled={!selectedResults[match.id] || submitting === match.id}
                              className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                            >
                              {submitting === match.id ? (
                                <>
                                  <Target className="w-4 h-4 mr-2 animate-pulse" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Target className="w-4 h-4 mr-2" />
                                  {editingMatchId === match.id ? 'Actualizar' : 'Guardar'} Pronóstico
                                </>
                              )}
                            </Button>
                            
                            {editingMatchId === match.id && (
                              <Button
                                onClick={() => handleCancelEdit(match.id)}
                                variant="outline"
                                className="h-10 px-4"
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
                ))}
              </div>
            ))
          )}
          {/* Botón Cargar más */}
          {getJornadaMatches().filter(m => !m.isFinished).length > upcomingLimit && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => setUpcomingLimit(upcomingLimit + 10)} variant="outline">
                Cargar más
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-4">
          {getJornadaMatches().filter(m => m.isFinished).length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay partidos finalizados en esta jornada</p>
            </div>
          ) : (
            // Solo mostrar la grilla en finalizados, no tarjetas individuales
            renderGridView(getJornadaMatches().filter(m => m.isFinished))
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
    result: '' as 'local' | 'empate' | 'visitante'
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const userPrediction = match.predictions[userProfile.uid]
  const canMakePredict = canPredict(match, userProfile.uid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(match.id, predictionStats)
    setIsModalOpen(false)
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
    <>
      <Card className={`${match.isFinished ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md' : 'border-slate-200'} transition-all duration-300 hover:shadow-lg`}>
        <CardHeader className={`${match.isFinished ? 'bg-green-100/50 border-b border-green-200' : ''}`}>
          <div className="flex flex-col items-center w-full">
            {/* Equipo local */}
            <div className="flex flex-col items-center mb-1">
                    {match.homeTeamLogo && (
                <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-10 h-10 object-contain rounded bg-white border border-slate-200 mb-1" />
              )}
              <span className={`font-semibold text-base sm:text-lg text-center ${match.isFinished ? 'text-green-800' : 'text-slate-800'}`}>{match.homeTeam}</span>
                  </div>
            {/* VS */}
            <div className="text-center text-slate-400 font-bold text-lg mb-1">VS</div>
            {/* Equipo visitante */}
            <div className="flex flex-col items-center mb-2">
                    {match.awayTeamLogo && (
                <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-10 h-10 object-contain rounded bg-white border border-slate-200 mb-1" />
              )}
              <span className={`font-semibold text-base sm:text-lg text-center ${match.isFinished ? 'text-green-800' : 'text-slate-800'}`}>{match.awayTeam}</span>
                  </div>
            {/* Fecha */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className={match.isFinished ? 'text-green-700' : 'text-slate-600'}>{formatDate(match.matchDate)}</span>
              </span>
                </div>
            {/* Estado y grupo */}
            <div className="flex flex-col items-center mt-2">
              <Badge className={`text-xs mb-1 ${match.isFinished ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-blue-500 text-white border-blue-500'}`}>
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
              <p className={`text-xs ${match.isFinished ? 'text-green-700' : 'text-muted-foreground'}`}>{getGroupName(match.groupId)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showResults && match.isFinished && match.stats && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <h4 className="font-semibold text-green-800 text-sm sm:text-base">Resultado Final</h4>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-700 mb-2">
                {match.stats.result === 'local' && `Gana ${match.homeTeam}`}
                {match.stats.result === 'empate' && 'Empate'}
                {match.stats.result === 'visitante' && `Gana ${match.awayTeam}`}
                  </div>
              
              {/* Tu pronóstico si existe */}
              {match.predictions[userProfile.uid] && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Tu pronóstico:</div>
                  <div className="text-sm font-semibold text-blue-700">
                    {match.predictions[userProfile.uid].stats.result === 'local' && `Gana ${match.homeTeam}`}
                    {match.predictions[userProfile.uid].stats.result === 'empate' && 'Empate'}
                    {match.predictions[userProfile.uid].stats.result === 'visitante' && `Gana ${match.awayTeam}`}
                  </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {!showResults && (
          <div>
            {userPrediction && !canMakePredict ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Pronóstico guardado</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 mb-2">
                    {userPrediction.stats.result === 'local' && `Gana ${match.homeTeam}`}
                    {userPrediction.stats.result === 'empate' && 'Empate'}
                    {userPrediction.stats.result === 'visitante' && `Gana ${match.awayTeam}`}
                  </div>
                </div>
              </div>
            ) : canMakePredict ? (
                  <div className="text-center">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Hacer Pronóstico
                </Button>
              </div>
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
        
        {/* Resultado del administrador - siempre visible cuando esté disponible */}
        {match.isFinished && match.stats && !showResults && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Resultado del administrador</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">
                {match.stats.result === 'local' && `Gana ${match.homeTeam}`}
                {match.stats.result === 'empate' && 'Empate'}
                {match.stats.result === 'visitante' && `Gana ${match.awayTeam}`}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Modal de Pronóstico */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="w-[95vw] max-w-md max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Pronóstico: {match.homeTeam} vs {match.awayTeam}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Elige el resultado que crees que tendrá este partido.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resultado */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-4 text-sm sm:text-base text-center">🏆 Resultado del Partido</h4>
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant={predictionStats.result === 'local' ? 'default' : 'outline'}
                onClick={() => setPredictionStats(prev => ({ ...prev, result: 'local' }))}
                className="h-12 text-sm font-semibold"
              >
                🏠 Gana {match.homeTeam}
              </Button>
              <Button
                type="button"
                variant={predictionStats.result === 'empate' ? 'default' : 'outline'}
                onClick={() => setPredictionStats(prev => ({ ...prev, result: 'empate' }))}
                className="h-12 text-sm font-semibold"
              >
                ⚖️ Empate
              </Button>
              <Button
                type="button"
                variant={predictionStats.result === 'visitante' ? 'default' : 'outline'}
                onClick={() => setPredictionStats(prev => ({ ...prev, result: 'visitante' }))}
                className="h-12 text-sm font-semibold"
              >
                🏠 Gana {match.awayTeam}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-9 sm:h-10 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-sm"
              disabled={submitting || !predictionStats.result}
            >
              {submitting ? (
                <>
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-pulse" />
                  <span className="hidden sm:inline">Guardando...</span>
                  <span className="sm:hidden">Guardando...</span>
                </>
              ) : (
                <>
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Guardar Pronóstico</span>
                  <span className="sm:hidden">Guardar</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}