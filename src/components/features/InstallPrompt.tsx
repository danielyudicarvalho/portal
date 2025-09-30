'use client'

import React, { useState } from 'react'
import { CloudArrowDownIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { usePWA } from '@/components/providers/PWAProvider'

interface InstallPromptProps {
  className?: string
  variant?: 'banner' | 'button' | 'card'
  showDismiss?: boolean
  onDismiss?: () => void
}

type InstallationStatus = 'idle' | 'installing' | 'success' | 'error'

export function InstallPrompt({ 
  className = '', 
  variant = 'button',
  showDismiss = false,
  onDismiss 
}: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA()
  const [installStatus, setInstallStatus] = useState<InstallationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    try {
      setInstallStatus('installing')
      setErrorMessage('')
      
      await promptInstall()
      
      // Check if installation was successful
      // Note: The PWA provider will handle updating isInstalled state
      setInstallStatus('success')
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setInstallStatus('idle')
      }, 3000)
      
    } catch (error) {
      console.error('Installation failed:', error)
      setInstallStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Installation failed')
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setInstallStatus('idle')
        setErrorMessage('')
      }, 5000)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstall}
        disabled={installStatus === 'installing'}
        className={`
          inline-flex items-center justify-center px-4 py-2 
          bg-gaming-accent hover:bg-gaming-accent/90 
          disabled:bg-gaming-accent/50 disabled:cursor-not-allowed
          text-white text-sm font-medium rounded-lg 
          transition-colors duration-200 
          tap-target touch-manipulation
          ${className}
        `}
        aria-label="Install app"
      >
        {installStatus === 'installing' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Installing...
          </>
        ) : installStatus === 'success' ? (
          <>
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Installed!
          </>
        ) : installStatus === 'error' ? (
          <>
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Try Again
          </>
        ) : (
          <>
            <CloudArrowDownIcon className="h-4 w-4 mr-2" />
            Install App
          </>
        )}
      </button>
    )
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className={`
        flex items-center justify-between p-4 
        bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg
        ${className}
      `}>
        <div className="flex items-center space-x-3">
          <CloudArrowDownIcon className="h-6 w-6 text-gaming-accent flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-white">
              Install Game Portal
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              Get the full app experience with offline access
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            disabled={installStatus === 'installing'}
            className="
              px-3 py-2 bg-gaming-accent hover:bg-gaming-accent/90 
              disabled:bg-gaming-accent/50 disabled:cursor-not-allowed
              text-white text-xs font-medium rounded 
              transition-colors duration-200
              tap-target touch-manipulation
            "
          >
            {installStatus === 'installing' ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
            ) : installStatus === 'success' ? (
              'Installed!'
            ) : installStatus === 'error' ? (
              'Retry'
            ) : (
              'Install'
            )}
          </button>
          
          {showDismiss && (
            <button
              onClick={handleDismiss}
              className="
                p-1 text-gray-400 hover:text-white 
                transition-colors duration-200
                tap-target touch-manipulation
              "
              aria-label="Dismiss install prompt"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`
        bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6
        ${className}
      `}>
        <div className="text-center">
          <CloudArrowDownIcon className="h-12 w-12 text-gaming-accent mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold text-white mb-2">
            Install Game Portal
          </h3>
          
          <p className="text-sm text-gray-300 mb-6">
            Install our app for the best gaming experience with offline access, 
            faster loading, and native app features.
          </p>
          
          {installStatus === 'error' && errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-center text-red-400 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                {errorMessage}
              </div>
            </div>
          )}
          
          {installStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-center text-green-400 text-sm">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                App installed successfully!
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              disabled={installStatus === 'installing'}
              className="
                flex-1 px-4 py-3 bg-gaming-accent hover:bg-gaming-accent/90 
                disabled:bg-gaming-accent/50 disabled:cursor-not-allowed
                text-white text-sm font-medium rounded-lg 
                transition-colors duration-200
                tap-target touch-manipulation
              "
            >
              {installStatus === 'installing' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block" />
                  Installing...
                </>
              ) : installStatus === 'success' ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2 inline-block" />
                  Installed!
                </>
              ) : installStatus === 'error' ? (
                'Try Again'
              ) : (
                'Install Now'
              )}
            </button>
            
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="
                  px-4 py-3 text-gray-400 hover:text-white border border-gray-600 
                  hover:border-gray-500 rounded-lg transition-colors duration-200
                  tap-target touch-manipulation
                "
              >
                Maybe Later
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default InstallPrompt