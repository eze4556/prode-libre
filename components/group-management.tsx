"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups, joinGroup, leaveGroup, createGroup } from "@/lib/groups"
import type { Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, LogOut, Copy, Crown, Calendar } from "lucide-react"

export function GroupManagement() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)

  // Form states for creating group
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")

  useEffect(() => {
    loadGroups()
  }, [userProfile])

  const loadGroups = async () => {
    if (!userProfile) return

    try {
      const userGroups = await getUserGroups(userProfile.uid)
      setGroups(userGroups)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile || !userProfile.uid || !joinCode.trim()) {
      toast({
        title: "Error",
        description: "Información de usuario incompleta. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      await joinGroup(joinCode.trim(), userProfile.uid, userProfile.displayName || "Usuario")
      toast({
        title: "¡Éxito!",
        description: "Te has unido al grupo correctamente",
      })
      setJoinCode("")
      setJoinDialogOpen(false)
      loadGroups()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo unir al grupo",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !groupName.trim()) return

    setIsCreating(true)
    try {
      await createGroup(
        groupName.trim(),
        groupDescription.trim(),
        userProfile.uid,
        userProfile.displayName || "Usuario",
        maxParticipants ? Number.parseInt(maxParticipants) : undefined,
      )
      toast({
        title: "¡Grupo creado!",
        description: "Tu grupo ha sido creado exitosamente",
      })
      setGroupName("")
      setGroupDescription("")
      setMaxParticipants("")
      setCreateDialogOpen(false)
      loadGroups()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el grupo",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!userProfile) return

    try {
      await leaveGroup(groupId, userProfile.uid)
      toast({
        title: "Grupo abandonado",
        description: `Has salido del grupo "${groupName}"`,
      })
      loadGroups()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo abandonar el grupo",
        variant: "destructive",
      })
    }
  }

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Código copiado",
      description: "El código de grupo ha sido copiado al portapapeles",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando grupos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 bg-transparent">
              <Users className="w-4 h-4 mr-2" />
              Unirse a Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unirse a un Grupo</DialogTitle>
              <DialogDescription>Ingresa el código del grupo para unirte</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Código del Grupo</Label>
                <Input
                  id="joinCode"
                  placeholder="Ej: ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isJoining}>
                {isJoining ? "Uniéndose..." : "Unirse al Grupo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {userProfile?.role === "admin" && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Crear Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                <DialogDescription>Configura tu grupo de pronósticos</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nombre del Grupo</Label>
                  <Input
                    id="groupName"
                    placeholder="Ej: Liga de Amigos"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Descripción</Label>
                  <Textarea
                    id="groupDescription"
                    placeholder="Describe tu grupo..."
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Máximo de Participantes (opcional)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="Sin límite"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    min="2"
                    max="100"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Grupo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes grupos</h3>
            <p className="text-muted-foreground mb-4">Únete a un grupo existente o crea uno nuevo para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {group.name}
                      {group.adminId === userProfile?.uid && <Crown className="w-4 h-4 text-primary" />}
                    </CardTitle>
                    <CardDescription className="mt-1">{group.description || "Sin descripción"}</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{group.participants.length} participantes</span>
                  {group.maxParticipants && <span>/ {group.maxParticipants}</span>}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Código del grupo:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {group.joinCode}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => copyJoinCode(group.joinCode)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Admin: {group.adminName}</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Creado: {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {group.adminId !== userProfile?.uid && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Abandonar Grupo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
