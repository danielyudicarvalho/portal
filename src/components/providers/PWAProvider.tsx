'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface PWAState {
  isInstalled: boolean
  isInstallable: boolean
  installPromptEvent: BeforeInstallPromptEvent | null
  isOnline: boolean
  serviceWorkerStatus: {
    isRegistered: boolean
    isControlling: boolean
    isWaiting: boolean
  }
  offlineGamesCount: number
  installationDate: string | null
  lastOfflineSync: string | null
  userPreferences: {
    autoInstallPrompt: boolean
    offlineNotifications: boolean
  }
}

interface PWAContextType extends PWAState {
  promptInstall: () => Promise<void>
  updateOfflineGamesCount: () => Promise<void>
  updateUserPreferences: (preferences: Partial<PWAState['userPreferences']>) => void
  clearPWAData: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PWA_STORAGE_KEY = 'pwa-state'

// Helper functions for localStorage persistence
const loadPWAStateFromStorage = (): Partial<PWAState> => {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(PWA_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only persist certain fields, not runtime state like installPromptEvent
      return {
        installationDate: parsed.installationDate,
        lastOfflineSync: parsed.lastOfflineSync,
        userPreferences: parsed.userPreferences || {
          autoInstallPrompt: true,
          offlineNotifications: true,
        },
      }
    }
  } catch (error) {
    console.error('Failed to load PWA state from localStorage:', error)
  }
  
  return {
    userPreferences: {
      autoInstallPrompt: true,
      offlineNotifications: true,
    },
  }
}

const savePWAStateToStorage = (state: PWAState) => {
  if (typeof window === 'undefined') return
  
  try {
    const persistentState = {
      installationDate: state.installationDate,
      lastOfflineSync: state.lastOfflineSync,
      userPreferences: state.userPreferences,
    }
    localStorage.setItem(PWA_STORAGE_KEY, JSON.stringify(persistentState))
  } catch (error) {
    console.error('Failed to save PWA state to localStorage:', error)
  }
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [pwaState, setPwaState] = useState<PWAState>(() => {
    const storedState = loadPWAStateFromStorage()
    return {
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
      isOnline: true,
      serviceWorkerStatus: {
        isRegistered: false,
        isControlling: false,
        isWaiting: false,
      },
      offlineGamesCount: 0,
      installationDate: null,
      lastOfflineSync: null,
      userPreferences: {
        autoInstallPrompt: true,
        offlineNotifications: true,
      },
      ...storedState,
    }
  })

  // Persist state changes to localStorage
  useEffect(() => {
    savePWAStateToStorage(pwaState)
  }, [pwaState])

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isInstalled = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone === true
      
      setPwaState(prev => {
        const newState = { ...prev, isInstalled }
        // Set installation date if newly installed
        if (isInstalled && !prev.isInstalled && !prev.installationDate) {
          newState.installationDate = new Date().toISOString()
        }
        return newState
      })
    }

    // Check service worker status
    const checkServiceWorkerStatus = async () => {
      try {
        const { getServiceWorkerStatus } = await import('@/lib/pwa')
        const status = await getServiceWorkerStatus()
        setPwaState(prev => ({ ...prev, serviceWorkerStatus: status }))
      } catch (error) {
        console.error('Failed to check service worker status:', error)
      }
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setPwaState(prev => ({
        ...prev,
        isInstallable: prev.userPreferences.autoInstallPrompt,
        installPromptEvent: installEvent,
      }))
    }

    // Handle online/offline status
    const handleOnline = () => {
      setPwaState(prev => ({ 
        ...prev, 
        isOnline: true,
        lastOfflineSync: new Date().toISOString()
      }))
    }
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }))

    // Set up event listeners
    checkInstalled()
    checkServiceWorkerStatus()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    setPwaState(prev => ({ ...prev, isOnline: navigator.onLine }))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const promptInstall = async () => {
    if (!pwaState.installPromptEvent) {
      throw new Error('No install prompt available')
    }

    try {
      await pwaState.installPromptEvent.prompt()
      const choiceResult = await pwaState.installPromptEvent.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setPwaState(prev => ({
          ...prev,
          isInstallable: false,
          installPromptEvent: null,
        }))
        
        // Wait a bit and check if app is now installed
        setTimeout(() => {
          const isInstalled = 
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as NavigatorWithStandalone).standalone === true
          
          setPwaState(prev => ({ 
            ...prev, 
            isInstalled,
            installationDate: isInstalled && !prev.installationDate ? new Date().toISOString() : prev.installationDate
          }))
        }, 1000)
      } else {
        throw new Error('Installation was cancelled by user')
      }
    } catch (error) {
      console.error('Error prompting PWA install:', error)
      throw error
    }
  }

  const updateOfflineGamesCount = async () => {
    try {
      const { getGameCacheManager } = await import('@/lib/game-cache-manager')
      const offlineGames = await getGameCacheManager().getOfflineGames()
      setPwaState(prev => ({ ...prev, offlineGamesCount: offlineGames.length }))
    } catch (error) {
      console.error('Failed to update offline games count:', error)
    }
  }

  // Update offline games count on mount and when online status changes
  useEffect(() => {
    updateOfflineGamesCount()
  }, [pwaState.isOnline])

  const updateUserPreferences = useCallback((preferences: Partial<PWAState['userPreferences']>) => {
    setPwaState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...preferences,
      },
    }))
  }, [])

  const clearPWAData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PWA_STORAGE_KEY)
    }
    setPwaState(prev => ({
      ...prev,
      installationDate: null,
      lastOfflineSync: null,
      userPreferences: {
        autoInstallPrompt: true,
        offlineNotifications: true,
      },
    }))
  }, [])

  const contextValue: PWAContextType = {
    ...pwaState,
    promptInstall,
    updateOfflineGamesCount,
    updateUserPreferences,
    clearPWAData,
  }

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}