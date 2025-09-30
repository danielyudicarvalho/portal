'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGameCacheManager } from '@/lib/game-cache-manager'
import { useNetworkStatus } from '@/lib/network-status'

export interface UseOfflineGamesReturn {
  offlineGames: string[]
  isGameOffline: (gameId: string) => boolean
  cacheGame: (gameId: string) => Promise<void>
  clearGameCache: (gameId: string) => Promise<void>
  updateGameCache: (gameId: string) => Promise<void>
  clearAllCaches: () => Promise<void>
  refreshOfflineGames: () => Promise<void>
  getCacheInfo: (gameId: string) => Promise<any>
  getCacheStats: () => Promise<any>
  isCaching: boolean
  cachingGame: string | null
  isOnline: boolean
}

export const useOfflineGames = (): UseOfflineGamesReturn => {
  const [offlineGames, setOfflineGames] = useState<string[]>([])
  const [isCaching, setIsCaching] = useState(false)
  const [cachingGame, setCachingGame] = useState<string | null>(null)
  const networkStatus = useNetworkStatus()

  const refreshOfflineGames = useCallback(async () => {
    try {
      const games = await getGameCacheManager().getOfflineGames()
      setOfflineGames(games)
    } catch (error) {
      console.error('Failed to refresh offline games:', error)
    }
  }, [])

  const isGameOffline = useCallback((gameId: string): boolean => {
    return offlineGames.includes(gameId)
  }, [offlineGames])

  const cacheGame = useCallback(async (gameId: string): Promise<void> => {
    if (isCaching || !networkStatus.isOnline) {
      return
    }

    try {
      setIsCaching(true)
      setCachingGame(gameId)
      
      await getGameCacheManager().cacheGameAssets(gameId)
      await refreshOfflineGames()
    } catch (error) {
      console.error(`Failed to cache game ${gameId}:`, error)
      throw error
    } finally {
      setIsCaching(false)
      setCachingGame(null)
    }
  }, [isCaching, networkStatus.isOnline, refreshOfflineGames])

  const clearGameCache = useCallback(async (gameId: string): Promise<void> => {
    try {
      await getGameCacheManager().clearGameCache(gameId)
      await refreshOfflineGames()
    } catch (error) {
      console.error(`Failed to clear cache for game ${gameId}:`, error)
      throw error
    }
  }, [refreshOfflineGames])

  const updateGameCache = useCallback(async (gameId: string): Promise<void> => {
    if (isCaching || !networkStatus.isOnline) {
      return
    }

    try {
      setIsCaching(true)
      setCachingGame(gameId)
      
      await getGameCacheManager().updateGameCache(gameId)
      await refreshOfflineGames()
    } catch (error) {
      console.error(`Failed to update cache for game ${gameId}:`, error)
      throw error
    } finally {
      setIsCaching(false)
      setCachingGame(null)
    }
  }, [isCaching, networkStatus.isOnline, refreshOfflineGames])

  const clearAllCaches = useCallback(async (): Promise<void> => {
    try {
      await getGameCacheManager().clearAllGameCaches()
      await refreshOfflineGames()
    } catch (error) {
      console.error('Failed to clear all caches:', error)
      throw error
    }
  }, [refreshOfflineGames])

  const getCacheInfo = useCallback(async (gameId: string) => {
    try {
      return await getGameCacheManager().getCacheInfo(gameId)
    } catch (error) {
      console.error(`Failed to get cache info for game ${gameId}:`, error)
      return null
    }
  }, [])

  const getCacheStats = useCallback(async () => {
    try {
      return await getGameCacheManager().getCacheStats()
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalGames: 0,
        totalSize: 0,
        oldestCache: null,
        newestCache: null,
      }
    }
  }, [])

  // Load offline games on mount
  useEffect(() => {
    refreshOfflineGames()
  }, [refreshOfflineGames])

  // Refresh offline games when network status changes
  useEffect(() => {
    if (networkStatus.isOnline) {
      refreshOfflineGames()
    }
  }, [networkStatus.isOnline, refreshOfflineGames])

  return {
    offlineGames,
    isGameOffline,
    cacheGame,
    clearGameCache,
    updateGameCache,
    clearAllCaches,
    refreshOfflineGames,
    getCacheInfo,
    getCacheStats,
    isCaching,
    cachingGame,
    isOnline: networkStatus.isOnline,
  }
}