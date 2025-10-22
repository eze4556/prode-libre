"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { User, LogOut, Trash2, Settings, Mail, Calendar, Shield } from "lucide-react"
import { deleteUser } from "firebase/auth"
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function AccountPanel() {
  const { user, userProfile, logout } = useAuth()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (!user || !userProfile) return

    setIsDeleting(true)
    try {
      // Eliminar datos del usuario de Firestore
      await deleteUserData(user.uid)
      
      // Eliminar la cuenta de Firebase Auth
      await deleteUser(user)
      
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada exitosamente",
      })
      
      // El logout se manejará automáticamente por Firebase Auth
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteUserData = async (userId: string) => {
    try {
      // Eliminar perfil del usuario
      await deleteDoc(doc(db, "users", userId))
      
      // Eliminar predicciones del usuario
      const predictionsQuery = query(
        collection(db, "matches"),
        where(`predictions.${userId}`, "!=", null)
      )
      const predictionsSnapshot = await getDocs(predictionsQuery)
      
      for (const matchDoc of predictionsSnapshot.docs) {
        const matchData = matchDoc.data()
        if (matchData.predictions && matchData.predictions[userId]) {
          delete matchData.predictions[userId]
          await matchDoc.ref.update({ predictions: matchData.predictions })
        }
      }
      
      // Eliminar grupos donde el usuario es admin
      const groupsQuery = query(
        collection(db, "groups"),
        where("adminId", "==", userId)
      )
      const groupsSnapshot = await getDocs(groupsQuery)
      
      for (const groupDoc of groupsSnapshot.docs) {
        await deleteDoc(groupDoc.ref)
      }
      
      // Eliminar solicitudes de pago del usuario
      const paymentsQuery = query(
        collection(db, "paymentRequests"),
        where("userId", "==", userId)
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)
      
      for (const paymentDoc of paymentsSnapshot.docs) {
        await deleteDoc(paymentDoc.ref)
      }
      
    } catch (error) {
      console.error("Error deleting user data:", error)
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      // Marcar que viene de logout para que AuthScreen muestre login directamente
      localStorage.setItem('fromLogout', 'true')
      
      await logout()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    }
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Mi Cuenta</h2>
          <p className="text-sm sm:text-base text-slate-600">Gestiona tu cuenta y configuración</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            Información del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                <p className="text-sm sm:text-base font-medium truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Miembro desde</p>
                <p className="text-sm sm:text-base font-medium">
                  {new Intl.DateTimeFormat("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }).format(userProfile.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Rol</p>
                <p className="text-sm sm:text-base font-medium capitalize">
                  {userProfile.role === "superadmin" ? "Super Administrador" : 
                   userProfile.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            Acciones de Cuenta
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gestiona tu sesión y cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLogout()
              }}
              className="flex items-center gap-2 w-full sm:w-auto touch-manipulation min-h-[44px] text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              Cerrar Sesión
            </Button>

            {/* Delete Account Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 w-full sm:w-auto touch-manipulation min-h-[44px] text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Eliminar Cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar cuenta?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm sm:text-base">
                    Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta, 
                    todos tus pronósticos, grupos administrados y datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
                  <AlertDialogCancel className="w-full sm:w-auto touch-manipulation min-h-[44px] text-xs sm:text-sm">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full sm:w-auto touch-manipulation min-h-[44px] text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar Cuenta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
