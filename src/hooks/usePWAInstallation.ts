'use client'

import { usePWA } from '@/components/providers/PWAProvider'
import { useCallback } from 'react'

/**
 * Hook for managing PWA installation state and actions
 */
export function usePWAInstallation() {
  const {
    isInstalled,
    isInstallable,
    installPromptEvent,
    installationDate,
    userPreferences,
    promptInstall,
    updateUserPreferences,
  } = usePWA()

  const handleInstall = useCallback(async () => {
    if (!isInstallable || !installPromptEvent) {
      throw new Error('PWA is not installable at this time')
    }

    try {
      await promptInstall()
      return true
    } catch (error) {
      console.error('Failed to install PWA:', error)
      return false
    }
  }, [isInstallable, installPromptEvent, promptInstall])

  const toggleAutoInstallPrompt = useCallback((enabled: boolean) => {
    updateUserPreferences({ autoInstallPrompt: enabled })
  }, [updateUserPreferences])

  const getInstallationInfo = useCallback(() => {
    if (!isInstalled || !installationDate) {
      return null
    }

    const installDate = new Date(installationDate)
    const daysSinceInstall = Math.floor(
      (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      installDate,
      daysSinceInstall,
      isNewInstallation: daysSinceInstall < 1,
    }
  }, [isInstalled, installationDate])

  return {
    // State
    isInstalled,
    isInstallable,
    canPromptInstall: isInstallable && !!installPromptEvent,
    autoInstallPrompt: userPreferences.autoInstallPrompt,
    installationInfo: getInstallationInfo(),

    // Actions
    install: handleInstall,
    toggleAutoInstallPrompt,
  }
}

export default usePWAInstallation