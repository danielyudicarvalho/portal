'use client'

export interface NetworkStatus {
  isOnline: boolean
  connectionType: string
  effectiveType: string
}

export interface NetworkStatusManager {
  getNetworkStatus(): NetworkStatus
  onNetworkChange(callback: (status: NetworkStatus) => void): () => void
  isOnline(): boolean
}

export class NetworkStatusManagerImpl implements NetworkStatusManager {
  private listeners: Set<(status: NetworkStatus) => void> = new Set()
  private currentStatus: NetworkStatus

  constructor() {
    this.currentStatus = this.getCurrentNetworkStatus()
    this.setupEventListeners()
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback)
    
    // Return cleanup function
    return () => {
      this.listeners.delete(callback)
    }
  }

  isOnline(): boolean {
    return this.currentStatus.isOnline
  }

  private getCurrentNetworkStatus(): NetworkStatus {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      }
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    const updateStatus = () => {
      const newStatus = this.getCurrentNetworkStatus()
      const statusChanged = 
        newStatus.isOnline !== this.currentStatus.isOnline ||
        newStatus.connectionType !== this.currentStatus.connectionType ||
        newStatus.effectiveType !== this.currentStatus.effectiveType

      if (statusChanged) {
        this.currentStatus = newStatus
        this.notifyListeners(newStatus)
      }
    }

    // Listen for online/offline events
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateStatus)
    }
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in network status callback:', error)
      }
    })
  }
}

// Singleton instance (client-side only)
let networkStatusManagerInstance: NetworkStatusManagerImpl | null = null;

export const getNetworkStatusManager = (): NetworkStatusManagerImpl => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      getStatus: () => ({ isOnline: true, connectionType: 'unknown', effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false }),
      subscribe: () => () => {},
      isSlowConnection: () => false,
      getConnectionQuality: () => 'good',
    } as any;
  }
  
  if (!networkStatusManagerInstance) {
    networkStatusManagerInstance = new NetworkStatusManagerImpl();
  }
  return networkStatusManagerInstance;
};

// Export the getter function instead of a direct instance
export { getNetworkStatusManager as networkStatusManager };

// React hook for using network status
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = React.useState<NetworkStatus>(() => {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      }
    }
    return getNetworkStatusManager().getNetworkStatus()
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    const unsubscribe = getNetworkStatusManager().onNetworkChange(setNetworkStatus)
    return unsubscribe
  }, [])

  return networkStatus
}

// We need to import React for the hook
import React from 'react'