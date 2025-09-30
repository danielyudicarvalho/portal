'use client'

import React from 'react'
import { CacheManager } from '@/components/features'
import OfflineGamesList from '@/components/features/OfflineGamesList'
import { Button } from '@/components/ui'

export default function CachePage() {
  const handleGameSelect = (gameId: string) => {
    // Navigate to the game page
    window.location.href = `/games/${gameId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cache Management
          </h1>
          <p className="text-gray-600">
            Manage offline game caching and view storage usage.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Cache Manager */}
          <div>
            <CacheManager 
              showStats={true}
              allowCacheManagement={true}
            />
          </div>
          
          {/* Offline Games List */}
          <div>
            <OfflineGamesList 
              onGameSelect={handleGameSelect}
              showCacheActions={true}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
          >
            ← Back to Games
          </Button>
        </div>
      </div>
    </div>
  )
}