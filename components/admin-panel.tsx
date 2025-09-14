"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups, deleteGroup } from "@/lib/groups"
import { getAdminMatches, createMatch, updateMatchResult, deleteMatch, getMatchStatus } from "@/lib/matches"
import type { Group, Match } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { TeamSelector } from "@/components/team-selector"
import { Plus, Calendar, Trophy, Trash2, Edit, Users, Target, Settings } from "lucide-react"

interface AdminPanelProps {
  onNavigateToGroups?: () => void
}

export function AdminPanel({ onNavigateToGroups }: AdminPanelProps = {}) {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [adminGroups, setAdminGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [createMatchOpen, setCreateMatchOpen] = useState(false)
  const [editResultOpen, setEditResultOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Form states
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [homeTeamLogo, setHomeTeamLogo] = useState("")
  const [awayTeamLogo, setAwayTeamLogo] = useState("")
  const [matchDate, setMatchDate] = useState("")
  const [matchTime, setMatchTime] = useState("")
  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")
  const [homeCorners, setHomeCorners] = useState("")
  const [awayCorners, setAwayCorners] = useState("")
  const [homePenalties, setHomePenalties] = useState("")
  const [awayPenalties, setAwayPenalties] = useState("")
  const [homeFreeKicks, setHomeFreeKicks] = useState("")
  const [awayFreeKicks, setAwayFreeKicks] = useState("")
  const [homeYellowCards, setHomeYellowCards] = useState("")
  const [awayYellowCards, setAwayYellowCards] = useState("")
  const [homeRedCards, setHomeRedCards] = useState("")
  const [awayRedCards, setAwayRedCards] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile || (userProfile.role !== "admin" && userProfile.role !== "superadmin")) return

    try {
      if (userProfile.role === "superadmin") {
        // Super admin can see all groups but cannot manage them
        const allGroups = await getUserGroups(userProfile.uid)
        setAdminGroups([]) // Super admin has no groups to manage
        
        // Super admin cannot see matches for management
        setMatches([])
      } else {
        // Regular admin sees only their groups
        const allGroups = await getUserGroups(userProfile.uid)
        const userAdminGroups = allGroups.filter((group) => group.adminId === userProfile.uid)
        setAdminGroups(userAdminGroups)

        // Get matches for admin groups
        const adminMatches = await getAdminMatches(userProfile.uid)
        setMatches(adminMatches)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleCreateMatch called with:", {
      selectedGroupId,
      homeTeam,
      awayTeam,
      matchDate,
      matchTime,
      userProfile: userProfile?.role,
      adminGroups: adminGroups.length
    })
    
    if (!selectedGroupId || !homeTeam || !awayTeam || !matchDate || !matchTime) {
      console.log("Missing required fields")
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      })
      return
    }
    
    if (adminGroups.length === 0) {
      toast({
        title: "Error",
        description: "Primero debes crear un grupo para poder crear partidos",
        variant: "destructive",
      })
      return
    }
    
    // Super admin cannot create matches
    if (userProfile?.role === "superadmin") {
      toast({
        title: "Acceso Restringido",
        description: "Los super administradores no pueden crear partidos",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const dateTime = new Date(`${matchDate}T${matchTime}`)
      console.log("Creating match with datetime:", dateTime.toISOString())
      
      const matchId = await createMatch(
        selectedGroupId, 
        homeTeam.trim(), 
        awayTeam.trim(), 
        dateTime,
        homeTeamLogo || undefined,
        awayTeamLogo || undefined
      )
      console.log("Match created with ID:", matchId)

      toast({
        title: "¡Partido creado!",
        description: "El partido ha sido agregado al grupo",
      })

      // Reset form
      setSelectedGroupId("")
      setHomeTeam("")
      setAwayTeam("")
      setHomeTeamLogo("")
      setAwayTeamLogo("")
      setMatchDate("")
      setMatchTime("")
      setCreateMatchOpen(false)
      loadData()
    } catch (error: any) {
      console.error("Error in handleCreateMatch:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el partido",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatch || homeScore === "" || awayScore === "") return
    
    // Super admin cannot update results
    if (userProfile?.role === "superadmin") {
      toast({
        title: "Acceso Restringido",
        description: "Los super administradores no pueden cargar resultados",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const matchStats = {
        homeScore: Number.parseInt(homeScore),
        awayScore: Number.parseInt(awayScore),
        homeCorners: homeCorners ? Number.parseInt(homeCorners) : 0,
        awayCorners: awayCorners ? Number.parseInt(awayCorners) : 0,
        homePenalties: homePenalties ? Number.parseInt(homePenalties) : 0,
        awayPenalties: awayPenalties ? Number.parseInt(awayPenalties) : 0,
        homeFreeKicks: homeFreeKicks ? Number.parseInt(homeFreeKicks) : 0,
        awayFreeKicks: awayFreeKicks ? Number.parseInt(awayFreeKicks) : 0,
        homeYellowCards: homeYellowCards ? Number.parseInt(homeYellowCards) : 0,
        awayYellowCards: awayYellowCards ? Number.parseInt(awayYellowCards) : 0,
        homeRedCards: homeRedCards ? Number.parseInt(homeRedCards) : 0,
        awayRedCards: awayRedCards ? Number.parseInt(awayRedCards) : 0,
      }

      await updateMatchResult(selectedMatch.id, matchStats)

      toast({
        title: "¡Resultado actualizado!",
        description: "Los puntos han sido calculados automáticamente",
      })

      setEditResultOpen(false)
      setSelectedMatch(null)
      setHomeScore("")
      setAwayScore("")
      setHomeCorners("")
      setAwayCorners("")
      setHomePenalties("")
      setAwayPenalties("")
      setHomeFreeKicks("")
      setAwayFreeKicks("")
      setHomeYellowCards("")
      setAwayYellowCards("")
      setHomeRedCards("")
      setAwayRedCards("")
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el resultado",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMatch = async (match: Match) => {
    if (!confirm(`¿Estás seguro de eliminar el partido ${match.homeTeam} vs ${match.awayTeam}?`)) {
      return
    }
    
    // Super admin cannot delete matches
    if (userProfile?.role === "superadmin") {
      toast({
        title: "Acceso Restringido",
        description: "Los super administradores no pueden eliminar partidos",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteMatch(match.id)
      toast({
        title: "Partido eliminado",
        description: "El partido ha sido eliminado correctamente",
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el partido",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    const confirmMessage = `¿Estás seguro de eliminar el grupo "${group.name}"?\n\nEsta acción eliminará:\n- El grupo y todos sus datos\n- Todos los partidos del grupo\n- Todos los pronósticos de los participantes\n\nEsta acción NO se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    // Super admin cannot delete groups
    if (userProfile?.role === "superadmin") {
      toast({
        title: "Acceso Restringido",
        description: "Los super administradores no pueden eliminar grupos",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteGroup(group.id, userProfile!.uid)
      
      // Mostrar mensaje de éxito
      alert(`✅ ¡Grupo "${group.name}" eliminado exitosamente!\n\nEl grupo y todos sus datos han sido eliminados permanentemente.`)
      
      toast({
        title: "Grupo eliminado",
        description: `El grupo "${group.name}" ha sido eliminado correctamente`,
      })
      
      loadData()
    } catch (error: any) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el grupo",
        variant: "destructive",
      })
    }
  }

  const openEditResult = (match: Match) => {
    setSelectedMatch(match)
    setHomeScore(match.stats?.homeScore?.toString() || "")
    setAwayScore(match.stats?.awayScore?.toString() || "")
    setHomeCorners(match.stats?.homeCorners?.toString() || "")
    setAwayCorners(match.stats?.awayCorners?.toString() || "")
    setHomePenalties(match.stats?.homePenalties?.toString() || "")
    setAwayPenalties(match.stats?.awayPenalties?.toString() || "")
    setHomeFreeKicks(match.stats?.homeFreeKicks?.toString() || "")
    setAwayFreeKicks(match.stats?.awayFreeKicks?.toString() || "")
    setHomeYellowCards(match.stats?.homeYellowCards?.toString() || "")
    setAwayYellowCards(match.stats?.awayYellowCards?.toString() || "")
    setHomeRedCards(match.stats?.homeRedCards?.toString() || "")
    setAwayRedCards(match.stats?.awayRedCards?.toString() || "")
    setEditResultOpen(true)
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

  const upcomingMatches = matches.filter((m) => !m.isFinished)
  const finishedMatches = matches.filter((m) => m.isFinished)

  if (userProfile?.role !== "admin" && userProfile?.role !== "superadmin") {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a este panel</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  // Show message if admin has no groups
  if (userProfile?.role === "admin" && adminGroups.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes grupos creados</h3>
            <p className="text-muted-foreground mb-4">
              Para crear partidos, primero necesitas crear un grupo de pronósticos
            </p>
            <Button onClick={() => onNavigateToGroups ? onNavigateToGroups() : window.location.href = '#groups'}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Grupo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminGroups.length}</div>
            <p className="text-xs text-muted-foreground">Grupos administrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Activos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">Próximos partidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Finalizados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedMatches.length}</div>
            <p className="text-xs text-muted-foreground">Resultados cargados</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Groups Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mis Grupos Administrados
          </CardTitle>
          <CardDescription>
            Gestiona los grupos que has creado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes grupos creados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>👥 {group.participants.length} participantes</span>
                      <span>🔑 Código: {group.joinCode}</span>
                      <span>📅 Creado: {new Date(group.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(group.joinCode)}
                    >
                      📋 Copiar Código
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Crear Partido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Partido</DialogTitle>
              <DialogDescription>Agrega un partido a uno de tus grupos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group">Grupo</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <TeamSelector
                  label="Equipo Local"
                  value={homeTeam}
                  logo={homeTeamLogo}
                  onChange={(team, logo) => {
                    setHomeTeam(team)
                    setHomeTeamLogo(logo || "")
                  }}
                  placeholder="Buscar equipo local..."
                />
                <TeamSelector
                  label="Equipo Visitante"
                  value={awayTeam}
                  logo={awayTeamLogo}
                  onChange={(team, logo) => {
                    setAwayTeam(team)
                    setAwayTeamLogo(logo || "")
                  }}
                  placeholder="Buscar equipo visitante..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchDate">Fecha</Label>
                  <Input
                    id="matchDate"
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchTime">Hora</Label>
                  <Input
                    id="matchTime"
                    type="time"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creando..." : "Crear Partido"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Matches Management */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Próximos ({upcomingMatches.length})</TabsTrigger>
          <TabsTrigger value="finished">Finalizados ({finishedMatches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay partidos próximos</h3>
                <p className="text-muted-foreground mb-4">Crea partidos para que tus participantes hagan pronósticos</p>
                <Button onClick={() => setCreateMatchOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Partido
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingMatches.map((match) => (
              <AdminMatchCard
                key={match.id}
                match={match}
                group={adminGroups.find((g) => g.id === match.groupId)!}
                onEditResult={openEditResult}
                onDelete={handleDeleteMatch}
                formatDate={formatDate}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-4">
          {finishedMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay partidos finalizados</h3>
                <p className="text-muted-foreground">Los partidos con resultados aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            finishedMatches.map((match) => (
              <AdminMatchCard
                key={match.id}
                match={match}
                group={adminGroups.find((g) => g.id === match.groupId)!}
                onEditResult={openEditResult}
                onDelete={handleDeleteMatch}
                formatDate={formatDate}
                showResults
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Result Dialog */}
      <Dialog open={editResultOpen} onOpenChange={setEditResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Resultado</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateResult} className="space-y-6">
            {/* Goles */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">⚽ Goles (Obligatorio)</h4>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <Label htmlFor="homeScore" className="text-sm font-medium">
                    {selectedMatch?.homeTeam}
                  </Label>
                  <Input
                    id="homeScore"
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="text-center text-lg font-bold mt-1"
                    required
                  />
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                </div>

                <div className="text-center">
                  <Label htmlFor="awayScore" className="text-sm font-medium">
                    {selectedMatch?.awayTeam}
                  </Label>
                  <Input
                    id="awayScore"
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="text-center text-lg font-bold mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Corners */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">📐 Corners</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeCorners" className="text-green-700">Local</Label>
                  <Input
                    id="homeCorners"
                    type="number"
                    min="0"
                    value={homeCorners}
                    onChange={(e) => setHomeCorners(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awayCorners" className="text-green-700">Visitante</Label>
                  <Input
                    id="awayCorners"
                    type="number"
                    min="0"
                    value={awayCorners}
                    onChange={(e) => setAwayCorners(e.target.value)}
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
                  <Label htmlFor="homePenalties" className="text-purple-700">Local</Label>
                  <Input
                    id="homePenalties"
                    type="number"
                    min="0"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awayPenalties" className="text-purple-700">Visitante</Label>
                  <Input
                    id="awayPenalties"
                    type="number"
                    min="0"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
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
                  <Label htmlFor="homeFreeKicks" className="text-orange-700">Local</Label>
                  <Input
                    id="homeFreeKicks"
                    type="number"
                    min="0"
                    value={homeFreeKicks}
                    onChange={(e) => setHomeFreeKicks(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awayFreeKicks" className="text-orange-700">Visitante</Label>
                  <Input
                    id="awayFreeKicks"
                    type="number"
                    min="0"
                    value={awayFreeKicks}
                    onChange={(e) => setAwayFreeKicks(e.target.value)}
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
                  <Label htmlFor="homeYellowCards" className="text-yellow-700">Local</Label>
                  <Input
                    id="homeYellowCards"
                    type="number"
                    min="0"
                    value={homeYellowCards}
                    onChange={(e) => setHomeYellowCards(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awayYellowCards" className="text-yellow-700">Visitante</Label>
                  <Input
                    id="awayYellowCards"
                    type="number"
                    min="0"
                    value={awayYellowCards}
                    onChange={(e) => setAwayYellowCards(e.target.value)}
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
                  <Label htmlFor="homeRedCards" className="text-red-700">Local</Label>
                  <Input
                    id="homeRedCards"
                    type="number"
                    min="0"
                    value={homeRedCards}
                    onChange={(e) => setHomeRedCards(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awayRedCards" className="text-red-700">Visitante</Label>
                  <Input
                    id="awayRedCards"
                    type="number"
                    min="0"
                    value={awayRedCards}
                    onChange={(e) => setAwayRedCards(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-md font-medium" disabled={submitting}>
              {submitting ? (
                <>
                  <Target className="w-4 h-4 mr-2 animate-pulse" />
                  Calculando Puntos...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Guardar Resultado y Calcular Puntos
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Los puntos se calcularán automáticamente para todos los participantes
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface AdminMatchCardProps {
  match: Match
  group: Group
  onEditResult: (match: Match) => void
  onDelete: (match: Match) => void
  formatDate: (date: Date) => string
  showResults?: boolean
}

function AdminMatchCard({ match, group, onEditResult, onDelete, formatDate, showResults }: AdminMatchCardProps) {
  const matchStatus = getMatchStatus(match)
  const predictionCount = Object.keys(match.predictions).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-3">
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
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(match.matchDate)}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant={matchStatus.color as any}>{matchStatus.label}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{group.name}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showResults && match.isFinished && match.stats && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-3 text-slate-800">Resultado Final</h4>
            <div className="flex items-center justify-center gap-4 text-lg font-bold mb-4">
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
                <span>{match.homeTeam}</span>
              </div>
              <span className="text-2xl text-primary">
                {match.stats.homeScore} - {match.stats.awayScore}
              </span>
              <div className="flex items-center gap-2">
                <span>{match.awayTeam}</span>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Corners:</span>
                <span>{match.stats.homeCorners || 0} - {match.stats.awayCorners || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Penales:</span>
                <span>{match.stats.homePenalties || 0} - {match.stats.awayPenalties || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tiros Libres:</span>
                <span>{match.stats.homeFreeKicks || 0} - {match.stats.awayFreeKicks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tarjetas:</span>
                <span>
                  🟨{match.stats.homeYellowCards || 0} 🟥{match.stats.homeRedCards || 0} - 
                  🟨{match.stats.awayYellowCards || 0} 🟥{match.stats.awayRedCards || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            <p>{predictionCount} pronósticos recibidos</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEditResult(match)} className="flex-1">
            <Edit className="w-4 h-4 mr-2" />
            {match.isFinished ? "Editar Resultado" : "Cargar Resultado"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(match)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}