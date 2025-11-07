'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ClockIcon, CreditCardIcon } from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  description: string
  createdAt: string
  metadata?: any
}

export default function TransactionHistory() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchTransactions()
    }
  }, [session])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/history')
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_PURCHASE':
        return '💳'
      case 'CREDIT_SPEND':
        return '🎮'
      case 'CREDIT_REFUND':
        return '↩️'
      case 'DEPOSIT':
        return '💰'
      default:
        return '📄'
    }
  }

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'FAILED') return 'text-red-400'
    if (status === 'PENDING') return 'text-yellow-400'
    
    switch (type) {
      case 'CREDIT_PURCHASE':
      case 'DEPOSIT':
        return 'text-gaming-secondary'
      case 'CREDIT_SPEND':
        return 'text-gaming-accent'
      case 'CREDIT_REFUND':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'FAILED':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const formatAmount = (amount: number, type: string) => {
    if (type === 'CREDIT_SPEND' || type === 'CREDIT_PURCHASE' || type === 'CREDIT_REFUND') {
      return `${amount} credits`
    }
    return `$${amount.toFixed(2)}`
  }

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gaming-accent/10 rounded-full flex items-center justify-center">
          <CreditCardIcon className="h-8 w-8 text-gaming-accent/50" />
        </div>
        <p className="text-gray-400">Please sign in to view your transaction history.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <ClockIcon className="h-5 w-5 text-gaming-accent" />
          <h3 className="text-lg font-gaming font-semibold text-white">Transaction History</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gaming-dark/50 h-16 rounded-lg border border-gaming-accent/10"></div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center gap-3 mb-6">
          <ClockIcon className="h-5 w-5 text-gaming-accent" />
          <h3 className="text-lg font-gaming font-semibold text-white">Transaction History</h3>
        </div>
        <div className="w-16 h-16 mx-auto mb-4 bg-gaming-accent/10 rounded-full flex items-center justify-center">
          <ClockIcon className="h-8 w-8 text-gaming-accent/50" />
        </div>
        <p className="text-gray-400">No transactions yet.</p>
        <p className="text-sm text-gray-500 mt-2">Your purchase and spending history will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <ClockIcon className="h-5 w-5 text-gaming-accent" />
        <h3 className="text-lg font-gaming font-semibold text-white">Transaction History</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {transactions.map((transaction, index) => (
          <div
            key={transaction.id}
            className="p-4 bg-gaming-dark/30 border border-gaming-accent/10 rounded-lg hover:border-gaming-accent/20 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gaming-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">{getTransactionIcon(transaction.type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm line-clamp-2">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-gray-600">•</span>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`font-semibold text-sm ${getTransactionColor(transaction.type, transaction.status)}`}>
                  {transaction.type === 'CREDIT_SPEND' ? '-' : '+'}
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(transaction.status)}`}>
                  {transaction.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {transactions.length > 0 && (
        <div className="text-center pt-4 border-t border-gaming-accent/10">
          <p className="text-xs text-gray-500">
            Showing last {transactions.length} transactions
          </p>
        </div>
      )}
    </div>
  )
}