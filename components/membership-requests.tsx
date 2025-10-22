"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups, getPendingMemberships, approveMembership, rejectMembership } from "@/lib/groups"
import type { Group, GroupMembership } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Clock, UserCheck, UserX, Users, Calendar, ArrowLeft } from "lucide-react"

interface MembershipRequestsProps {
  onBack: () => void;
}

export function MembershipRequests({ onBack }: MembershipRequestsProps) {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [adminGroups, setAdminGroups] = useState<Group[]>([])
  const [allPendingMemberships, setAllPendingMemberships] = useState<{group: Group, memberships: GroupMembership[]}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      const groups = await getUserGroups(userProfile.uid)
      const adminGroups = groups.filter((group) => group.adminId === userProfile.uid)
      setAdminGroups(adminGroups)

      // Cargar solicitudes pendientes de todos los grupos
      const allMemberships = []
      for (const group of adminGroups) {
        try {
          const memberships = await getPendingMemberships(group.id, userProfile.uid)
          if (memberships.length > 0) {
            allMemberships.push({ group, memberships })
          }
        } catch (error) {
          console.error(`Error loading memberships for group ${group.name}:`, error)
        }
      }
      setAllPendingMemberships(allMemberships)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las solicitudes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveMembership = async (groupId: string, userId: string, userName: string) => {
    if (!userProfile) return
    try {
      await approveMembership(groupId, userId, userProfile.uid)
      toast({ 
        title: "✅ Usuario aprobado", 
        description: `${userName} fue agregado al grupo exitosamente.`,
        className: "bg-green-50 border-green-200 text-green-800"
      })
      loadData() // Recargar datos
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo aprobar la solicitud", variant: "destructive" })
    }
  }

  const handleRejectMembership = async (groupId: string, userId: string, userName: string) => {
    if (!userProfile) return
    try {
      await rejectMembership(groupId, userId, userProfile.uid)
      toast({ 
        title: "❌ Usuario rechazado", 
        description: `La solicitud de ${userName} fue rechazada.`,
        className: "bg-red-50 border-red-200 text-red-800"
      })
      loadData() // Recargar datos
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo rechazar la solicitud", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Cargando solicitudes...</h3>
          <p className="text-slate-500 text-sm">Revisando tus grupos</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay grupos administrados
  if (adminGroups.length === 0) {
    return (
      <div className="space-y-4 px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="h-10 w-10 p-0 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Aceptar Solicitudes</h1>
            <p className="text-xs text-slate-500">Gestiona tus grupos</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50">
          <CardContent className="text-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">¡Crea tu primer grupo!</h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
              Para gestionar solicitudes, primero necesitas crear un grupo de pronósticos
            </p>
            <Button 
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar mensaje si no hay solicitudes pendientes
  if (allPendingMemberships.length === 0) {
    return (
      <div className="space-y-4 px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="h-10 w-10 p-0 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Aceptar Solicitudes</h1>
            <p className="text-xs text-slate-500">Gestiona tus grupos</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-green-50">
          <CardContent className="text-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">¡No hay solicitudes pendientes!</h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
              Todas las solicitudes de membresía han sido procesadas.
            </p>
            <Button 
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="h-10 w-10 p-0 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">Aceptar Solicitudes</h1>
          <p className="text-xs text-slate-500">
            {allPendingMemberships.reduce((acc, item) => acc + item.memberships.length, 0)} solicitudes pendientes
          </p>
        </div>
      </div>

      {/* Lista de solicitudes por grupo */}
      <div className="space-y-4">
        {allPendingMemberships.map(({ group, memberships }) => (
          <Card key={group.id} className="border-l-4 border-l-cyan-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-cyan-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-600" />
                  </div>
                  <span className="text-base font-bold">{group.name}</span>
                </div>
                <div className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                  {memberships.length} pendiente{memberships.length !== 1 ? 's' : ''}
                </div>
              </CardTitle>
              <CardDescription className="text-cyan-600 text-sm">
                {group.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {memberships.map((membership: GroupMembership) => (
                <div key={membership.uid} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{membership.userName}</div>
                        <div className="text-xs text-slate-600 truncate">{membership.userEmail}</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold whitespace-nowrap">
                      Pendiente
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>Solicitó unirse el {(() => {
                      // Convertir Timestamp de Firestore a Date
                      const date = membership.requestedAt?.toDate ? membership.requestedAt.toDate() : new Date(membership.requestedAt)
                      if (isNaN(date.getTime())) {
                        return "fecha no disponible"
                      }
                      return date.toLocaleDateString('es-ES') + " a las " + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    })()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleApproveMembership(group.id, membership.uid, membership.userName)}
                      className="flex-1 h-9 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleRejectMembership(group.id, membership.uid, membership.userName)}
                      className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-sm"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
