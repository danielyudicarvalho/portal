'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonusCredits: number
  isActive: boolean
  isPopular: boolean
  order: number
}

interface GameCost {
  id: string
  gameId: string
  gameMode: string
  credits: number
  isActive: boolean
  game: {
    title: string
  }
}

export default function AdminCreditsPage() {
  const { data: session } = useSession()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [gameCosts, setGameCosts] = useState<GameCost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [packagesRes, costsRes] = await Promise.all([
        fetch('/api/admin/credit-packages'),
        fetch('/api/admin/game-costs')
      ])
      
      const packagesData = await packagesRes.json()
      const costsData = await costsRes.json()
      
      setPackages(packagesData.packages || [])
      setGameCosts(costsData.costs || [])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is admin (you should implement proper admin role checking)
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access admin panel.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Credits Administration</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Credit Packages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Credit Packages</h2>
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">
                        {pkg.credits} credits + {pkg.bonusCredits} bonus = {pkg.credits + pkg.bonusCredits} total
                      </p>
                      <p className="text-lg font-semibold text-green-600">${pkg.price}</p>
                    </div>
                    <div className="flex gap-2">
                      {pkg.isPopular && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Popular
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        pkg.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Costs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Game Costs</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {gameCosts.map((cost) => (
                <div key={cost.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{cost.game.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{cost.gameMode} mode</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{cost.credits} credits</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        cost.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cost.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Packages</h3>
            <p className="text-3xl font-bold text-blue-600">{packages.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Packages</h3>
            <p className="text-3xl font-bold text-green-600">
              {packages.filter(p => p.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Game Costs</h3>
            <p className="text-3xl font-bold text-purple-600">{gameCosts.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}