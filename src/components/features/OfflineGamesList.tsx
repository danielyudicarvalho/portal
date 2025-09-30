'use client'

import React, { useState, useEffect } from 'react'
import { getGameCacheManager } from '@/lib/game-cache-manager'
import { useNetworkStatus } from '@/lib/network-status'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Game {
  id: string
  title: string
  description?: string
  thumbnail?: string
}

interface OfflineGamesListProps {
  className?: string
  onGameSelect?: (gameId: string) => void
  showCacheActions?: boolean
}

export const OfflineGamesList: React.FC<OfflineGamesListProps> = ({
  className = '',
  onGameSelect,
  showCacheActions = false,
}) => {
  const [offlineGames, setOfflineGames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [caching, setCaching] = useState<string | null>(null)
  const networkStatus = useNetworkStatus()

  // Game metadata - in a real app, this would come from an API or database
  const gameMetadata: Record<string, Game> = {
    'box-jump': {
      id: 'box-jump',
      title: 'Box Jump',
      description: 'Jump over obstacles and collect points',
    },
    'boom-dots': {
      id: 'boom-dots',
      title: 'Boom Dots',
      description: 'Avoid enemies and survive as long as possible',
    },
    'circle-path': {
      id: 'circle-path',
      title: 'Circle Path',
      description: 'Navigate the ball along the circular path',
    },
    'clocks': {
      id: 'clocks',
      title: 'Clocks',
      description: 'Time-based puzzle game',
    },
    'doodle-jump': {
      id: 'doodle-jump',
      title: 'Doodle Jump',
      description: 'Jump as high as you can on platforms',
    },
    'endless-scale': {
      id: 'endless-scale',
      title: 'Endless Scale',
      description: 'Scale the endless tower',
    },
    'fill-the-holes': {
      id: 'fill-the-holes',
      title: 'Fill The Holes',
      description: 'Fill all the holes to complete levels',
    },
    'memdot': {
      id: 'memdot',
      title: 'Memory Dots',
      description: 'Remember the pattern and repeat it',
    },
    '123': {
      id: '123',
      title: '123 Game',
      description: 'Number-based puzzle game',
    },
  }

  useEffect(() => {
    loadOfflineGames()
  }, [])

  const loadOfflineGames = async () => {
    try {
      setLoading(true)
      const games = await getGameCacheManager().getOfflineGames()
      setOfflineGames(games)
    } catch (error) {
      console.error('Failed to load offline games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCacheGame = async (gameId: string) => {
    if (!networkStatus.isOnline) {
      alert('You need to be online to cache games')
      return
    }

    try {
      setCaching(gameId)
      await getGameCacheManager().cacheGameAssets(gameId)
      await loadOfflineGames()
    } catch (error) {
      console.error(`Failed to cache game ${gameId}:`, error)
      alert(`Failed to cache ${gameMetadata[gameId]?.title || gameId}`)
    } finally {
      setCaching(null)
    }
  }

  const handleRemoveCache = async (gameId: string) => {
    try {
      setCaching(gameId)
      await getGameCacheManager().clearGameCache(gameId)
      await loadOfflineGames()
    } catch (error) {
      console.error(`Failed to remove cache for game ${gameId}:`, error)
      alert(`Failed to remove cache for ${gameMetadata[gameId]?.title || gameId}`)
    } finally {
      setCaching(null)
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Offline Games ({offlineGames.length})
          </h3>
          {!networkStatus.isOnline && (
            <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Offline Mode
            </div>
          )}
        </div>

        {offlineGames.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📱</div>
            <p className="font-medium">No games cached for offline play</p>
            <p className="text-sm mt-1">
              {networkStatus.isOnline 
                ? 'Play games while online to cache them automatically'
                : 'Connect to the internet to cache games for offline play'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offlineGames.map((gameId) => {
              const game = gameMetadata[gameId] || { id: gameId, title: gameId.replace(/-/g, ' ') }
              return (
                <div
                  key={gameId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium capitalize">{game.title}</div>
                    {game.description && (
                      <div className="text-sm text-gray-600 mt-1">{game.description}</div>
                    )}
                    <div className="text-xs text-green-600 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Available offline
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {onGameSelect && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onGameSelect(gameId)}
                      >
                        Play
                      </Button>
                    )}
                    
                    {showCacheActions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCache(gameId)}
                        disabled={caching === gameId}
                      >
                        {caching === gameId ? 'Removing...' : 'Remove'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Available Games to Cache */}
        {networkStatus.isOnline && showCacheActions && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Cache More Games</h4>
            <div className="space-y-2">
              {Object.values(gameMetadata)
                .filter(game => !offlineGames.includes(game.id))
                .map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{game.title}</div>
                      {game.description && (
                        <div className="text-sm text-gray-600">{game.description}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCacheGame(game.id)}
                      disabled={caching === game.id}
                    >
                      {caching === game.id ? 'Caching...' : 'Cache'}
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="pt-4 border-t text-sm text-gray-600">
          <p>• Cached games can be played without an internet connection</p>
          <p>• Games are automatically cached when you play them online</p>
          {!networkStatus.isOnline && (
            <p className="text-orange-600">• Connect to the internet to cache more games</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default OfflineGamesList