"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar si ya está instalado como PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Para iOS, mostrar el prompt después de un delay
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000) // Mostrar después de 3 segundos
      
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA instalada exitosamente')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleIOSInstall = () => {
    setShowInstallPrompt(false)
    // El usuario ya vio las instrucciones
  }

  // No mostrar si ya está instalado o si no debe mostrarse
  if (isStandalone || !showInstallPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl border-0 sm:left-auto sm:right-4 sm:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1">¡Instala Prode Libre!</h3>
            <p className="text-xs text-white/90 mb-3">
              {isIOS 
                ? "Toca el botón Compartir y selecciona 'Agregar a pantalla de inicio'"
                : "Instala la app para una mejor experiencia"
              }
            </p>
            
            {isIOS ? (
              <div className="space-y-2">
                <div className="text-xs bg-white/20 rounded px-2 py-1">
                  1. Toca el botón Compartir 📤
                </div>
                <div className="text-xs bg-white/20 rounded px-2 py-1">
                  2. Selecciona "Agregar a pantalla de inicio"
                </div>
                <div className="text-xs bg-white/20 rounded px-2 py-1">
                  3. ¡Listo! La app aparecerá en tu pantalla
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleInstallClick}
                className="w-full h-8 bg-white text-blue-600 hover:bg-white/90 text-xs font-semibold"
              >
                <Download className="w-3 h-3 mr-1" />
                Instalar App
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstallPrompt(false)}
            className="text-white hover:bg-white/20 h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
