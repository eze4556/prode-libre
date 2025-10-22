"use client"

import { useEffect } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export function useStatusBar() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configurar la status bar para que sea opaca y visible
      StatusBar.setStyle({ style: Style.Dark })
      
      // Configurar el color de fondo de la status bar
      StatusBar.setBackgroundColor({ color: '#ffffff' })
      
      // Mostrar la status bar
      StatusBar.show()
      
      // Forzar que la status bar sea opaca
      StatusBar.setOverlaysWebView({ overlay: false })
    }
  }, [])
}
