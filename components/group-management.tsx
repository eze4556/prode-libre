"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups, requestToJoinGroup, leaveGroup, createGroup } from "@/lib/groups"
import type { Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      const result = await requestToJoinGroup(
        joinCode.trim(), 
        userProfile.uid, 
        userProfile.displayName || userProfile.email?.split('@')[0] || "Usuario",
        userProfile.email || ""
      )
      
      if (result.requiresApproval) {
        toast({
          title: "Solicitud enviada",
          description: result.message,
        })
      } else {
        toast({
          title: "¡Éxito!",
          description: result.message,
        })
        loadGroups()
      }
      
      setJoinCode("")
      setJoinDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !groupName.trim()) return

    console.log("Creating group with:", {
      name: groupName.trim(),
      adminId: userProfile.uid,
      adminName: userProfile.displayName || "Usuario"
    })

    setIsCreating(true)
    try {
      const groupId = await createGroup(
        groupName.trim(),
        "", // Descripción vacía
        userProfile.uid,
        userProfile.displayName || "Usuario",
        undefined, // Sin máximo de participantes
      )
      
      console.log("Group created successfully with ID:", groupId)
      
      toast({
        title: "¡Grupo creado!",
        description: "Tu grupo ha sido creado exitosamente",
      })
      setGroupName("")
      setCreateDialogOpen(false)
      loadGroups()
    } catch (error: any) {
      console.error("Error creating group:", error)
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
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 bg-transparent h-10 sm:h-11">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Unirse a Grupo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Unirse a un Grupo</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Ingresa el código del grupo para unirte</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinGroup} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode" className="text-sm sm:text-base">Código del Grupo</Label>
                <Input
                  id="joinCode"
                  placeholder="Ej: ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="h-9 sm:h-10"
                />
              </div>
              <Button type="submit" className="w-full h-9 sm:h-10" disabled={isJoining}>
                <span className="text-sm sm:text-base">{isJoining ? "Uniéndose..." : "Unirse al Grupo"}</span>
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {userProfile?.role === "admin" && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-10 sm:h-11">
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Crear Grupo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Crear Nuevo Grupo</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">Ingresa el nombre de tu grupo</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-sm sm:text-base">Nombre del Grupo</Label>
                  <Input
                    id="groupName"
                    placeholder="Ej: Liga de Amigos"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    className="h-10 sm:h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-10 sm:h-11" disabled={isCreating}>
                  <span className="text-sm sm:text-base">{isCreating ? "Creando..." : "Crear Grupo"}</span>
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No tienes grupos</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">Únete a un grupo existente o crea uno nuevo para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <span className="truncate">{group.name}</span>
                      {group.adminId === userProfile?.uid && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />}
                    </CardTitle>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{group.participants.length - 1} participantes</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Código del grupo:</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="font-mono text-xs sm:text-sm">
                        {group.joinCode}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => copyJoinCode(group.joinCode)} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground">
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
                      className="w-full bg-transparent h-8 sm:h-9"
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-xs sm:text-sm">Abandonar Grupo</span>
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
