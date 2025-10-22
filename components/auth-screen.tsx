"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Lock, User, Trophy, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RoleSelection } from "@/components/role-selection"

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [selectedRole, setSelectedRole] = useState<"admin" | "participant" | null>(null)
  const [showRoleSelection, setShowRoleSelection] = useState(true)
  const { signIn, signUp, userProfile } = useAuth()
  const { toast } = useToast()

  // Si el usuario ya tiene un rol asignado (viene de logout), ir directo al login
  const [isFromLogout, setIsFromLogout] = useState(false)

  // Detectar si el usuario viene de logout
  useEffect(() => {
    // Verificar si viene de logout desde cualquier lugar
    const fromLogout = localStorage.getItem('fromLogout')
    if (fromLogout) {
      setIsFromLogout(true)
      setShowRoleSelection(false)
      // Limpiar el localStorage después de detectarlo
      localStorage.removeItem('fromLogout')
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Email o contraseña incorrectos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signUp(email, password, displayName, selectedRole!)
      toast({
        title: "¡Registro exitoso!",
        description: `Tu cuenta ha sido creada como ${selectedRole === "admin" ? "Creador de Prodes" : "Participante"}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelected = (role: "admin" | "participant") => {
    setSelectedRole(role)
    setShowRoleSelection(false)
  }

  const handleBackToRoleSelection = () => {
    setShowRoleSelection(true)
    setSelectedRole(null)
    setEmail("")
    setPassword("")
    setDisplayName("")
  }

  return (
    <>
      {showRoleSelection ? (
        <RoleSelection onRoleSelected={handleRoleSelected} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Back button - solo mostrar si NO viene de logout */}
            {!isFromLogout && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToRoleSelection}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a selección de rol
                </Button>
              </div>
            )}

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4">
                <img src="/logo.png" alt="Prode Libre" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Prode Libre</h1>
              {isFromLogout ? (
                <p className="text-slate-600">Inicia sesión para continuar</p>
              ) : (
                <p className="text-slate-600">
                  Registro como {selectedRole === "admin" ? "Creador de Prodes" : "Participante"}
                </p>
              )}
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md">
              <CardContent className="p-6">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className={`grid w-full ${isFromLogout ? 'grid-cols-1' : 'grid-cols-2'} bg-slate-100`}>
                    <TabsTrigger 
                      value="signin" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Iniciar Sesión
                    </TabsTrigger>
                    {!isFromLogout && (
                      <TabsTrigger 
                        value="signup"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Registrarse
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-slate-700 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-slate-700 font-medium">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-md font-medium" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión...
                          </>
                        ) : (
                          "Iniciar Sesión"
                        )}
                      </Button>
                      
                      {/* Link de registro cuando viene de logout */}
                      {isFromLogout && (
                        <div className="text-center pt-4">
                          <p className="text-sm text-slate-600 mb-2">¿No tienes cuenta?</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsFromLogout(false)
                              setShowRoleSelection(true)
                            }}
                            className="w-full h-10 text-slate-600 border-slate-200 hover:bg-slate-50"
                          >
                            Crear nueva cuenta
                          </Button>
                        </div>
                      )}
                    </form>
                  </TabsContent>

                  {!isFromLogout && (
                    <TabsContent value="signup" className="mt-6">
                      <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-slate-700 font-medium">Nombre</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="Tu nombre"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-slate-700 font-medium">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="tu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-slate-700 font-medium">Contraseña</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-md font-medium" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creando cuenta...
                            </>
                          ) : (
                            "Crear Cuenta"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm">
                Al registrarte, aceptas nuestros términos de servicio
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}