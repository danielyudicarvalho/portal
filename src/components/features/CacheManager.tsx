'use client'

import React, { useState, useEffect } from 'react'
import { getGameCacheManager, type CacheEntry } from '@/lib/game-cache-manager'
import { getCacheStorageUsage } from '@/lib/pwa'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface CacheManagerProps {
  className?: string
  showStats?: boolean
  allowCacheManagement?: boolean
}

interface CacheStats {
  totalGames: number
  totalSize: number
  oldestCache: Date | null
  newestCache: Date | null
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  className = '',
  showStats = true,
  allowCacheManagement = true,
}) => {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([])
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalGames: 0,
    totalSize: 0,
    oldestCache: null,
    newestCache: null,
  })
  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadCacheData()
  }, [])

  const loadCacheData = async () => {
    try {
      setLoading(true)
      
      // Get all cache entries
      const entries = await getGameCacheManager().getAllCacheEntries()
      setCacheEntries(entries)
      
      // Get cache statistics
      const stats = await getGameCacheManager().getCacheStats()
      setCacheStats(stats)
      
      // Get storage usage
      const usage = await getCacheStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error('Failed to load cache data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearGameCache = async (gameId: string) => {
    try {
      setClearing(gameId)
      await getGameCacheManager().clearGameCache(gameId)
      await loadCacheData() // Refresh data
    } catch (error) {
      console.error(`Failed to clear cache for game ${gameId}:`, error)
    } finally {
      setClearing(null)
    }
  }

  const handleClearAllCaches = async () => {
    try {
      setClearing('all')
      await getGameCacheManager().clearAllGameCaches()
      await loadCacheData() // Refresh data
    } catch (error) {
      console.error('Failed to clear all caches:', error)
    } finally {
      setClearing(null)
    }
  }

  const handleUpdateGameCache = async (gameId: string) => {
    try {
      setUpdating(gameId)
      await getGameCacheManager().updateGameCache(gameId)
      await loadCacheData() // Refresh data
    } catch (error) {
      console.error(`Failed to update cache for game ${gameId}:`, error)
    } finally {
      setUpdating(null)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Cache Statistics */}
        {showStats && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Cache Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.totalGames}</div>
                <div className="text-sm text-gray-600">Games Cached</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatBytes(cacheStats.totalSize)}</div>
                <div className="text-sm text-gray-600">Total Size</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-bold text-purple-600">
                  {cacheStats.newestCache ? formatDate(cacheStats.newestCache) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Latest Cache</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm font-bold text-orange-600">
                  {cacheStats.oldestCache ? formatDate(cacheStats.oldestCache) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Oldest Cache</div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Usage */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Storage Usage</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {formatBytes(storageUsage.usage)}</span>
              <span>Available: {formatBytes(storageUsage.quota)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 text-center">
              {storageUsage.percentage.toFixed(1)}% used
            </div>
          </div>
        </div>

        {/* Cached Games */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Cached Games ({cacheEntries.length})</h3>
            {allowCacheManagement && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCacheData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllCaches}
                  disabled={clearing === 'all' || cacheEntries.length === 0}
                >
                  {clearing === 'all' ? 'Clearing...' : 'Clear All'}
                </Button>
              </div>
            )}
          </div>

          {cacheEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No games cached for offline play</p>
              <p className="text-sm mt-1">
                Play games while online to cache them automatically
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cacheEntries.map((entry) => (
                <div
                  key={entry.gameId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {entry.gameId.replace(/-/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cached: {formatDate(entry.cachedAt)} • {formatBytes(entry.size)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.assets.length} assets • v{entry.version}
                    </div>
                  </div>
                  {allowCacheManagement && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateGameCache(entry.gameId)}
                        disabled={updating === entry.gameId || clearing === entry.gameId}
                        title="Update cache with latest assets"
                      >
                        {updating === entry.gameId ? 'Updating...' : 'Update'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearGameCache(entry.gameId)}
                        disabled={clearing === entry.gameId || updating === entry.gameId}
                      >
                        {clearing === entry.gameId ? 'Clearing...' : 'Clear'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cache Actions */}
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Games are automatically cached when you play them</p>
            <p>• Cached games can be played offline</p>
            <p>• Update cache to get the latest game assets</p>
            <p>• Clear cache to free up storage space</p>
            {!allowCacheManagement && (
              <p className="text-orange-600">• Cache management is disabled in this view</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CacheManager