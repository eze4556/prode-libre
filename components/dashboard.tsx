"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GroupManagement } from "@/components/group-management"
import { PredictionSystem } from "@/components/prediction-system"
import { AdminPanel } from "@/components/admin-panel"
import { PaymentUpgrade } from "@/components/payment-upgrade"
import { PredictionsView } from "@/components/predictions-view"
import { ParticipantManagement } from "@/components/participant-management"
import { TeamSearchDemo } from "@/components/team-search-demo"
import { 
  LogOut, 
  Users, 
  Trophy, 
  Target, 
  Settings, 
  Crown, 
  Home, 
  Shield,
  Menu,
  X,
  Eye
} from "lucide-react"

export function Dashboard() {
  const { userProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("home")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const getRoleIcon = () => {
    switch (userProfile?.role) {
      case "superadmin":
        return <Shield className="w-4 h-4" />
      case "admin":
        return <Crown className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getRoleLabel = () => {
    switch (userProfile?.role) {
      case "superadmin":
        return "Super Admin"
      case "admin":
        return "Administrador"
      default:
        return "Participante"
    }
  }

  const getRoleColor = () => {
    switch (userProfile?.role) {
      case "superadmin":
        return "bg-gradient-to-r from-purple-500 to-purple-700 text-white"
      case "admin":
        return "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
      default:
        return "bg-gradient-to-r from-green-500 to-green-700 text-white"
    }
  }

  const navigationItems = [
    { id: "home", label: "Inicio", icon: Home },
    ...(userProfile?.role === "participant" 
      ? [
          { id: "predictions", label: "Pronósticos", icon: Target },
          { id: "view-predictions", label: "Ver Pronósticos", icon: Eye },
          { id: "groups", label: "Grupos", icon: Users },
          { id: "upgrade", label: "Upgrade", icon: Crown }
        ] 
      : []),
    ...(userProfile?.role === "admin" 
      ? [
          { id: "admin", label: "Admin", icon: Settings },
          { id: "participants", label: "Participantes", icon: Users }
        ] 
      : []),
    ...(userProfile?.role === "superadmin" 
      ? [
          { id: "superadmin", label: "Super Admin", icon: Shield }
        ] 
      : [])
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg">
        <div className="px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between">
            {/* Logo and User Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">Prode Libre</h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate">Hola, {userProfile?.displayName}</p>
              </div>
            </div>

            {/* User Role Badge and Menu */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge className={`${getRoleColor()} border-0 shadow-sm text-xs px-2 py-1 hidden xs:flex`}>
                {getRoleIcon()}
                <span className="ml-1 font-medium">{getRoleLabel()}</span>
              </Badge>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 h-8 w-8"
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
            <div className="px-3 py-2 space-y-1 max-h-96 overflow-y-auto">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start h-12 text-sm font-medium ${
                    activeTab === item.id 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMenuOpen(false)
                  }}
                >
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              ))}
              
              <div className="border-t border-slate-200 pt-2 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <div className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`${
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 ml-auto"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {userProfile?.role === "superadmin" ? (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Super Administración</h2>
                  <p className="text-slate-600">Gestiona el sistema completo de Prode Libre</p>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="text-center pb-3">
                      <CardTitle className="flex items-center justify-center gap-2 text-purple-800 text-sm sm:text-base">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        Gestionar Pagos
                      </CardTitle>
                      <CardDescription className="text-purple-700 text-xs sm:text-sm">
                        Aprobar y rechazar solicitudes de upgrade
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => setActiveTab("superadmin")}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Acceder al Panel
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="text-center pb-3">
                      <CardTitle className="flex items-center justify-center gap-2 text-blue-800 text-sm sm:text-base">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                        Ver Grupos
                      </CardTitle>
                      <CardDescription className="text-blue-700 text-xs sm:text-sm">
                        Explorar todos los grupos del sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => setActiveTab("groups")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Ver Grupos
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardHeader className="text-center pb-3">
                      <CardTitle className="flex items-center justify-center gap-2 text-gray-600 text-sm sm:text-base">
                        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                        Panel Admin
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-xs sm:text-sm">
                        Solo para administradores de grupos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-gray-300 text-gray-500 cursor-not-allowed text-xs sm:text-sm h-9 sm:h-10"
                        disabled
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        No Disponible
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : userProfile?.role === "admin" ? (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Panel de Administración</h2>
                  <p className="text-slate-600">Gestiona tus grupos y partidos</p>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="text-center pb-3">
                      <CardTitle className="flex items-center justify-center gap-2 text-blue-800 text-sm sm:text-base">
                        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                        Administrar Grupos
                      </CardTitle>
                      <CardDescription className="text-blue-700 text-xs sm:text-sm">
                        Crear grupos, partidos y cargar resultados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => setActiveTab("admin")}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Acceder al Panel
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="text-center pb-3">
                      <CardTitle className="flex items-center justify-center gap-2 text-purple-800 text-sm sm:text-base">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                        Participantes
                      </CardTitle>
                      <CardDescription className="text-purple-700 text-xs sm:text-sm">
                        Ver puntuaciones y perfiles de participantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => setActiveTab("participants")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Ver Participantes
                      </Button>
                    </CardContent>
                  </Card>

             <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
               <CardHeader className="text-center pb-3">
                 <CardTitle className="flex items-center justify-center gap-2 text-green-800 text-sm sm:text-base">
                   <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                   Mis Grupos
                 </CardTitle>
                 <CardDescription className="text-green-700 text-xs sm:text-sm">
                   Ver y gestionar tus grupos creados
                 </CardDescription>
               </CardHeader>
               <CardContent className="text-center pt-0">
                 <Button
                   size="sm"
                   variant="outline"
                   className="w-full border-green-300 text-green-700 hover:bg-green-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10"
                   onClick={() => setActiveTab("groups")}
                 >
                   <Trophy className="w-4 h-4 mr-2" />
                   Ver Grupos
                 </Button>
               </CardContent>
             </Card>

             <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
               <CardHeader className="text-center pb-3">
                 <CardTitle className="flex items-center justify-center gap-2 text-orange-800 text-sm sm:text-base">
                   <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                   Demo Equipos
                 </CardTitle>
                 <CardDescription className="text-orange-700 text-xs sm:text-sm">
                   Probar búsqueda de equipos con Football API
                 </CardDescription>
               </CardHeader>
               <CardContent className="text-center pt-0">
                 <Button
                   size="sm"
                   variant="outline"
                   className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10"
                   onClick={() => setActiveTab("team-demo")}
                 >
                   <Target className="w-4 h-4 mr-2" />
                   Probar Demo
                 </Button>
               </CardContent>
             </Card>
                </div>
              </div>
            ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Mis Grupos */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm sm:text-base">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Mis Grupos
                  </CardTitle>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm">Grupos en los que participas</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center py-4 sm:py-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                      </div>
                      <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Gestiona tus grupos</p>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => setActiveTab("groups")}
                      >
                      Ver Grupos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mis Pronósticos */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm sm:text-base">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    Mis Pronósticos
                  </CardTitle>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm">Realiza tus predicciones</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center py-4 sm:py-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                      <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Haz tus pronósticos</p>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-md text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => setActiveTab("predictions")}
                      >
                        Ver Pronósticos
                    </Button>
                  </div>
                </CardContent>
              </Card>

                {/* Upgrade (solo para participantes) */}
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm sm:text-base">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      Upgrade a Admin
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-xs sm:text-sm">Conviértete en administrador</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center py-4 sm:py-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                      </div>
                      <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Crea tus propios grupos</p>
                      <Button
                        size="sm" 
                        className="bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 shadow-md text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => setActiveTab("upgrade")}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}
            </div>
        )}

        {/* Other Tabs */}
        {activeTab === "predictions" && <PredictionSystem />}
        {activeTab === "view-predictions" && <PredictionsView />}
        {activeTab === "groups" && <GroupManagement />}
               {activeTab === "admin" && <AdminPanel onNavigateToGroups={() => setActiveTab("groups")} />}
        {activeTab === "participants" && <ParticipantManagement />}
        {activeTab === "team-demo" && <TeamSearchDemo />}
        {activeTab === "superadmin" && <SuperAdminPanel />}
        {activeTab === "upgrade" && <PaymentUpgrade />}
      </main>
    </div>
  )
}