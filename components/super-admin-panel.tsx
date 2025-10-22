"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { 
  getPendingPaymentRequests, 
  getAllPaymentRequests, 
  approvePaymentRequest, 
  rejectPaymentRequest,
  deletePaymentRequest,
  type PaymentRequest 
} from "@/lib/payments"
import { 
  getSystemStats, 
  getConcurrentMatches,
  type SystemStats 
} from "@/lib/system-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Users, 
  DollarSign,
  Calendar,
  Building,
  FileText,
  Trash2,
  Target,
  Crown,
  User,
  Trophy,
  Activity
} from "lucide-react"

export function SuperAdminPanel() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [concurrentMatches, setConcurrentMatches] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadPaymentRequests(),
        loadSystemStats(),
        loadConcurrentMatches()
      ])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del sistema",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentRequests = async () => {
    try {
      const requests = await getAllPaymentRequests()
      setPaymentRequests(requests)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de pago",
        variant: "destructive",
      })
    }
  }

  const loadSystemStats = async () => {
    try {
      const stats = await getSystemStats()
      setSystemStats(stats)
    } catch (error) {
      console.error("Error loading system stats:", error)
    }
  }

  const loadConcurrentMatches = async () => {
    try {
      const concurrent = await getConcurrentMatches()
      setConcurrentMatches(concurrent)
    } catch (error) {
      console.error("Error loading concurrent matches:", error)
    }
  }

  const handleApprove = async (paymentId: string) => {
    if (!userProfile) return

    setProcessing(paymentId)
    try {
      await approvePaymentRequest(paymentId, userProfile.uid)
      toast({
        title: "¡Solicitud aprobada!",
        description: "El usuario ha sido promovido a administrador",
      })
      loadPaymentRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!userProfile) return

    setProcessing(paymentId)
    try {
      await rejectPaymentRequest(paymentId, userProfile.uid)
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      })
      loadPaymentRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (paymentId: string, userName: string) => {
    const confirmMessage = `¿Estás seguro de eliminar la solicitud de pago de "${userName}"?\n\nEsta acción eliminará permanentemente la solicitud de la base de datos.\n\nEsta acción NO se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setProcessing(paymentId)
    try {
      await deletePaymentRequest(paymentId)
      toast({
        title: "Solicitud eliminada",
        description: `La solicitud de "${userName}" ha sido eliminada permanentemente`,
      })
      loadPaymentRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la solicitud",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "approved":
        return <Badge variant="default" className="text-green-600 bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const pendingRequests = paymentRequests.filter(req => req.status === "pending")
  const processedRequests = paymentRequests.filter(req => req.status !== "pending")

  if (userProfile?.role !== "superadmin") {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">Solo los super administradores pueden acceder a este panel</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando panel de super administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Partidos en simultáneo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{concurrentMatches}</div>
            <p className="text-xs text-muted-foreground">En simultáneo</p>
          </CardContent>
        </Card>

        {/* Total de usuarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{systemStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        {/* Administradores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{systemStats?.totalAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Con privilegios</p>
          </CardContent>
        </Card>

        {/* Pronósticos acertados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pronósticos Acertados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats?.correctPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">De {systemStats?.totalPredictions || 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentRequests.length}</div>
            <p className="text-xs text-muted-foreground">Solicitudes de upgrade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Esperando revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paymentRequests.filter(req => req.status === "approved").length}</div>
            <p className="text-xs text-muted-foreground">Upgrades completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paymentRequests.filter(req => req.status === "approved").length * 10000)}
            </div>
            <p className="text-xs text-muted-foreground">Total aprobado</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Requests Management */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pendientes ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="processed">Procesadas ({processedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
                <p className="text-muted-foreground">Todas las solicitudes han sido procesadas</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <PaymentRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request.id!)}
                onReject={() => handleReject(request.id!)}
                processing={processing === request.id}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay solicitudes procesadas</h3>
                <p className="text-muted-foreground">Las solicitudes procesadas aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            processedRequests.map((request) => (
              <PaymentRequestCard
                key={request.id}
                request={request}
                onApprove={() => {}}
                onReject={() => {}}
                onDelete={() => handleDelete(request.id!, request.userName)}
                processing={processing === request.id}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
                readOnly={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface PaymentRequestCardProps {
  request: PaymentRequest
  onApprove: () => void
  onReject: () => void
  onDelete?: () => void
  processing: boolean
  formatDate: (date: Date) => string
  formatCurrency: (amount: number) => string
  getStatusBadge: (status: string) => React.ReactNode
  readOnly?: boolean
}

function PaymentRequestCard({ 
  request, 
  onApprove, 
  onReject, 
  onDelete,
  processing, 
  formatDate, 
  formatCurrency, 
  getStatusBadge,
  readOnly = false 
}: PaymentRequestCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {request.userName}
            </CardTitle>
            <CardDescription className="mt-1">{request.userEmail}</CardDescription>
          </div>
          <div className="text-right">
            {getStatusBadge(request.status)}
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(request.amount)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Transfer Details */}
          {request.transferDetails && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Detalles de Transferencia
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banco:</span>
                  <span className="font-medium">{request.transferDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titular:</span>
                  <span className="font-medium">{request.transferDetails.accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{request.transferDetails.transferDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia:</span>
                  <span className="font-medium font-mono">{request.transferDetails.referenceNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Solicitado: {formatDate(request.createdAt)}</span>
            </div>
            {request.processedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>Procesado: {formatDate(request.processedAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!readOnly && request.status === "pending" && (
            <div className="flex gap-2">
              <Button 
                onClick={onApprove} 
                disabled={processing}
                className="flex-1"
                size="sm"
              >
                {processing ? "Procesando..." : "Aprobar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={onReject} 
                disabled={processing}
                size="sm"
              >
                Rechazar
              </Button>
            </div>
          )}

          {/* Delete button for processed requests */}
          {!readOnly && request.status !== "pending" && onDelete && (
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={onDelete} 
                disabled={processing}
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {processing ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


