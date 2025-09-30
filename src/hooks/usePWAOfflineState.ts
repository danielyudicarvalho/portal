'use client'

import { usePWA } from '@/components/providers/PWAProvider'
import { useCallback, useEffect, useState } from 'react'

/**
 * Hook for managing PWA offline state and functionality
 */
export function usePWAOfflineState() {
  const {
    isOnline,
    offlineGamesCount,
    lastOfflineSync,
    userPreferences,
    serviceWorkerStatus,
    updateOfflineGamesCount,
    updateUserPreferences,
  } = usePWA()

  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  // Monitor connection type and speed
  useEffect(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      
      if (connection) {
        const updateConnectionInfo = () => {
          setConnectionType(connection.effectiveType || 'unknown')
          setIsSlowConnection(
            connection.effectiveType === 'slow-2g' || 
            connection.effectiveType === '2g'
          )
        }

        updateConnectionInfo()
        connection.addEventListener('change', updateConnectionInfo)

        return () => {
          connection.removeEventListener('change', updateConnectionInfo)
        }
      }
    }
  }, [])

  const toggleOfflineNotifications = useCallback((enabled: boolean) => {
    updateUserPreferences({ offlineNotifications: enabled })
  }, [updateUserPreferences])

  const getOfflineStatus = useCallback(() => {
    const hasOfflineGames = offlineGamesCount > 0
    const hasServiceWorker = serviceWorkerStatus.isRegistered
    const lastSync = lastOfflineSync ? new Date(lastOfflineSync) : null
    
    let offlineCapability: 'full' | 'partial' | 'none' = 'none'
    
    if (hasServiceWorker && hasOfflineGames) {
      offlineCapability = 'full'
    } else if (hasServiceWorker) {
      offlineCapability = 'partial'
    }

    return {
      isOnline,
      hasOfflineGames,
      hasServiceWorker,
      offlineCapability,
      lastSync,
      timeSinceLastSync: lastSync ? Date.now() - lastSync.getTime() : null,
      connectionType,
      isSlowConnection,
    }
  }, [
    isOnline,
    offlineGamesCount,
    serviceWorkerStatus.isRegistered,
    lastOfflineSync,
    connectionType,
    isSlowConnection,
  ])

  const refreshOfflineData = useCallback(async () => {
    try {
      await updateOfflineGamesCount()
      return true
    } catch (error) {
      console.error('Failed to refresh offline data:', error)
      return false
    }
  }, [updateOfflineGamesCount])

  const getNetworkAdvice = useCallback(() => {
    const status = getOfflineStatus()
    
    if (!status.isOnline) {
      return {
        type: 'offline' as const,
        message: status.hasOfflineGames 
          ? `You're offline, but ${offlineGamesCount} games are available to play`
          : "You're offline and no games are cached for offline play",
        action: status.hasOfflineGames ? 'browse-offline-games' : 'wait-for-connection',
      }
    }

    if (status.isSlowConnection) {
      return {
        type: 'slow' as const,
        message: 'Slow connection detected. Consider caching games for offline play',
        action: 'cache-games',
      }
    }

    return {
      type: 'good' as const,
      message: 'Good connection - all features available',
      action: null,
    }
  }, [getOfflineStatus, offlineGamesCount])

  return {
    // State
    offlineStatus: getOfflineStatus(),
    offlineGamesCount,
    offlineNotifications: userPreferences.offlineNotifications,
    networkAdvice: getNetworkAdvice(),

    // Actions
    refreshOfflineData,
    toggleOfflineNotifications,
  }
}

export default usePWAOfflineState