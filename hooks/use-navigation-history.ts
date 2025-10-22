"use client"

import { useState, useEffect } from 'react'

export function useNavigationHistory() {
  const [history, setHistory] = useState<string[]>(['home'])
  const [currentIndex, setCurrentIndex] = useState(0)

  const navigateTo = (tab: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(tab)
      return newHistory
    })
    setCurrentIndex(prev => prev + 1)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      return history[currentIndex - 1]
    }
    return null
  }

  const canGoBack = currentIndex > 0

  return {
    currentTab: history[currentIndex],
    navigateTo,
    goBack,
    canGoBack,
    history
  }
}


