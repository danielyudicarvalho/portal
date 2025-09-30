'use client'

export interface CacheEntry {
  gameId: string
  cachedAt: Date
  version: string
  size: number
  assets: string[]
}

export interface GameCacheManager {
  cacheGameAssets(gameId: string): Promise<void>
  isGameAvailableOffline(gameId: string): Promise<boolean>
  getOfflineGames(): Promise<string[]>
  clearGameCache(gameId: string): Promise<void>
  getCacheInfo(gameId: string): Promise<CacheEntry | null>
  getTotalCacheSize(): Promise<number>
  getAllCacheEntries(): Promise<CacheEntry[]>
  clearAllGameCaches(): Promise<void>
  updateGameCache(gameId: string): Promise<void>
  getCacheStats(): Promise<{
    totalGames: number
    totalSize: number
    oldestCache: Date | null
    newestCache: Date | null
  }>
}

class GameCacheManagerImpl implements GameCacheManager {
  private readonly CACHE_NAME = 'game-assets-cache'
  private readonly CACHE_INFO_KEY = 'game-cache-info'

  async cacheGameAssets(gameId: string): Promise<void> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported')
    }

    try {
      const cache = await caches.open(this.CACHE_NAME)
      const gameAssets = await this.getGameAssetUrls(gameId)
      
      const cachedAssets: string[] = []
      let totalSize = 0
      
      // Cache all game assets with better error handling
      const cachePromises = gameAssets.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            const clonedResponse = response.clone()
            await cache.put(url, clonedResponse)
            cachedAssets.push(url)
            
            // Estimate size from content-length header or response size
            const contentLength = response.headers.get('content-length')
            if (contentLength) {
              totalSize += parseInt(contentLength, 10)
            } else {
              // Fallback size estimation
              totalSize += 50000 // 50KB average
            }
            
            return { url, success: true }
          } else {
            console.warn(`Failed to fetch asset (${response.status}): ${url}`)
            return { url, success: false, error: `HTTP ${response.status}` }
          }
        } catch (error) {
          console.warn(`Failed to cache asset: ${url}`, error)
          return { url, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      const results = await Promise.allSettled(cachePromises)
      
      // Count successful caches
      const successfulCaches = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      
      if (successfulCaches === 0) {
        console.warn(`No assets could be cached for game ${gameId}`)
        // Still store cache info even if no assets were cached, for tracking purposes
        await this.storeCacheInfo(gameId, [], 0)
        return
      }

      // Store cache metadata with actual cached assets and size
      await this.storeCacheInfo(gameId, cachedAssets, totalSize)
      
      console.log(`Game ${gameId} cached: ${successfulCaches}/${gameAssets.length} assets (${this.formatBytes(totalSize)})`)
    } catch (error) {
      console.error(`Failed to cache game ${gameId}:`, error)
      throw error
    }
  }

  async isGameAvailableOffline(gameId: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false
    }

    try {
      const cache = await caches.open(this.CACHE_NAME)
      const gameAssets = await this.getGameAssetUrls(gameId)
      
      // Check if all critical assets are cached
      await Promise.all(
        gameAssets.map(async (url) => {
          const response = await cache.match(url)
          return response !== undefined
        })
      )

      // Game is available offline if at least the main game file is cached
      const mainGameFile = `/games/${gameId}/index.html`
      const mainGameResponse = await cache.match(mainGameFile)
      
      return mainGameResponse !== undefined
    } catch (error) {
      console.error(`Failed to check offline availability for game ${gameId}:`, error)
      return false
    }
  }

  async getOfflineGames(): Promise<string[]> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      const offlineGames: string[] = []

      for (const gameId of Object.keys(cacheInfo)) {
        const isAvailable = await this.isGameAvailableOffline(gameId)
        if (isAvailable) {
          offlineGames.push(gameId)
        }
      }

      return offlineGames
    } catch (error) {
      console.error('Failed to get offline games:', error)
      return []
    }
  }

  async clearGameCache(gameId: string): Promise<void> {
    if (!('caches' in window)) {
      return
    }

    try {
      const cache = await caches.open(this.CACHE_NAME)
      const gameAssets = await this.getGameAssetUrls(gameId)
      
      // Remove all game assets from cache
      await Promise.all(
        gameAssets.map(url => cache.delete(url))
      )

      // Remove cache metadata
      await this.removeCacheInfo(gameId)
      
      console.log(`Game ${gameId} cache cleared successfully`)
    } catch (error) {
      console.error(`Failed to clear cache for game ${gameId}:`, error)
      throw error
    }
  }

  async getCacheInfo(gameId: string): Promise<CacheEntry | null> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      return cacheInfo[gameId] || null
    } catch (error) {
      console.error(`Failed to get cache info for game ${gameId}:`, error)
      return null
    }
  }

  async getTotalCacheSize(): Promise<number> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      return Object.values(cacheInfo).reduce((total, entry) => total + entry.size, 0)
    } catch (error) {
      console.error('Failed to get total cache size:', error)
      return 0
    }
  }

  private async getGameAssetUrls(gameId: string): Promise<string[]> {
    const baseUrls = [
      `/games/${gameId}/index.html`,
      `/games/${gameId}/js/game.js`,
    ]

    const allAssets = [...baseUrls]

    // Define known asset patterns for each game based on the actual structure
    const gameAssetPatterns: Record<string, string[]> = {
      'box-jump': [
        '/games/box-jump/images/cube.png',
        '/games/box-jump/images/line.png',
        '/games/box-jump/images/pixel.png',
        '/games/box-jump/images/player.png',
        '/games/box-jump/sounds/hit.wav',
        '/games/box-jump/sounds/jump.wav',
        '/games/box-jump/sounds/music.wav',
      ],
      'boom-dots': [
        '/games/boom-dots/assets/enemy.png',
        '/games/boom-dots/assets/player.png',
      ],
      'circle-path': [
        '/games/circle-path/assets/arm.png',
        '/games/circle-path/assets/ball.png',
        '/games/circle-path/assets/target.png',
      ],
      'clocks': [
        '/games/clocks/assets/sprites/ball.png',
        '/games/clocks/assets/sprites/bigclock.png',
        '/games/clocks/assets/sprites/bigclockface.png',
        '/games/clocks/assets/sprites/bighand.png',
        '/games/clocks/assets/sprites/loading.png',
        '/games/clocks/assets/sprites/smallclock.png',
        '/games/clocks/assets/sprites/smallclockface.png',
        '/games/clocks/assets/sprites/smallhand.png',
      ],
      'doodle-jump': [
        '/games/doodle-jump/assets/background.png',
        '/games/doodle-jump/assets/clouds.png',
        '/games/doodle-jump/assets/dude.png',
        '/games/doodle-jump/assets/ice-platform.png',
        '/games/doodle-jump/assets/platform.png',
        '/games/doodle-jump/assets/trees.png',
      ],
      'endless-scale': [
        '/games/endless-scale/assets/ninja.png',
        '/games/endless-scale/assets/pole.png',
        '/games/endless-scale/assets/powerbar.png',
      ],
      'fill-the-holes': [
        '/games/fill-the-holes/images/arrows.png',
        '/games/fill-the-holes/images/box.png',
        '/games/fill-the-holes/images/hole.png',
        '/games/fill-the-holes/images/loading.png',
        '/games/fill-the-holes/images/loading2.png',
        '/games/fill-the-holes/images/wall.png',
        '/games/fill-the-holes/sounds/hit.wav',
        '/games/fill-the-holes/sounds/music.wav',
        '/games/fill-the-holes/sounds/next.wav',
      ],
      'memdot': [
        '/games/memdot/assets/background.png',
        '/games/memdot/assets/circles.png',
        '/games/memdot/assets/timer.png',
      ],
      '123': [
        '/games/123/assets/buttons.png',
        '/games/123/assets/timebar.png',
      ],
    }

    // Add known assets for this game
    if (gameAssetPatterns[gameId]) {
      allAssets.push(...gameAssetPatterns[gameId])
    }

    // Try to detect additional assets by checking common patterns
    const potentialAssetDirs = [
      `/games/${gameId}/assets/`,
      `/games/${gameId}/images/`,
      `/games/${gameId}/sounds/`,
    ]

    for (const assetDir of potentialAssetDirs) {
      try {
        // Try to fetch the directory to see if it exists
        const response = await fetch(assetDir)
        if (response.ok) {
          // Add common asset file patterns that might exist
          const commonAssetNames = [
            'player', 'enemy', 'background', 'music', 'sound', 'hit', 'jump',
            'ball', 'target', 'platform', 'sprite', 'icon', 'button', 'ui'
          ]
          const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'wav', 'mp3', 'ogg']
          
          for (const name of commonAssetNames) {
            for (const ext of extensions) {
              allAssets.push(`${assetDir}${name}.${ext}`)
            }
          }
        }
      } catch {
        // Directory doesn't exist or can't be accessed, skip
      }
    }

    return allAssets
  }

  private async storeCacheInfo(gameId: string, assets: string[], size?: number): Promise<void> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      
      // Use provided size or calculate approximate size
      const actualSize = size || assets.length * 50000 // Fallback to 50KB per asset
      
      cacheInfo[gameId] = {
        gameId,
        cachedAt: new Date(),
        version: '1.0.0', // In a real app, this would come from game metadata
        size: actualSize,
        assets,
      }

      localStorage.setItem(this.CACHE_INFO_KEY, JSON.stringify(cacheInfo))
    } catch (error) {
      console.error('Failed to store cache info:', error)
    }
  }

  async getAllCacheEntries(): Promise<CacheEntry[]> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      return Object.values(cacheInfo).sort((a, b) => b.cachedAt.getTime() - a.cachedAt.getTime())
    } catch (error) {
      console.error('Failed to get all cache entries:', error)
      return []
    }
  }

  async clearAllGameCaches(): Promise<void> {
    if (!('caches' in window)) {
      return
    }

    try {
      const cache = await caches.open(this.CACHE_NAME)
      const cacheInfo = await this.getCacheInfoFromStorage()
      
      // Clear all cached assets
      const clearPromises = Object.keys(cacheInfo).map(async (gameId) => {
        const gameAssets = await this.getGameAssetUrls(gameId)
        return Promise.all(gameAssets.map(url => cache.delete(url)))
      })
      
      await Promise.all(clearPromises)
      
      // Clear cache metadata
      localStorage.removeItem(this.CACHE_INFO_KEY)
      
      console.log('All game caches cleared successfully')
    } catch (error) {
      console.error('Failed to clear all game caches:', error)
      throw error
    }
  }

  async updateGameCache(gameId: string): Promise<void> {
    // First clear the existing cache, then re-cache
    await this.clearGameCache(gameId)
    await this.cacheGameAssets(gameId)
  }

  async getCacheStats(): Promise<{
    totalGames: number
    totalSize: number
    oldestCache: Date | null
    newestCache: Date | null
  }> {
    try {
      const entries = await this.getAllCacheEntries()
      
      if (entries.length === 0) {
        return {
          totalGames: 0,
          totalSize: 0,
          oldestCache: null,
          newestCache: null,
        }
      }

      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
      const dates = entries.map(entry => entry.cachedAt).sort((a, b) => a.getTime() - b.getTime())
      
      return {
        totalGames: entries.length,
        totalSize,
        oldestCache: dates[0],
        newestCache: dates[dates.length - 1],
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalGames: 0,
        totalSize: 0,
        oldestCache: null,
        newestCache: null,
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private async removeCacheInfo(gameId: string): Promise<void> {
    try {
      const cacheInfo = await this.getCacheInfoFromStorage()
      delete cacheInfo[gameId]
      localStorage.setItem(this.CACHE_INFO_KEY, JSON.stringify(cacheInfo))
    } catch (error) {
      console.error('Failed to remove cache info:', error)
    }
  }

  private async getCacheInfoFromStorage(): Promise<Record<string, CacheEntry>> {
    try {
      const stored = localStorage.getItem(this.CACHE_INFO_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        Object.values(parsed).forEach((entry: any) => {
          entry.cachedAt = new Date(entry.cachedAt)
        })
        return parsed
      }
      return {}
    } catch (error) {
      console.error('Failed to get cache info from storage:', error)
      return {}
    }
  }
}

// Singleton instance (client-side only)
let gameCacheManagerInstance: GameCacheManagerImpl | null = null;

export const getGameCacheManager = (): GameCacheManagerImpl => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      cacheGame: async () => ({ success: false, cachedAssets: [], failedAssets: [], totalSize: 0 }),
      getCachedGames: async () => [],
      removeCachedGame: async () => ({ success: false }),
      clearCache: async () => ({ success: false, clearedSize: 0 }),
      getCacheSize: async () => 0,
      isGameCached: async () => false,
      preloadCriticalAssets: async () => ({ success: false, cachedAssets: [], failedAssets: [], totalSize: 0 }),
    } as any;
  }
  
  if (!gameCacheManagerInstance) {
    gameCacheManagerInstance = new GameCacheManagerImpl();
  }
  return gameCacheManagerInstance;
};

// Export the getter function instead of a direct instance
export { getGameCacheManager as gameCacheManager };