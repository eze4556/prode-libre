"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Users, Target, Trophy, Settings, Shield } from "lucide-react"

interface RoleSelectionProps {
  onRoleSelected: (role: "admin" | "participant") => void
}

export function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "participant" | null>(null)
  const [showGoalAnimation, setShowGoalAnimation] = useState(false)

  const handleRoleSelect = (role: "admin" | "participant") => {
    setSelectedRole(role)
    setShowGoalAnimation(true)
    
    // Después de la animación, proceder con el registro
    setTimeout(() => {
      onRoleSelected(role)
    }, 2000) // Duración de la animación
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center p-4">
      {/* Campo de fútbol de fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-300 to-orange-600 opacity-20">
        {/* Líneas del campo */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white opacity-30"></div>
        <div className="absolute top-1/4 left-0 w-full h-0.5 bg-white opacity-20"></div>
        <div className="absolute top-3/4 left-0 w-full h-0.5 bg-white opacity-20"></div>
        
        {/* Círculo central */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white opacity-20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Porterías */}
        <div className="absolute top-1/2 left-4 w-8 h-16 border-2 border-white opacity-30 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-4 w-8 h-16 border-2 border-white opacity-30 transform -translate-y-1/2"></div>
      </div>

      {/* Animación de gol */}
      {showGoalAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="goal-animation-container">
            {/* Portería */}
            <div className="goal-post">
              <div className="goal-net"></div>
            </div>
            
            {/* Pelota */}
            <div className="soccer-ball"></div>
            
            {/* Efectos de celebración */}
            <div className="celebration-effects">
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="stars">⭐</div>
              <div className="stars">⭐</div>
              <div className="stars">⭐</div>
            </div>
            
            {/* Texto GOOOOL! */}
            <div className="goal-text">GOOOOL!</div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img src="/logo.png" alt="Prode Libre" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Prode Libre</h1>
          <p className="text-xl text-white/90">¿Cómo quieres participar?</p>
        </div>

        {/* Opciones de roles */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/95 backdrop-blur-sm border-2 hover:border-orange-400"
            onClick={() => handleRoleSelect("admin")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Ser Creador de Prodes</CardTitle>
              <CardDescription className="text-lg text-gray-600">(Administrador)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Crear y gestionar grupos de pronósticos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Crear partidos y gestionar participantes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Ingresar resultados y ver estadísticas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Administrar códigos de invitación</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-semibold py-3 text-lg"
                disabled={selectedRole !== null}
              >
                {selectedRole === "admin" ? "¡GOOOOL!" : "Ser Creador"}
              </Button>
            </CardContent>
          </Card>

          {/* Participant */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/95 backdrop-blur-sm border-2 hover:border-blue-400"
            onClick={() => handleRoleSelect("participant")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Ser Participante de Prodes</CardTitle>
              <CardDescription className="text-lg text-gray-600">(Jugador)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Hacer pronósticos de partidos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Unirse a grupos con códigos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Ver rankings y competir</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Acceso completo a pronósticos</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 text-lg"
                disabled={selectedRole !== null}
              >
                {selectedRole === "participant" ? "¡GOOOOL!" : "Ser Participante"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            Elige tu rol y comienza a disfrutar del mejor sistema de pronósticos deportivos
          </p>
        </div>
      </div>

      {/* Estilos CSS para la animación */}
      <style jsx>{`
        .goal-animation-container {
          position: relative;
          width: 400px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .goal-post {
          position: relative;
          width: 120px;
          height: 80px;
          border: 4px solid white;
          border-radius: 8px;
          background: linear-gradient(45deg, #1a1a1a, #333);
        }

        .goal-net {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.3) 2px,
            rgba(255,255,255,0.3) 4px
          );
          animation: netShake 0.5s ease-in-out;
        }

        .soccer-ball {
          position: absolute;
          width: 30px;
          height: 30px;
          background: white;
          border-radius: 50%;
          left: -50px;
          top: 50%;
          transform: translateY(-50%);
          animation: ballKick 1.5s ease-in-out forwards;
          box-shadow: 
            inset -5px -5px 0 rgba(0,0,0,0.1),
            inset 5px 5px 0 rgba(255,255,255,0.3);
        }

        .soccer-ball::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 2px;
          background: black;
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .soccer-ball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 2px;
          background: black;
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        .celebration-effects {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #ff6b6b;
          animation: confettiFall 2s ease-in-out infinite;
        }

        .confetti:nth-child(1) {
          left: 20%;
          animation-delay: 0s;
          background: #ff6b6b;
        }

        .confetti:nth-child(2) {
          left: 50%;
          animation-delay: 0.3s;
          background: #4ecdc4;
        }

        .confetti:nth-child(3) {
          left: 80%;
          animation-delay: 0.6s;
          background: #45b7d1;
        }

        .stars {
          position: absolute;
          font-size: 24px;
          animation: starTwinkle 1s ease-in-out infinite;
        }

        .stars:nth-child(4) {
          top: 20%;
          left: 30%;
          animation-delay: 0.2s;
        }

        .stars:nth-child(5) {
          top: 60%;
          left: 70%;
          animation-delay: 0.4s;
        }

        .stars:nth-child(6) {
          top: 40%;
          left: 10%;
          animation-delay: 0.6s;
        }

        .goal-text {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 48px;
          font-weight: bold;
          color: #ffd700;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          animation: goalTextBounce 1s ease-in-out;
        }

        @keyframes ballKick {
          0% {
            left: -50px;
            transform: translateY(-50%) scale(1);
          }
          50% {
            left: 50%;
            transform: translateY(-50%) scale(1.2);
          }
          100% {
            left: 100px;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes netShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes starTwinkle {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2) rotate(180deg);
            opacity: 0.7;
          }
        }

        @keyframes goalTextBounce {
          0% {
            transform: translateX(-50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
