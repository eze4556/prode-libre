"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups, deleteGroup } from "@/lib/groups"
import { getAdminMatches, createMatch, updateMatchResult, deleteMatch, getMatchStatus } from "@/lib/matches"
import { createJornada, getJornadasByGroup, deleteJornada, updateJornada } from "@/lib/jornadas"
import type { Group, Match, Jornada } from "@/lib/types"
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
import { Plus, Calendar, Trophy, Trash2, Edit, Users, Target, Settings, Eye, MoreVertical, UserCheck, UserX, Clock } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

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
  const [selectedResult, setSelectedResult] = useState<'local' | 'empate' | 'visitante' | ''>('')

  // Form states
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [homeTeamLogo, setHomeTeamLogo] = useState("")
  const [awayTeamLogo, setAwayTeamLogo] = useState("")
  const [matchDate, setMatchDate] = useState("")
  const [matchTime, setMatchTime] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Estados para crear jornada
  const [createJornadaOpen, setCreateJornadaOpen] = useState(false)
  const [jornadaName, setJornadaName] = useState("")
  const [jornadaDescription, setJornadaDescription] = useState("")
  const [jornadaStartDate, setJornadaStartDate] = useState("")
  const [jornadaEndDate, setJornadaEndDate] = useState("")
  const [jornadaSubmitting, setJornadaSubmitting] = useState(false)
  const [jornadaGroupId, setJornadaGroupId] = useState("")

  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>("")

  // Estados para edición y eliminación de jornada
  const [editJornadaOpen, setEditJornadaOpen] = useState(false)
  const [jornadaToEdit, setJornadaToEdit] = useState<Jornada | null>(null)
  const [editJornadaName, setEditJornadaName] = useState("")
  const [editJornadaDescription, setEditJornadaDescription] = useState("")
  const [editJornadaStartDate, setEditJornadaStartDate] = useState("")
  const [editJornadaEndDate, setEditJornadaEndDate] = useState("")
  const [editJornadaSubmitting, setEditJornadaSubmitting] = useState(false)
  const [deleteJornadaOpen, setDeleteJornadaOpen] = useState(false)
  const [jornadaToDelete, setJornadaToDelete] = useState<Jornada | null>(null)

  // Estados para ver jornada
  const [viewJornadaOpen, setViewJornadaOpen] = useState(false)
  const [jornadaToView, setJornadaToView] = useState<Jornada | null>(null)

  // Handler para abrir modal de edición
  const handleEditJornada = (jornada: Jornada) => {
    setJornadaToEdit(jornada)
    setEditJornadaName(jornada.name)
    setEditJornadaDescription(jornada.description || "")
    setEditJornadaStartDate(jornada.startDate.toISOString().slice(0, 10))
    setEditJornadaEndDate(jornada.endDate.toISOString().slice(0, 10))
    setEditJornadaOpen(true)
  }
  // Handler para guardar edición
  const handleSaveEditJornada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jornadaToEdit) return
    setEditJornadaSubmitting(true)
    try {
      await updateJornada(jornadaToEdit.id, {
        name: editJornadaName.trim(),
        description: editJornadaDescription.trim(),
        startDate: new Date(editJornadaStartDate),
        endDate: new Date(editJornadaEndDate),
      })
      toast({ title: "¡Jornada actualizada!", description: "Los cambios se guardaron correctamente." })
      setEditJornadaOpen(false)
      setJornadaToEdit(null)
      loadData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la jornada", variant: "destructive" })
    } finally {
      setEditJornadaSubmitting(false)
    }
  }
  // Handler para abrir confirmación de borrado
  const handleDeleteJornada = (jornada: Jornada) => {
    setJornadaToDelete(jornada)
    setDeleteJornadaOpen(true)
  }
  // Handler para borrar jornada
  const handleConfirmDeleteJornada = async () => {
    if (!jornadaToDelete) return
    try {
      await deleteJornada(jornadaToDelete.id)
      toast({ title: "Jornada eliminada", description: "La jornada fue eliminada correctamente." })
      setDeleteJornadaOpen(false)
      setJornadaToDelete(null)
      loadData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la jornada", variant: "destructive" })
    }
  }
  // Handler para agregar partido a jornada
  const handleAddMatchToJornada = (jornada: Jornada) => {
    setSelectedGroupId(jornada.groupId)
    setSelectedJornadaId(jornada.id)
    setMatchDate("")
    setMatchTime("")
    setHomeTeam("")
    setAwayTeam("")
    setHomeTeamLogo("")
    setAwayTeamLogo("")
    setCreateMatchOpen(true)
  }


  // Handler para ver jornada
  const handleViewJornada = (jornada: Jornada) => {
    setJornadaToView(jornada)
    setViewJornadaOpen(true)
  }

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile || (userProfile.role !== "admin" && userProfile.role !== "superadmin")) return

    try {
      let adminGroupsToUse = []
      if (userProfile.role === "superadmin") {
        const allGroups = await getUserGroups(userProfile.uid)
        adminGroupsToUse = allGroups // Usar todos los grupos para superadmin
        setAdminGroups(adminGroupsToUse)
        const adminMatches = await getAdminMatches(userProfile.uid)
        setMatches(adminMatches)
      } else {
        const allGroups = await getUserGroups(userProfile.uid)
        adminGroupsToUse = allGroups.filter((group) => group.adminId === userProfile.uid)
        setAdminGroups(adminGroupsToUse)
        const adminMatches = await getAdminMatches(userProfile.uid)
        setMatches(adminMatches)
      }
      // Cargar jornadas de todos los grupos administrados
      const allJornadas = []
      for (const group of adminGroupsToUse) {
        const groupJornadas = await getJornadasByGroup(group.id)
        allJornadas.push(...groupJornadas)
      }
      setJornadas(allJornadas)
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
    e.preventDefault();
    if (!selectedGroupId || !homeTeam || !awayTeam || !matchDate || !matchTime) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }
    if (adminGroups.length === 0) {
      toast({
        title: "Error",
        description: "Primero debes crear un grupo para poder crear partidos",
        variant: "destructive",
      });
      return;
    }
    if (userProfile?.role === "superadmin") {
      toast({
        title: "Acceso Restringido",
        description: "Los super administradores no pueden crear partidos",
        variant: "destructive",
      });
      return;
    }

    // Validar que si se selecciona una jornada, la fecha del partido esté dentro del rango
    if (selectedJornadaId && selectedJornadaId !== "none") {
      const jornada = jornadas.find(j => j.id === selectedJornadaId);
      if (jornada) {
        const dateTime = new Date(`${matchDate}T${matchTime}`);
        
        // Crear fechas de inicio y fin de la jornada en hora local
        const jornadaStartDate = new Date(jornada.startDate.getFullYear(), jornada.startDate.getMonth(), jornada.startDate.getDate(), 0, 0, 0, 0);
        const jornadaEndDate = new Date(jornada.endDate.getFullYear(), jornada.endDate.getMonth(), jornada.endDate.getDate(), 23, 59, 59, 999);
        
        // Crear fecha del partido en hora local
        const [matchYear, matchMonth, matchDay] = matchDate.split('-').map(Number);
        const matchDateOnly = new Date(matchYear, matchMonth - 1, matchDay, 0, 0, 0, 0);
        
        if (matchDateOnly < jornadaStartDate || matchDateOnly > jornadaEndDate) {
          toast({
            title: "Error de Fecha",
            description: `La fecha del partido debe estar entre ${jornada.startDate.toLocaleDateString('es-ES')} y ${jornada.endDate.toLocaleDateString('es-ES')}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const dateTime = new Date(`${matchDate}T${matchTime}`);
      if (isNaN(dateTime.getTime())) {
        throw new Error("La fecha y hora del partido no son válidas");
      }
      const matchId = await createMatch(
        selectedGroupId, 
        selectedJornadaId && selectedJornadaId !== "none" ? selectedJornadaId : "",
        homeTeam.trim(), 
        awayTeam.trim(), 
        dateTime,
        homeTeamLogo || undefined,
        awayTeamLogo || undefined
      );
      toast({
        title: "¡Partido creado!",
        description: "El partido ha sido agregado al grupo",
      });
      setSelectedGroupId("");
      setSelectedJornadaId("none");
      setHomeTeam("");
      setAwayTeam("");
      setHomeTeamLogo("");
      setAwayTeamLogo("");
      setMatchDate("");
      setMatchTime("");
      setCreateMatchOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error in handleCreateMatch:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el partido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatch || !selectedResult) return
    
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
        result: selectedResult,
      }

      await updateMatchResult(selectedMatch.id, matchStats)
      console.log("Result updated for match:", selectedMatch.id)

      toast({
        title: "¡Resultado actualizado!",
        description: "Los puntos han sido calculados automáticamente",
      })

      setEditResultOpen(false)
      setSelectedMatch(null)
      setSelectedResult("")
      console.log("Reloading data after result update...")
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
    setSelectedResult(match.stats?.result || '')
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

  // Debug logs
  console.log("🔍 Debug AdminPanel:")
  console.log("- Total matches:", matches.length)
  console.log("- Upcoming matches:", upcomingMatches.length)
  console.log("- Finished matches:", finishedMatches.length)
  console.log("- Jornadas:", jornadas.length)
  console.log("- Admin groups:", adminGroups.length)
  
  if (upcomingMatches.length > 0) {
    console.log("- Sample upcoming match:", upcomingMatches[0])
    console.log("- Upcoming match jornadaId:", upcomingMatches[0].jornadaId)
  }
  
  if (jornadas.length > 0) {
    console.log("- Sample jornada:", jornadas[0])
  }

  // Manejar creación de jornada
  const handleCreateJornada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !jornadaName.trim() || !jornadaStartDate || !jornadaEndDate || !jornadaGroupId) return;
    setJornadaSubmitting(true);
    try {
      // Crear fechas en zona horaria local para evitar problemas de conversión
      const [startYear, startMonth, startDay] = jornadaStartDate.split('-').map(Number)
      const [endYear, endMonth, endDay] = jornadaEndDate.split('-').map(Number)
      
      const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      const endDate = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0)
      
      const jornadaId = await createJornada(
        jornadaGroupId,
        jornadaName.trim(),
        jornadaDescription.trim(),
        startDate,
        endDate,
        userProfile.uid
      );
      toast({
        title: "¡Jornada creada!",
        description: "La jornada ha sido creada exitosamente",
      });
      setJornadaName("");
      setJornadaDescription("");
      setJornadaStartDate("");
      setJornadaEndDate("");
      setJornadaGroupId("");
      setCreateJornadaOpen(false);
      setSelectedGroupId(jornadaGroupId);
      setCreateMatchOpen(true);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la jornada",
        variant: "destructive",
      });
    } finally {
      setJornadaSubmitting(false);
    }
  };

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
            <Button onClick={() => onNavigateToGroups ? onNavigateToGroups() : window.location.href = '#groups'} className="h-9 sm:h-10">
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Crear Grupo</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Mis Grupos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{adminGroups.length}</div>
            <p className="text-xs text-muted-foreground">Grupos administrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Partidos Activos</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">Próximos partidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Partidos Finalizados</CardTitle>
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{finishedMatches.length}</div>
            <p className="text-xs text-muted-foreground">Resultados cargados</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Groups Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Mis Grupos Administrados
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gestiona los grupos que has creado
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {adminGroups.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">No tienes grupos creados</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {adminGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{group.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{group.description}</p>
                    <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                      <span>👥 {group.participants.length - 1} participantes</span>
                      <span>🔑 Código: {group.joinCode}</span>
                      <span>📅 Creado: {new Date(group.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(group.joinCode)}
                      className="h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">📋 Copiar Código</span>
                      <span className="sm:hidden">📋</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGroup(group)}
                      className="h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
          <DialogTrigger asChild>
            
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Crear Nuevo Partido</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Agrega un partido a uno de tus grupos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-3 sm:space-y-4 max-h-[calc(95vh-120px)] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="group" className="text-sm sm:text-base">Grupo</Label>
                <Select value={selectedGroupId} onValueChange={(value) => {
                  setSelectedGroupId(value);
                  setSelectedJornadaId("none"); // Reset jornada when group changes
                }} required>
                  <SelectTrigger className="h-9 sm:h-10">
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

              <div className="space-y-2">
                <Label htmlFor="jornada" className="text-sm sm:text-base">Jornada (Opcional)</Label>
                <Select value={selectedJornadaId} onValueChange={setSelectedJornadaId}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecciona una jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin jornada específica</SelectItem>
                    {jornadas
                      .filter(j => j.groupId === selectedGroupId)
                      .map((jornada) => (
                        <SelectItem key={jornada.id} value={jornada.id}>
                          {jornada.name} ({jornada.startDate.toLocaleDateString('es-ES')} - {jornada.endDate.toLocaleDateString('es-ES')})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedJornadaId && selectedJornadaId !== "none" && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Restricción de fecha:</strong> El partido debe estar entre las fechas de la jornada seleccionada
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
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
                </div>
                <div className="space-y-2">
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
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matchDate" className="text-sm sm:text-base">Fecha</Label>
                  <Input
                    id="matchDate"
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                    className="h-9 sm:h-10 w-full"
                    min={selectedJornadaId && selectedJornadaId !== "none" ? (() => {
                      const jornada = jornadas.find(j => j.id === selectedJornadaId);
                      return jornada ? jornada.startDate.toISOString().split('T')[0] : undefined;
                    })() : undefined}
                    max={selectedJornadaId && selectedJornadaId !== "none" ? (() => {
                      const jornada = jornadas.find(j => j.id === selectedJornadaId);
                      return jornada ? jornada.endDate.toISOString().split('T')[0] : undefined;
                    })() : undefined}
                  />
                  {selectedJornadaId && selectedJornadaId !== "none" && (() => {
                    const jornada = jornadas.find(j => j.id === selectedJornadaId);
                    return jornada ? (
                      <div className="text-xs text-slate-500">
                        Fecha permitida: {jornada.startDate.toLocaleDateString('es-ES')} - {jornada.endDate.toLocaleDateString('es-ES')}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchTime" className="text-sm sm:text-base">Hora</Label>
                  <Input
                    id="matchTime"
                    type="time"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    required
                    className="h-9 sm:h-10 w-full"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-9 sm:h-10" disabled={submitting}>
                <span className="text-sm sm:text-base">{submitting ? "Creando..." : "Crear Partido"}</span>
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={createJornadaOpen} onOpenChange={setCreateJornadaOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 h-10 sm:h-11" variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Crear Jornada</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Crear Nueva Jornada</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Agrega una fecha/jornada a uno de tus grupos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateJornada} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jornadaGroup" className="text-sm sm:text-base">Grupo</Label>
                <Select value={jornadaGroupId} onValueChange={setJornadaGroupId} required>
                  <SelectTrigger className="h-9 sm:h-10">
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
              <div className="space-y-2">
                <Label htmlFor="jornadaName" className="text-sm sm:text-base">Nombre de la Jornada</Label>
                <Input
                  id="jornadaName"
                  placeholder="Ej: Fecha 1, Cuartos de Final, etc."
                  value={jornadaName}
                  onChange={(e) => setJornadaName(e.target.value)}
                  required
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jornadaDescription" className="text-sm sm:text-base">Descripción</Label>
                <Textarea
                  id="jornadaDescription"
                  placeholder="Descripción opcional de la jornada"
                  value={jornadaDescription}
                  onChange={(e) => setJornadaDescription(e.target.value)}
                  rows={2}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jornadaStartDate" className="text-sm sm:text-base">Fecha de inicio</Label>
                  <Input
                    id="jornadaStartDate"
                    type="date"
                    value={jornadaStartDate}
                    onChange={(e) => setJornadaStartDate(e.target.value)}
                    required
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jornadaEndDate" className="text-sm sm:text-base">Fecha de fin</Label>
                  <Input
                    id="jornadaEndDate"
                    type="date"
                    value={jornadaEndDate}
                    onChange={(e) => setJornadaEndDate(e.target.value)}
                    required
                    className="h-9 sm:h-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-9 sm:h-10" disabled={jornadaSubmitting}>
                <span className="text-sm sm:text-base">{jornadaSubmitting ? "Creando..." : "Crear Jornada"}</span>
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Matches Management + Jornadas */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Próximos ({upcomingMatches.length})</TabsTrigger>
          <TabsTrigger value="finished" className="text-xs sm:text-sm">Finalizados ({finishedMatches.length})</TabsTrigger>
          <TabsTrigger value="jornadas" className="text-xs sm:text-sm">Jornadas ({jornadas.length})</TabsTrigger>
        </TabsList>

        {/* Jornadas - Vista mejorada con filtros y estadísticas */}
        <TabsContent value="jornadas" className="space-y-4">
          {/* Header con estadísticas generales */}
          {jornadas.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Resumen de Jornadas
                </h3>
                <div className="text-sm text-slate-600">
                  {jornadas.length} jornada{jornadas.length !== 1 ? 's' : ''} creada{jornadas.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-blue-600">{jornadas.length}</div>
                  <div className="text-xs text-slate-600">Jornadas</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-orange-600">
                    {jornadas.reduce((acc, j) => acc + matches.filter(m => m.jornadaId === j.id && !m.isFinished).length, 0)}
                  </div>
                  <div className="text-xs text-slate-600">Próximos</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-green-600">
                    {jornadas.reduce((acc, j) => acc + matches.filter(m => m.jornadaId === j.id && m.isFinished).length, 0)}
                  </div>
                  <div className="text-xs text-slate-600">Finalizados</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-purple-600">
                    {jornadas.reduce((acc, j) => acc + matches.filter(m => m.jornadaId === j.id).length, 0)}
                  </div>
                  <div className="text-xs text-slate-600">Total</div>
                </div>
              </div>
            </div>
          )}

          {jornadas.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-3">¡Crea tu primera jornada!</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  Las jornadas te ayudan a organizar tus partidos por fechas o torneos específicos
                </p>
                <Button 
                  onClick={() => setCreateJornadaOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primera Jornada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jornadas.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map((jornada) => {
                const grupo = adminGroups.find(g => g.id === jornada.groupId)
                const partidos = matches.filter(m => m.jornadaId === jornada.id)
                const partidosProximos = partidos.filter(p => !p.isFinished).length
                const partidosFinalizados = partidos.filter(p => p.isFinished).length
                const progreso = partidos.length > 0 ? Math.round((partidosFinalizados / partidos.length) * 100) : 0
                
                // Determinar el estado de la jornada
                const ahora = new Date()
                const esActiva = ahora >= jornada.startDate && ahora <= jornada.endDate
                const esFutura = ahora < jornada.startDate
                const esPasada = ahora > jornada.endDate
                
                return (
                  <Card key={jornada.id} className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 ${
                    esActiva ? 'border-l-green-500 bg-gradient-to-r from-green-50/30 to-transparent' :
                    esFutura ? 'border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent' :
                    'border-l-gray-400 bg-gradient-to-r from-gray-50/30 to-transparent'
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              esActiva ? 'bg-green-100' : esFutura ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Calendar className={`w-5 h-5 ${
                                esActiva ? 'text-green-600' : esFutura ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-slate-800 mb-1">
                                {jornada.name}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  {grupo ? grupo.name : 'Grupo eliminado'}
                                </span>
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  esActiva ? 'bg-green-100 text-green-700' :
                                  esFutura ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {esActiva ? '🟢 Activa' : esFutura ? '🔵 Futura' : '⚫ Pasada'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {jornada.description && (
                            <div className="bg-slate-50 rounded-lg p-3 mt-3">
                              <p className="text-sm text-slate-600 italic">"{jornada.description}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Fechas mejoradas */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Inicio</span>
                          </div>
                          <p className="text-sm font-bold text-blue-900 mb-1">
                            {jornada.startDate instanceof Date ? 
                              jornada.startDate.toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                              }) : 
                              'Fecha no válida'
                            }
                          </p>
                          <p className="text-xs text-blue-600">
                            {jornada.startDate instanceof Date ? 
                              jornada.startDate.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                              }) : 
                              'Hora no válida'
                            }
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Fin</span>
                          </div>
                          <p className="text-sm font-bold text-purple-900 mb-1">
                            {jornada.endDate instanceof Date ? 
                              jornada.endDate.toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                              }) : 
                              'Fecha no válida'
                            }
                          </p>
                          <p className="text-xs text-purple-600">
                            {jornada.endDate instanceof Date ? 
                              jornada.endDate.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                              }) : 
                              'Hora no válida'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Estadísticas mejoradas */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <div className="text-2xl font-bold text-slate-800 mb-1">{partidos.length}</div>
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</div>
                        </div>
                        <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                          <div className="text-2xl font-bold text-orange-800 mb-1">{partidosProximos}</div>
                          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Próximos</div>
                        </div>
                        <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="text-2xl font-bold text-green-800 mb-1">{partidosFinalizados}</div>
                          <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Finalizados</div>
                        </div>
                      </div>

                      {/* Barra de progreso mejorada */}
                      {partidos.length > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-slate-700">Progreso de la Jornada</span>
                            <span className="text-sm font-bold text-slate-800">{progreso}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>{partidosFinalizados} finalizados</span>
                            <span>{partidosProximos} pendientes</span>
                          </div>
                        </div>
                      )}

                      {/* Botones de acción mejorados */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewJornada(jornada)}
                            className="flex-1 h-10 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Fixture
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddMatchToJornada(jornada)}
                            className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Partido
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditJornada(jornada)}
                            className="flex-1 h-10 border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteJornada(jornada)}
                            className="flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
        {/* Próximos - mobile friendly, cards apiladas */}
        <TabsContent value="upcoming" className="space-y-3 sm:space-y-4">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No hay partidos próximos</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Crea partidos para que tus participantes hagan pronósticos</p>
              </CardContent>
            </Card>
          ) : (
            jornadas.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map((jornada) => {
              const grupo = adminGroups.find(g => g.id === jornada.groupId)
              const partidos = upcomingMatches.filter(m => m.jornadaId === jornada.id)
              
              if (partidos.length === 0) return null
              return (
                <div key={jornada.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-800 text-base sm:text-lg">{jornada.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{grupo ? grupo.name : 'Grupo eliminado'}</span>
                  </div>
                  <div className="space-y-3">
                    {partidos.sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime()).map((match) => (
                      <Card key={match.id} className="flex flex-col gap-2 p-4 border-l-4 border-blue-400 bg-white shadow-md rounded-xl">
                        <div className="flex items-center justify-between gap-2">
                          {/* Local */}
                          <div className="flex flex-col items-center flex-1">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-10 h-10 object-contain mb-1" />
                            )}
                            <span className="font-semibold text-xs text-center">{match.homeTeam}</span>
                          </div>
                          <div className="flex flex-col items-center flex-shrink-0 mx-2">
                            <span className="text-xs text-muted-foreground mb-1">{formatDate(match.matchDate)}</span>
                            <span className="font-bold text-blue-700 text-base">Próximo</span>
                          </div>
                          {/* Visitante */}
                          <div className="flex flex-col items-center flex-1">
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-10 h-10 object-contain mb-1" />
                            )}
                            <span className="font-semibold text-xs text-center">{match.awayTeam}</span>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditResult(match)}>
                            Editar Resultado
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteMatch(match)}>
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>

        {/* Finalizados - mobile friendly, cards apiladas */}
        <TabsContent value="finished" className="space-y-4">
          {jornadas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No hay jornadas cargadas</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Crea jornadas y partidos para ver resultados aquí</p>
              </CardContent>
            </Card>
          ) : (
            jornadas.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map((jornada) => {
              const grupo = adminGroups.find(g => g.id === jornada.groupId)
              const partidos = finishedMatches.filter(m => m.jornadaId === jornada.id)
              if (partidos.length === 0) return null
              return (
                <div key={jornada.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800 text-base sm:text-lg">{jornada.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{grupo ? grupo.name : 'Grupo eliminado'}</span>
                  </div>
                  <div className="space-y-3">
                    {partidos.sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime()).map((match) => (
                      <Card key={match.id} className="flex flex-col gap-2 p-4 border-l-4 border-green-400 bg-white shadow-md rounded-xl">
                        <div className="flex items-center justify-between gap-2">
                          {/* Local */}
                          <div className="flex flex-col items-center flex-1">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-10 h-10 object-contain mb-1" />
                            )}
                            <span className="font-semibold text-xs text-center">{match.homeTeam}</span>
                          </div>
                          <div className="flex flex-col items-center flex-shrink-0 mx-2">
                            <span className="text-xs text-muted-foreground mb-1">{formatDate(match.matchDate)}</span>
                            <span className="font-bold text-green-700 text-base">
                              {match.stats?.result === 'local' && 'Gana Local'}
                              {match.stats?.result === 'empate' && 'Empate'}
                              {match.stats?.result === 'visitante' && 'Gana Visitante'}
                            </span>
                          </div>
                          {/* Visitante */}
                          <div className="flex flex-col items-center flex-1">
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-10 h-10 object-contain mb-1" />
                            )}
                            <span className="font-semibold text-xs text-center">{match.awayTeam}</span>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDeleteMatch(match)}>
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Result Dialog */}
      <Dialog open={editResultOpen} onOpenChange={setEditResultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Cargar Resultado</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedMatch && `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateResult} className="space-y-4 sm:space-y-6">
            {/* Resultado */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-4 text-sm sm:text-base text-center">🏆 Resultado del Partido</h4>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  variant={selectedResult === 'local' ? 'default' : 'outline'}
                  onClick={() => setSelectedResult('local')}
                  className="h-12 text-sm font-semibold"
                >
                  🏠 Gana {selectedMatch?.homeTeam}
                </Button>
                <Button
                  type="button"
                  variant={selectedResult === 'empate' ? 'default' : 'outline'}
                  onClick={() => setSelectedResult('empate')}
                  className="h-12 text-sm font-semibold"
                >
                  ⚖️ Empate
                </Button>
                <Button
                  type="button"
                  variant={selectedResult === 'visitante' ? 'default' : 'outline'}
                  onClick={() => setSelectedResult('visitante')}
                  className="h-12 text-sm font-semibold"
                >
                  🏠 Gana {selectedMatch?.awayTeam}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditResultOpen(false)}
                className="flex-1 h-9 sm:h-10 text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 sm:h-10 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-sm"
                disabled={submitting || !selectedResult}
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
                    <span className="hidden sm:inline">Guardar Resultado</span>
                    <span className="sm:hidden">Guardar</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modales de editar y eliminar jornada */}
      <Dialog open={editJornadaOpen} onOpenChange={setEditJornadaOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Editar Jornada</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Modifica los datos de la jornada</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEditJornada} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editJornadaName" className="text-sm sm:text-base">Nombre</Label>
              <Input id="editJornadaName" value={editJornadaName} onChange={e => setEditJornadaName(e.target.value)} required className="h-9 sm:h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editJornadaDescription" className="text-sm sm:text-base">Descripción</Label>
              <Textarea id="editJornadaDescription" value={editJornadaDescription} onChange={e => setEditJornadaDescription(e.target.value)} rows={2} className="text-sm sm:text-base" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="editJornadaStartDate" className="text-sm sm:text-base">Fecha de inicio</Label>
                <Input id="editJornadaStartDate" type="date" value={editJornadaStartDate} onChange={e => setEditJornadaStartDate(e.target.value)} required className="h-9 sm:h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editJornadaEndDate" className="text-sm sm:text-base">Fecha de fin</Label>
                <Input id="editJornadaEndDate" type="date" value={editJornadaEndDate} onChange={e => setEditJornadaEndDate(e.target.value)} required className="h-9 sm:h-10" />
              </div>
            </div>
            <Button type="submit" className="w-full h-9 sm:h-10" disabled={editJornadaSubmitting}>
              <span className="text-sm sm:text-base">{editJornadaSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteJornadaOpen} onOpenChange={setDeleteJornadaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Eliminar Jornada</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">¿Estás seguro que deseas eliminar la jornada "{jornadaToDelete?.name}"? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteJornadaOpen(false)} className="flex-1 h-9 sm:h-10 text-sm">Cancelar</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDeleteJornada} className="flex-1 h-9 sm:h-10 text-sm">Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de ver jornada como fixture */}
      <Dialog open={viewJornadaOpen} onOpenChange={setViewJornadaOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl md:max-w-4xl max-h-[95vh] p-0 mx-2">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <DialogTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 truncate">{jornadaToView?.name}</div>
                <div className="text-xs sm:text-sm font-normal text-slate-600 truncate">
                  {jornadaToView && adminGroups.find(g => g.id === jornadaToView.groupId)?.name || 'Grupo eliminado'}
                </div>
              </div>
            </DialogTitle>
            {jornadaToView && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">Inicio:</span> 
                  <span className="truncate">
                    {jornadaToView.startDate instanceof Date ? 
                      jornadaToView.startDate.toLocaleDateString('es-ES') : 
                      'Fecha no válida'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">Fin:</span> 
                  <span className="truncate">
                    {jornadaToView.endDate instanceof Date ? 
                      jornadaToView.endDate.toLocaleDateString('es-ES') : 
                      'Fecha no válida'
                    }
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {jornadaToView && matches.filter(m => m.jornadaId === jornadaToView.id).length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-2">No hay partidos en esta jornada</h3>
                <p className="text-sm text-slate-500">Agrega partidos para ver el fixture completo</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {jornadaToView && matches.filter(m => m.jornadaId === jornadaToView.id).sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime()).map((match) => (
                  <div key={match.id} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium truncate">{formatDate(match.matchDate)}</span>
                      </div>
                      <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        match.isFinished 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {match.isFinished ? 'Finalizado' : 'Pendiente'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      {/* Equipo Local */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {match.homeTeamLogo ? (
                            <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain" />
                          ) : (
                            <span className="text-slate-400 font-bold text-sm sm:text-base md:text-lg">🏠</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 text-sm sm:text-base truncate">{match.homeTeam}</div>
                          <div className="text-xs text-slate-500">Local</div>
                        </div>
                      </div>
                      
                      {/* VS */}
                      <div className="flex flex-col items-center mx-2 sm:mx-4 flex-shrink-0">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-400">VS</div>
                        {match.isFinished && (
                          <div className="text-xs text-slate-500 mt-1">
                            {match.stats?.result === 'local' && '🏠'}
                            {match.stats?.result === 'empate' && '🤝'}
                            {match.stats?.result === 'visitante' && '✈️'}
                          </div>
                        )}
                      </div>
                      
                      {/* Equipo Visitante */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end">
                        <div className="min-w-0 flex-1 text-right">
                          <div className="font-bold text-slate-800 text-sm sm:text-base truncate">{match.awayTeam}</div>
                          <div className="text-xs text-slate-500">Visitante</div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {match.awayTeamLogo ? (
                            <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain" />
                          ) : (
                            <span className="text-slate-400 font-bold text-sm sm:text-base md:text-lg">✈️</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Resultado */}
                    {match.isFinished && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                            {match.stats?.result === 'local' && '🏠 Gana Local'}
                            {match.stats?.result === 'empate' && '🤝 Empate'}
                            {match.stats?.result === 'visitante' && '✈️ Gana Visitante'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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

  console.log(`AdminMatchCard - Match ${match.id}:`, {
    isFinished: match.isFinished,
    hasStats: !!match.stats,
    stats: match.stats,
    showResults
  })

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
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {match.stats.result === 'local' && `🏠 Gana ${match.homeTeam}`}
                {match.stats.result === 'empate' && '⚖️ Empate'}
                {match.stats.result === 'visitante' && `🏠 Gana ${match.awayTeam}`}
              </div>
            </div>
          </div>
        )}
        
        {showResults && match.isFinished && !match.stats && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold mb-3 text-red-800">⚠️ Resultado No Cargado</h4>
            <p className="text-red-700">Este partido está marcado como finalizado pero no tiene estadísticas cargadas.</p>
            <p className="text-sm text-red-600 mt-2">Match ID: {match.id}</p>
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
