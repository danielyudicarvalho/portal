'use client'

export const registerServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('New content available, please refresh.')
            }
          })
        }
      })

      console.log('Service Worker registered successfully:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }
}

export const unregisterServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.unregister()
        console.log('Service Worker unregistered successfully')
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
      throw error
    }
  }
}

export const checkForUpdates = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        console.log('Checked for Service Worker updates')
      }
    } catch (error) {
      console.error('Failed to check for Service Worker updates:', error)
    }
  }
}

export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export const isPWAInstallable = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // This will be set by the beforeinstallprompt event
  return (window as any).deferredPrompt !== undefined
}

export const getServiceWorkerStatus = async (): Promise<{
  isRegistered: boolean
  isControlling: boolean
  isWaiting: boolean
}> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { isRegistered: false, isControlling: false, isWaiting: false }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return {
      isRegistered: !!registration,
      isControlling: !!navigator.serviceWorker.controller,
      isWaiting: !!registration?.waiting,
    }
  } catch (error) {
    console.error('Failed to get service worker status:', error)
    return { isRegistered: false, isControlling: false, isWaiting: false }
  }
}

export const skipWaitingServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  } catch (error) {
    console.error('Failed to skip waiting service worker:', error)
  }
}

export const getCacheStorageUsage = async (): Promise<{
  usage: number
  quota: number
  percentage: number
}> => {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return { usage: 0, quota: 0, percentage: 0 }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return { usage, quota, percentage }
  } catch (error) {
    console.error('Failed to get cache storage usage:', error)
    return { usage: 0, quota: 0, percentage: 0 }
  }
}

export const clearAllCaches = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('All caches cleared successfully')
  } catch (error) {
    console.error('Failed to clear caches:', error)
    throw error
  }
}