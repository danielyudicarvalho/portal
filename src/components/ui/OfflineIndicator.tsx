'use client'

import React from 'react'
import { useNetworkStatus } from '@/lib/network-status'

interface OfflineIndicatorProps {
  className?: string
  showOnlineStatus?: boolean
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showOnlineStatus = false,
}) => {
  const networkStatus = useNetworkStatus()

  if (networkStatus.isOnline && !showOnlineStatus) {
    return null
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium
        transition-all duration-300 ease-in-out
        ${networkStatus.isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
        }
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <div
          className={`
            w-2 h-2 rounded-full
            ${networkStatus.isOnline ? 'bg-green-200' : 'bg-red-200'}
          `}
        />
        <span>
          {networkStatus.isOnline ? 'Online' : 'Offline'}
        </span>
        {!networkStatus.isOnline && (
          <span className="text-xs opacity-75">
            - Limited functionality
          </span>
        )}
      </div>
    </div>
  )
}

export default OfflineIndicator