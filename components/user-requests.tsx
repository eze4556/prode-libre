"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserMembershipRequests } from "@/lib/groups"
import type { Group, GroupMembership } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  User,
  Mail,
  AlertCircle
} from "lucide-react"

export function UserRequests() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<{group: Group, membership: GroupMembership}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return

    try {
      const userRequests = await getUserMembershipRequests(userProfile.uid)
      setRequests(userRequests)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Aprobada</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Rechazada</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Mis Solicitudes</h2>
          <p className="text-sm sm:text-base text-slate-600">Estado de tus solicitudes de ingreso a grupos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.membership.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Esperando respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {requests.filter(r => r.membership.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Solicitudes aceptadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {requests.filter(r => r.membership.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">Solicitudes rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">No tienes solicitudes</h3>
            <p className="text-sm text-slate-500 mb-4">
              Cuando envíes una solicitud para unirte a un grupo, aparecerá aquí
            </p>
            <Button 
              onClick={() => window.location.href = '#groups'}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              <Users className="w-4 h-4 mr-2" />
              Buscar Grupos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests
            .sort((a, b) => b.membership.requestedAt.getTime() - a.membership.requestedAt.getTime())
            .map(({ group, membership }) => (
            <Card key={`${group.id}-${membership.uid}`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base mb-1">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{group.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {group.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {getStatusIcon(membership.status)}
                    {getStatusBadge(membership.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Información del grupo */}
                  <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">Administrador:</span>
                      <span className="font-medium text-slate-800">{group.adminName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">Participantes:</span>
                      <span className="font-medium text-slate-800">{group.participants.length - 1}</span>
                      {group.maxParticipants && (
                        <span className="text-slate-500">/ {group.maxParticipants}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">Solicitado:</span>
                      <span className="font-medium text-slate-800">{formatDate(membership.requestedAt)}</span>
                    </div>

                    {membership.status === 'approved' && membership.approvedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-600">Aprobado:</span>
                        <span className="font-medium text-green-700">{formatDate(membership.approvedAt)}</span>
                      </div>
                    )}

                    {membership.status === 'rejected' && membership.rejectedAt && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <span className="text-slate-600">Rechazado:</span>
                        <span className="font-medium text-red-700">{formatDate(membership.rejectedAt)}</span>
                      </div>
                    )}

                    {membership.rejectionReason && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-600 text-xs sm:text-sm">Motivo:</span>
                          <p className="text-red-700 text-xs sm:text-sm font-medium">{membership.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado específico */}
                  {membership.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-800 font-medium text-sm">Solicitud pendiente</span>
                      </div>
                      <p className="text-yellow-700 text-xs mt-1">
                        El administrador del grupo revisará tu solicitud pronto
                      </p>
                    </div>
                  )}

                  {membership.status === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-800 font-medium text-sm">¡Solicitud aprobada!</span>
                      </div>
                      <p className="text-green-700 text-xs mt-1">
                        Ya eres miembro del grupo. Puedes verlo en "Mis Grupos"
                      </p>
                    </div>
                  )}

                  {membership.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-800 font-medium text-sm">Solicitud rechazada</span>
                      </div>
                      <p className="text-red-700 text-xs mt-1">
                        Tu solicitud fue rechazada por el administrador del grupo
                      </p>
                    </div>
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

