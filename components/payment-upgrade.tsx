"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { submitPaymentRequest } from "@/lib/payments"
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
import { useToast } from "@/hooks/use-toast"
import { Crown, CreditCard, Building, CheckCircle, AlertCircle } from "lucide-react"

const BANKS = [
  "Banco Nación",
  "Banco Provincia",
  "Banco Ciudad",
  "BBVA",
  "Santander",
  "Macro",
  "Galicia",
  "ICBC",
  "Supervielle",
  "Patagonia",
  "Otro",
]

export function PaymentUpgrade() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form states
  const [bankName, setBankName] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [transferDate, setTransferDate] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !bankName || !accountHolder || !transferDate || !referenceNumber) return

    setSubmitting(true)
    try {
      await submitPaymentRequest(userProfile.uid, userProfile.email, userProfile.displayName || "Usuario", {
        bankName,
        accountHolder,
        transferDate,
        referenceNumber,
      })

      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de upgrade está siendo procesada. Te contactaremos pronto.",
      })

      setSubmitted(true)
      setDialogOpen(false)

      // Reset form
      setBankName("")
      setAccountHolder("")
      setTransferDate("")
      setReferenceNumber("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (userProfile?.role === "admin") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">¡Eres Administrador!</h3>
          <p className="text-green-700">Ya tienes acceso completo a todas las funciones de administración.</p>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Solicitud en Proceso</h3>
          <p className="text-blue-700 mb-4">
            Tu solicitud de upgrade está siendo revisada. Te contactaremos dentro de 24-48 horas.
          </p>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            Estado: Pendiente de Aprobación
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Crown className="w-5 h-5" />
          Conviértete en Administrador
        </CardTitle>
        <CardDescription>Accede a funciones avanzadas y crea tus propios grupos de pronósticos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Benefits */}
          <div>
            <h4 className="font-medium mb-3">Beneficios incluidos:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Crear grupos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Configurar equipos y partidos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Gestionar participantes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Cargar resultados oficiales
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Panel de administración completo
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-background rounded-lg border">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">$10.000</div>
              <div className="text-sm text-muted-foreground">Pago único - Acceso de por vida</div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Información de Transferencia
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Banco:</strong> Banco Nación
              </p>
              <p>
                <strong>Titular:</strong> Prode Libre SRL
              </p>
              <p>
                <strong>CBU:</strong> 0110599520000012345678
              </p>
              <p>
                <strong>Alias:</strong> PRODE.LIBRE.PAY
              </p>
              <p>
                <strong>CUIT:</strong> 30-12345678-9
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Realizar Transferencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmar Transferencia</DialogTitle>
                <DialogDescription>Completa los datos de tu transferencia para procesar el upgrade</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banco desde donde transferiste</Label>
                  <Select value={bankName} onValueChange={setBankName} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Titular de la cuenta</Label>
                  <Input
                    id="accountHolder"
                    placeholder="Nombre completo del titular"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferDate">Fecha de transferencia</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Número de referencia/comprobante</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Ej: 123456789"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>
                    Verificaremos tu transferencia en 24-48 horas. Una vez aprobada, tu cuenta será actualizada
                    automáticamente.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Procesando..." : "Confirmar Transferencia"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <p className="text-xs text-muted-foreground text-center">
            Al realizar el pago, aceptas nuestros términos y condiciones. El upgrade es permanente y no reembolsable.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
