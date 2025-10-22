"use client"

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

interface SafeAreaWrapperProps {
  children: React.ReactNode
  className?: string
  includeBottom?: boolean
}

export function SafeAreaWrapper({ children, className = "", includeBottom = false }: SafeAreaWrapperProps) {
  const [isNative, setIsNative] = useState(false)
  const [safeAreaTop, setSafeAreaTop] = useState(0)
  const [safeAreaBottom, setSafeAreaBottom] = useState(0)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsNative(true)
      
      // Obtener el valor de safe-area-inset-top y bottom desde CSS
      const testElement = document.createElement('div')
      testElement.style.paddingTop = 'env(safe-area-inset-top)'
      testElement.style.paddingBottom = 'env(safe-area-inset-bottom)'
      testElement.style.position = 'absolute'
      testElement.style.visibility = 'hidden'
      document.body.appendChild(testElement)
      
      const computedStyle = window.getComputedStyle(testElement)
      const paddingTop = computedStyle.paddingTop
      const paddingBottom = computedStyle.paddingBottom
      
      if (paddingTop && paddingTop !== '0px') {
        setSafeAreaTop(parseInt(paddingTop))
      } else {
        // Fallback para Android
        setSafeAreaTop(24)
      }
      
      if (includeBottom) {
        if (paddingBottom && paddingBottom !== '0px') {
          setSafeAreaBottom(parseInt(paddingBottom))
        } else {
          // Fallback para Android - espacio para navegación
          setSafeAreaBottom(16)
        }
      }
      
      document.body.removeChild(testElement)
    }
  }, [])

  if (!isNative) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={className}
      style={{
        paddingTop: `${safeAreaTop}px`,
        paddingBottom: includeBottom ? `${safeAreaBottom}px` : '0px'
      }}
    >
      {children}
    </div>
  )
}
