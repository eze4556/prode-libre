"use client"

import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

interface UseBackButtonOptions {
  onBack?: () => void
  preventDefault?: boolean
}

export function useBackButton(options: UseBackButtonOptions = {}) {
  const { onBack, preventDefault = false } = options
  const canGoBackRef = useRef(true)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Manejar el botón atrás del dispositivo
      const backButtonHandler = App.addListener('backButton', ({ canGoBack }) => {
        canGoBackRef.current = canGoBack

        if (preventDefault) {
          // Si se especifica preventDefault, ejecutar función personalizada
          if (onBack) {
            onBack()
          } else {
            // Por defecto, minimizar la app
            App.minimizeApp()
          }
        } else if (!canGoBack) {
          // Si no hay navegación interna, minimizar la app
          App.minimizeApp()
        } else {
          // Si hay navegación interna, usar el comportamiento normal
          window.history.back()
        }
      })

      // Cleanup
      return () => {
        backButtonHandler.remove()
      }
    }
  }, [onBack, preventDefault])

  return {
    canGoBack: canGoBackRef.current
  }
}
