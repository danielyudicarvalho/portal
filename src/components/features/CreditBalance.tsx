'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CreditBalanceProps {
  showPurchaseButton?: boolean
  onPurchaseClick?: () => void
}

export default function CreditBalance({ showPurchaseButton = true, onPurchaseClick }: CreditBalanceProps) {
  const { data: session } = useSession()
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchCredits()
    }
  }, [session])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()
      setCredits(data.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setCredits(0)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        <span className="text-sm text-gray-500">credits</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="font-semibold text-gray-900">{credits}</span>
        <span className="text-sm text-gray-500">credits</span>
      </div>
      
      {showPurchaseButton && (
        <button
          onClick={onPurchaseClick}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
        >
          Buy Credits
        </button>
      )}
    </div>
  )
}

// Hook to refresh credit balance
export function useCreditBalance() {
  const [credits, setCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()
      setCredits(data.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [])

  const refreshCredits = () => {
    fetchCredits()
  }

  return { credits, isLoading, refreshCredits }
}