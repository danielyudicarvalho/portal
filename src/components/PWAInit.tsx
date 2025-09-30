'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa'

export default function PWAInit() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker().catch(console.error)
  }, [])

  return null
}