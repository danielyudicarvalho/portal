'use client';

import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SimpleMenuTest() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    console.log('toggleMenu called, current state:', isMenuOpen);
    setIsMenuOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gaming-dark/95 backdrop-blur-sm border-b border-gaming-accent/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-3 rounded-md text-gray-300 hover:text-white hover:bg-gaming-accent/20 transition-colors border border-gaming-accent/50"
              type="button"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            {/* Debug Info */}
            <div className="text-white text-sm">
              Menu: {isMenuOpen ? 'OPEN' : 'CLOSED'}
            </div>

            <div className="text-white font-bold">Simple Menu Test</div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 
        transform bg-gaming-dark border-r border-gaming-accent/20 
        transition-transform duration-300 ease-in-out md:hidden
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            Sidebar Status: {isMenuOpen ? 'VISIBLE' : 'HIDDEN'}
          </div>
          
          <nav className="space-y-2">
            <a href="/" className="block p-2 text-white bg-gaming-accent/20 rounded">Home</a>
            <a href="/games" className="block p-2 text-white bg-gaming-accent/20 rounded">Games</a>
            <a href="/promotions" className="block p-2 text-white bg-gaming-accent/20 rounded">Promotions</a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Simple Mobile Menu Test</h1>
        <p className="text-gray-300 mb-4">
          This is a simplified test to verify the mobile menu functionality works.
        </p>
        
        <div className="bg-gaming-accent/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Test Results:</h2>
          <ul className="text-gray-300 space-y-1">
            <li>• Menu State: <span className="text-gaming-accent font-bold">{isMenuOpen ? 'OPEN' : 'CLOSED'}</span></li>
            <li>• Click the hamburger button (☰) in the top-left to test</li>
            <li>• The sidebar should slide in from the left when opened</li>
            <li>• Click outside the sidebar or on the overlay to close it</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
