'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UseBalanceReturn {
  balance: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBalance(): UseBalanceReturn {
  const { data: session, status } = useSession()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    if (status !== 'authenticated' || !session?.user) {
      setBalance(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/account/balance')
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }

      const data = await response.json()
      setBalance(data.balance || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching balance:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [session, status])

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance
  }
}