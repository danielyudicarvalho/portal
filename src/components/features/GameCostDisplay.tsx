'use client'

import { useState, useEffect } from 'react'
import { useCreditBalance } from './CreditBalance'

interface GameCostDisplayProps {
  gameId: string
  gameMode?: string
  onPlayClick?: () => void
  disabled?: boolean
}

interface GameCost {
  credits: number
  gameMode: string
}

export default function GameCostDisplay({ 
  gameId, 
  gameMode = 'standard', 
  onPlayClick,
  disabled = false 
}: GameCostDisplayProps) {
  const [gameCost, setGameCost] = useState<GameCost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSpending, setIsSpending] = useState(false)
  const { credits, refreshCredits } = useCreditBalance()

  useEffect(() => {
    fetchGameCost()
  }, [gameId, gameMode])

  const fetchGameCost = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/cost?mode=${gameMode}`)
      if (response.ok) {
        const data = await response.json()
        setGameCost(data)
      } else {
        // If no cost found, game is free
        setGameCost({ credits: 0, gameMode })
      }
    } catch (error) {
      console.error('Failed to fetch game cost:', error)
      setGameCost({ credits: 0, gameMode })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = async () => {
    if (!gameCost || gameCost.credits === 0) {
      // Free game, just play
      onPlayClick?.()
      return
    }

    if (credits < gameCost.credits) {
      alert('Insufficient credits! Please purchase more credits to play.')
      return
    }

    setIsSpending(true)
    try {
      const response = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          gameMode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        refreshCredits() // Update credit balance
        onPlayClick?.()
      } else {
        alert(data.error || 'Failed to spend credits')
      }
    } catch (error) {
      console.error('Failed to spend credits:', error)
      alert('Failed to spend credits')
    } finally {
      setIsSpending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
    )
  }

  if (!gameCost) {
    return null
  }

  const isFree = gameCost.credits === 0
  const canAfford = credits >= gameCost.credits
  const isDisabled = disabled || isSpending || (!isFree && !canAfford)

  return (
    <div className="flex items-center gap-3">
      {!isFree && (
        <div className="flex items-center gap-1 text-sm">
          <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className={canAfford ? 'text-gray-700' : 'text-red-600'}>
            {gameCost.credits}
          </span>
        </div>
      )}

      <button
        onClick={handlePlay}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isFree
            ? 'bg-green-600 text-white hover:bg-green-700'
            : canAfford
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isSpending ? (
          'Processing...'
        ) : isFree ? (
          'Play Free'
        ) : canAfford ? (
          'Play Game'
        ) : (
          'Need More Credits'
        )}
      </button>

      {!isFree && !canAfford && (
        <span className="text-xs text-red-600">
          Need {gameCost.credits - credits} more credits
        </span>
      )}
    </div>
  )
}