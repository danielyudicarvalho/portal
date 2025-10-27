'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  description: string
  createdAt: string
}

interface AccountData {
  balance: number
  recentTransactions: Transaction[]
}

export function AccountPage() {
  const { data: session } = useSession()
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    try {
      const response = await fetch('/api/account/balance')
      if (response.ok) {
        const data = await response.json()
        setAccountData(data)
      }
    } catch (error) {
      console.error('Failed to fetch account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'FAILED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '↗️'
      case 'WITHDRAWAL':
        return '↙️'
      case 'PURCHASE':
        return '🛒'
      case 'REFUND':
        return '↩️'
      default:
        return '💰'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">
            Manage your balance and view transaction history
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Account Balance
              </h2>
              <span className="text-3xl">💰</span>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-4">
                ${accountData?.balance?.toFixed(2) || '0.00'}
              </p>
              <Link href="/account/deposit">
                <Button className="w-full">
                  Add Funds
                </Button>
              </Link>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Account Info
              </h2>
              <span className="text-3xl">👤</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{session?.user?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Transactions
          </h2>
          
          {accountData?.recentTransactions?.length ? (
            <div className="space-y-4">
              {accountData.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">
                      {getTypeIcon(transaction.type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'DEPOSIT' || transaction.type === 'REFUND'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? '+' : '-'}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No transactions yet</p>
              <Link href="/account/deposit">
                <Button>Make Your First Deposit</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}