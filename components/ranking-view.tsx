"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroupsRanking, getAllJornadaRankings, type UserRanking, type JornadaRanking } from "@/lib/ranking"
import type { Group, Jornada } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Trophy, 
  Users, 
  Target, 
  Calendar,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Star,
  Clock,
  ArrowLeft
} from "lucide-react"

interface RankingViewProps {
  onBack?: () => void;
}

export function RankingView({ onBack }: RankingViewProps = {}) {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groupRankings, setGroupRankings] = useState<{group: Group, ranking: UserRanking[]}[]>([])
  const [jornadaRankings, setJornadaRankings] = useState<JornadaRanking[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedJornada, setSelectedJornada] = useState<string>("")
  const [activeTab, setActiveTab] = useState<'general' | 'jornadas'>('general')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const rankings = await getUserGroupsRanking(userProfile.uid)
      setGroupRankings(rankings)
      
      if (rankings.length > 0) {
        setSelectedGroup(rankings[0].group)
        await loadJornadaRankings(rankings[0].group.id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los rankings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadJornadaRankings = async (groupId: string) => {
    try {
      const jornadaRankings = await getAllJornadaRankings(groupId)
      setJornadaRankings(jornadaRankings)
    } catch (error: any) {
      console.error("Error loading jornada rankings:", error)
    }
  }

  const handleGroupChange = async (groupId: string) => {
    const group = groupRankings.find(gr => gr.group.id === groupId)?.group
    if (group) {
      setSelectedGroup(group)
      setSelectedJornada("")
      await loadJornadaRankings(groupId)
    }
  }

  const handleJornadaChange = (jornadaId: string) => {
    setSelectedJornada(jornadaId)
  }

  const goBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Fallback: navegar al dashboard
      window.location.href = '#'
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return "🥇"
      case 2: return "🥈"
      case 3: return "🥉"
      default: return `#${position}`
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600"
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500"
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-600"
      default: return "bg-gradient-to-r from-blue-500 to-blue-700"
    }
  }

  const getCurrentUserRanking = (ranking: UserRanking[]) => {
    if (!userProfile) return null
    return ranking.find(r => r.userId === userProfile.uid) || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando rankings...</p>
        </div>
      </div>
    )
  }

  if (groupRankings.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Rankings</h2>
            <p className="text-sm sm:text-base text-slate-600">Clasificaciones de tus grupos</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">No hay rankings disponibles</h3>
            <p className="text-sm text-slate-500 mb-4">
              Únete a grupos y haz pronósticos para ver las clasificaciones
            </p>
            <Button 
              onClick={() => window.location.href = '#groups'}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              <Users className="w-4 h-4 mr-2" />
              Ver Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{selectedGroup?.name || "Rankings"}</h1>
          </div>
          
          {/* Pestañas */}
          <div className="flex mt-4 border-b border-slate-200">
            <button 
              className={`px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'general' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('general')}
            >
              GENERAL
            </button>
            <button 
              className={`px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'jornadas' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('jornadas')}
            >
              JORNADAS
            </button>
          </div>
          
          {/* Selector de grupo */}
          <div className="mt-4">
            <Select 
              value={selectedGroup?.id || ""} 
              onValueChange={handleGroupChange}
            >
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {groupRankings.map(({ group }) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selector de jornada (solo en pestaña JORNADAS) */}
          {activeTab === 'jornadas' && jornadaRankings.length > 0 && (
            <div className="mt-4">
              <Select value={selectedJornada} onValueChange={handleJornadaChange}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Selecciona jornada" />
                </SelectTrigger>
                <SelectContent>
                  {jornadaRankings.map((jornada) => (
                    <SelectItem key={jornada.jornadaId} value={jornada.jornadaId}>
                      {jornada.jornadaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {selectedGroup ? (
          <>
            {/* Ranking General */}
            {activeTab === 'general' && (() => {
              const currentGroupRanking = groupRankings.find(gr => gr.group.id === selectedGroup.id)
              const ranking = currentGroupRanking?.ranking || []

              return (
                <div className="space-y-3">
                  {ranking.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">No hay partidos finalizados aún</p>
                    </div>
                  ) : (
                    ranking.map((user, index) => (
                      <div 
                        key={user.userId} 
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          user.userId === userProfile?.uid 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' // Fila resaltada
                            : 'bg-white border-slate-200 hover:shadow-sm' // Fondo normal
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className={`font-medium ${
                            user.userId === userProfile?.uid ? 'text-blue-800' : 'text-slate-800'
                          }`}>
                            {user.userName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${
                            user.userId === userProfile?.uid ? 'text-blue-600' : 'text-slate-700'
                          }`}>
                            {user.totalPoints}
                          </span>
                          <div className="text-xs text-slate-500">puntos</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            })()}

            {/* Ranking por Jornadas */}
            {activeTab === 'jornadas' && (() => {
              if (jornadaRankings.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No hay jornadas con partidos finalizados</p>
                  </div>
                )
              }

              if (!selectedJornada) {
                return (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">Selecciona una jornada para ver el ranking</p>
                  </div>
                )
              }

              const selectedJornadaRanking = jornadaRankings.find(jr => jr.jornadaId === selectedJornada)
              if (!selectedJornadaRanking) {
                return (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">Jornada no encontrada</p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {selectedJornadaRanking.userRankings.map((user, index) => (
                    <div 
                      key={user.userId} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        user.userId === userProfile?.uid 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' // Fila resaltada
                          : 'bg-white border-slate-200 hover:shadow-sm' // Fondo normal
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`font-medium ${
                          user.userId === userProfile?.uid ? 'text-blue-800' : 'text-slate-800'
                        }`}>
                          {user.userName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${
                          user.userId === userProfile?.uid ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {user.totalPoints}
                        </span>
                        <div className="text-xs text-slate-500">puntos</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Selecciona un grupo para ver el ranking</p>
          </div>
        )}
      </div>
    </div>
  )
}

