"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useStatusBar } from "@/hooks/use-status-bar"
import { useBackButton } from "@/hooks/use-back-button"
import { useNavigationHistory } from "@/hooks/use-navigation-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GroupManagement } from "@/components/group-management"
import { PredictionSystem } from "@/components/prediction-system"
import { AdminPanel } from "@/components/admin-panel"
import { PaymentUpgrade } from "@/components/payment-upgrade"
import { PredictionsView } from "@/components/predictions-view"
import { ParticipantManagement } from "@/components/participant-management"
import { SuperAdminPanel } from "@/components/super-admin-panel"
import { TeamSearchDemo } from "@/components/team-search-demo"
import { AccountPanel } from "@/components/account-panel"
import { MembershipRequests } from "@/components/membership-requests"
import { UserRequests } from "@/components/user-requests"
import { RankingView } from "@/components/ranking-view"
import { SafeAreaWrapper } from "@/components/safe-area-wrapper"
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
  Eye,
  User,
  Clock,
  FileText,
  TrendingUp
} from "lucide-react"
import { AchievementsDisplay } from "@/components/achievements-display"
import { ALL_ACHIEVEMENTS } from "@/lib/achievements"
import { useToast } from "@/hooks/use-toast"

export function Dashboard() {
  const { userProfile, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Navegación con historial
  const { currentTab, navigateTo, goBack, canGoBack } = useNavigationHistory()
  
  // Configurar status bar para móvil
  useStatusBar()
  
  // Manejar botón atrás del dispositivo
  useBackButton({
    onBack: () => {
      const previousTab = goBack()
      if (previousTab) {
        // Si hay navegación interna, cambiar de tab
        return
      } else {
        // Si no hay navegación, minimizar la app
        return
      }
    },
    preventDefault: true
  })

  const handleLogout = async () => {
    // Marcar que viene de logout para que AuthScreen muestre login directamente
    localStorage.setItem('fromLogout', 'true')
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
          { id: "logros", label: "Mis Logros", icon: Trophy },
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
      : []),
    { id: "account", label: "Mi Cuenta", icon: User }
  ];

  // Ejemplo de obtención de stats y predictions del usuario
  const userStats = userProfile?.stats || { totalPoints: 0, exactScores: 0, totalPredictions: 0, longestStreak: 0, currentStreak: 0 };
  const predictions = userProfile?.predictions || [];
  // Mezclar los logros desbloqueados del usuario con la lista completa
  const unlockedIds = new Set((userProfile?.achievements || []).map(a => a.id));
  const achievements = ALL_ACHIEVEMENTS.map(a => {
    const unlocked = (userProfile?.achievements || []).find(u => u.id === a.id);
    return unlocked ? { ...a, unlockedAt: unlocked.unlockedAt } : { ...a, unlockedAt: undefined };
  });
  const totalUnlocked = achievements.filter(a => a.unlockedAt).length;

  const { toast } = useToast();
  const prevUnlockedRef = useRef<number>(0);

  useEffect(() => {
    if (!achievements) return;
    const unlocked = achievements.filter(a => a.unlockedAt);
    if (prevUnlockedRef.current && unlocked.length > prevUnlockedRef.current) {
      // Buscar el/los nuevos logros
      const nuevos = unlocked.slice(prevUnlockedRef.current);
      nuevos.forEach(logro => {
        toast({
          title: `¡Logro desbloqueado! ${logro.icon || "🏆"} ${logro.name}`,
          description: logro.description,
          variant: "default"
        });
      });
    }
    prevUnlockedRef.current = unlocked.length;
  }, [achievements, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <SafeAreaWrapper>
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg">
        <div className="px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between">
            {/* Logo and User Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10">
                <img src="/logo.png" alt="Prode Libre" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">Prode Libre</h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate">
                  Hola, {userProfile?.displayName || userProfile?.email}
                </p>
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {userProfile?.email}
                </p>
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
                  variant={currentTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start h-12 text-sm font-medium touch-manipulation ${
                    currentTab === item.id 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigateTo(item.id)
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
                  className="w-full justify-start h-12 text-sm font-medium text-red-600 hover:bg-red-50 touch-manipulation"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">Cerrar Sesión</span>
                </Button>
          </div>
        </div>
          </div>
        )}
      </header>
      </SafeAreaWrapper>

      {/* Desktop Navigation */}
      <div className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentTab === item.id ? "default" : "ghost"}
                className={`touch-manipulation ${
                  currentTab === item.id 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigateTo(item.id)
                }}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 ml-auto touch-manipulation"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLogout()
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <SafeAreaWrapper includeBottom={true}>
        <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
          {/* Home Tab */}
          {currentTab === "home" && (
            <div className="space-y-6">
              {userProfile?.role === "superadmin" ? (
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Super Administración</h2>
                    <p className="text-slate-600 mb-2">Gestiona el sistema completo de Prode Libre</p>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-purple-800 font-medium">👋 Hola, {userProfile?.displayName || userProfile?.email}</p>
                      <p className="text-purple-600 text-sm">{userProfile?.email}</p>
                    </div>
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
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("superadmin")
                          }}
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
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("groups")
                          }}
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
                    <p className="text-slate-600 mb-2">Gestiona tus grupos y partidos</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-blue-800 font-medium">👋 Hola, {userProfile?.displayName || userProfile?.email}</p>
                      <p className="text-blue-600 text-sm">{userProfile?.email}</p>
                    </div>
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
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("admin")
                          }}
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
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("participants")
                          }}
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
                   className="w-full border-green-300 text-green-700 hover:bg-green-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     navigateTo("groups")
                   }}
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
                   className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 shadow-sm text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     navigateTo("team-demo")
                   }}
                 >
                   <Target className="w-4 h-4 mr-2" />
                   Probar Demo
                 </Button>
               </CardContent>
             </Card>

             <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
               <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2 text-cyan-800 text-sm sm:text-base">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              Solicitudes
            </CardTitle>
            <CardDescription className="text-cyan-700 text-xs sm:text-sm">
              Aceptar solicitudes de grupo
            </CardDescription>
               </CardHeader>
               <CardContent className="text-center pt-0">
                 <Button
                   size="sm"
                   className="w-full bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 shadow-md text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     navigateTo("membership-requests")
                   }}
                 >
                   <Clock className="w-4 h-4 mr-2" />
                   Ver Solicitudes
                 </Button>
               </CardContent>
             </Card>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Saludo para participantes */}
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Bienvenido!</h2>
                      <p className="text-green-800 font-medium mb-1">👋 Hola, {userProfile?.displayName || userProfile?.email}</p>
                      <p className="text-green-600 text-sm">{userProfile?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
                            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigateTo("groups")
                            }}
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
                          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          Mis Pronósticos
                      </CardTitle>
                        <CardDescription className="text-slate-600 text-xs sm:text-sm">Realiza y revisa tus predicciones</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center py-4 sm:py-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                          </div>
                        <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Haz y revisa tus pronósticos</p>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("predictions")
                          }}
                        >
                          Mis Pronósticos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rankings */}
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-slate-800 text-sm sm:text-base">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          Rankings
                      </CardTitle>
                        <CardDescription className="text-slate-600 text-xs sm:text-sm">Clasificaciones de grupos</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center py-4 sm:py-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                          </div>
                        <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Ve tu posición en los grupos</p>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("ranking")
                          }}
                        >
                          Ver Rankings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mis Solicitudes */}
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-slate-800 text-sm sm:text-base">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          Mis Solicitudes
                      </CardTitle>
                        <CardDescription className="text-slate-600 text-xs sm:text-sm">Estado de tus solicitudes</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center py-4 sm:py-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                          </div>
                        <p className="text-slate-600 mb-3 sm:mb-4 text-xs sm:text-sm">Revisa el estado de tus solicitudes</p>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md text-xs sm:text-sm h-8 sm:h-9 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigateTo("user-requests")
                          }}
                        >
                          Ver Solicitudes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botón Mis Logros */}
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-yellow-200 bg-white flex flex-col items-center justify-center">
                    <CardHeader className="pb-3 text-center">
                      <CardTitle className="flex items-center gap-2 text-yellow-700 text-sm sm:text-base justify-center">
                        <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />
                        Mis Logros
                      </CardTitle>
                      <CardDescription className="text-yellow-600 text-xs sm:text-sm">Desbloquea logros mientras juegas</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-0">
                      <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-md" onClick={() => navigateTo("logros")}>Ver Mis Logros</Button>
                    </CardContent>
                  </Card>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Other Tabs */}
        {currentTab === "predictions" && <PredictionSystem />}
        {currentTab === "view-predictions" && <PredictionsView />}
        {currentTab === "groups" && <GroupManagement />}
               {currentTab === "admin" && <AdminPanel onNavigateToGroups={() => navigateTo("groups")} />}
        {currentTab === "participants" && <ParticipantManagement />}
        {currentTab === "team-demo" && <TeamSearchDemo />}
        {currentTab === "superadmin" && <SuperAdminPanel />}
        {currentTab === "account" && <AccountPanel />}
        {currentTab === "membership-requests" && <MembershipRequests onBack={goBack} />}
        {currentTab === "user-requests" && <UserRequests />}
        {currentTab === "ranking" && <RankingView onBack={goBack} />}
        {/* {currentTab === "upgrade" && <PaymentUpgrade />} */} {/* COMENTADO TEMPORALMENTE */}
        {currentTab === "logros" && (
          <div className="max-w-3xl mx-auto px-2 sm:px-0 animate-fade-in">
            <AchievementsDisplay achievements={achievements || []} totalUnlocked={totalUnlocked || 0} />
          </div>
        )}
      </main>
      </SafeAreaWrapper>
      
    </div>
  )
}