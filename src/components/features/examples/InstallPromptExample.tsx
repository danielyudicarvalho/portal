'use client'

import React, { useState } from 'react'
import { InstallPrompt } from '../InstallPrompt'

/**
 * Example component demonstrating different ways to use the InstallPrompt component
 */
export function InstallPromptExample() {
  const [showBanner, setShowBanner] = useState(true)
  const [showCard, setShowCard] = useState(true)

  return (
    <div className="space-y-8 p-6 bg-gaming-dark min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          InstallPrompt Component Examples
        </h1>

        {/* Button Variant */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Button Variant
          </h2>
          <p className="text-gray-300 mb-6">
            Simple button that can be placed anywhere in your UI. Perfect for headers, 
            navigation bars, or inline with other actions.
          </p>
          
          <div className="bg-gaming-darker p-6 rounded-lg">
            <div className="flex flex-wrap gap-4 items-center">
              <InstallPrompt variant="button" />
              <InstallPrompt 
                variant="button" 
                className="bg-blue-600 hover:bg-blue-700" 
              />
              <span className="text-gray-400">← Try different styles</span>
            </div>
          </div>

          <div className="mt-4 bg-gray-800 p-4 rounded text-sm text-gray-300 font-mono">
            {`<InstallPrompt variant="button" />`}
          </div>
        </section>

        {/* Banner Variant */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Banner Variant
          </h2>
          <p className="text-gray-300 mb-6">
            Prominent banner with description and dismiss option. Great for top-of-page 
            notifications or important announcements.
          </p>
          
          <div className="bg-gaming-darker p-6 rounded-lg">
            {showBanner ? (
              <InstallPrompt 
                variant="banner" 
                showDismiss={true}
                onDismiss={() => setShowBanner(false)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Banner was dismissed</p>
                <button
                  onClick={() => setShowBanner(true)}
                  className="px-4 py-2 bg-gaming-accent text-white rounded hover:bg-gaming-accent/90"
                >
                  Show Banner Again
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 bg-gray-800 p-4 rounded text-sm text-gray-300 font-mono">
            {`<InstallPrompt 
  variant="banner" 
  showDismiss={true}
  onDismiss={() => setShowBanner(false)}
/>`}
          </div>
        </section>

        {/* Card Variant */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Card Variant
          </h2>
          <p className="text-gray-300 mb-6">
            Full-featured card with detailed information and multiple actions. 
            Perfect for dedicated installation pages or modal dialogs.
          </p>
          
          <div className="bg-gaming-darker p-6 rounded-lg">
            {showCard ? (
              <div className="max-w-md mx-auto">
                <InstallPrompt 
                  variant="card" 
                  showDismiss={true}
                  onDismiss={() => setShowCard(false)}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Card was dismissed</p>
                <button
                  onClick={() => setShowCard(true)}
                  className="px-4 py-2 bg-gaming-accent text-white rounded hover:bg-gaming-accent/90"
                >
                  Show Card Again
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 bg-gray-800 p-4 rounded text-sm text-gray-300 font-mono">
            {`<InstallPrompt 
  variant="card" 
  showDismiss={true}
  onDismiss={() => setShowCard(false)}
/>`}
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Usage Guidelines
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gaming-darker p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-400 mb-3">
                ✅ Best Practices
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Use button variant in navigation bars</li>
                <li>• Use banner variant for page-wide notifications</li>
                <li>• Use card variant in dedicated installation flows</li>
                <li>• Always provide dismiss option for banners and cards</li>
                <li>• Test on actual mobile devices</li>
                <li>• Respect user&apos;s choice if they dismiss</li>
              </ul>
            </div>

            <div className="bg-gaming-darker p-6 rounded-lg">
              <h3 className="text-lg font-medium text-red-400 mb-3">
                ❌ Avoid
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Showing multiple install prompts simultaneously</li>
                <li>• Forcing installation without user consent</li>
                <li>• Showing prompts on every page visit</li>
                <li>• Using intrusive modal overlays</li>
                <li>• Ignoring browser&apos;s native install prompt timing</li>
                <li>• Making dismiss buttons too small on mobile</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Integration Notes */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Integration Notes
          </h2>
          
          <div className="bg-gaming-darker p-6 rounded-lg">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                The InstallPrompt component automatically integrates with the PWA provider 
                to handle installation state and user interactions. It will only show when:
              </p>
              
              <ul className="text-gray-300 space-y-1 mb-4">
                <li>• The app is installable (beforeinstallprompt event fired)</li>
                <li>• The app is not already installed</li>
                <li>• The user hasn&apos;t dismissed the prompt</li>
              </ul>

              <p className="text-gray-300">
                The component provides built-in error handling, loading states, and 
                success feedback. It&apos;s fully accessible and optimized for touch interactions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default InstallPromptExample