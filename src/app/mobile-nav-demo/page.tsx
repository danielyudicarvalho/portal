'use client';

import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import MobileNav from '@/components/layout/MobileNav';

export default function MobileNavDemo() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header with hamburger menu */}
      <div className="bg-gaming-darker border-b border-gaming-accent/20 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="text-white p-2 hover:bg-gaming-accent/20 rounded-lg transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-white text-lg font-semibold">Mobile Navigation Demo</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        isOnline={true}
        offlineGamesCount={3}
      />

      {/* Main content */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Mobile Navigation Demo
          </h2>
          <p className="text-gray-300 mb-6">
            Click the hamburger menu (☰) in the top-left corner to see all available games in the mobile navigation.
          </p>
          
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-left">
            <h3 className="text-lg font-semibold text-white mb-3">Features:</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• All 9 available games listed with emojis and descriptions</li>
              <li>• Current page highlighting</li>
              <li>• Online/offline status indicators</li>
              <li>• PWA install prompt</li>
              <li>• Touch-friendly navigation</li>
              <li>• Smooth animations and transitions</li>
              <li>• Quick actions section</li>
              <li>• User account section</li>
            </ul>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">🧠 Memory Dots</h4>
              <p className="text-gray-400 text-sm">Test your memory skills</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">📦 Box Jump</h4>
              <p className="text-gray-400 text-sm">Jump and avoid obstacles</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">🕐 Clocks</h4>
              <p className="text-gray-400 text-sm">Time-based puzzle game</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">🦘 Doodle Jump</h4>
              <p className="text-gray-400 text-sm">Jump as high as you can</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">⭕ Circle Path</h4>
              <p className="text-gray-400 text-sm">Navigate the circular path</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">💥 Boom Dots</h4>
              <p className="text-gray-400 text-sm">Pop the colorful dots</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}