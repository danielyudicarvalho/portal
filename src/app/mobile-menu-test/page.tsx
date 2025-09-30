'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout';

export default function MobileMenuTest() {
  const [clicks, setClicks] = useState(0);

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Mobile Menu Test</h1>
        <p className="text-gray-300 mb-4">
          This page tests the mobile hamburger menu functionality.
        </p>
        
        {/* Test button to verify clicks work */}
        <button 
          onClick={() => setClicks(c => c + 1)}
          className="mb-4 px-4 py-2 bg-gaming-accent text-white rounded-lg md:hidden touch-manipulation"
        >
          Test Button (Clicked: {clicks})
        </button>
        
        <div className="bg-gaming-accent/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">How to Test:</h2>
          <ol className="text-gray-300 space-y-1 text-sm">
            <li>1. <strong>Resize your browser to mobile width</strong> (or use mobile device)</li>
            <li>2. <strong>Look for the hamburger icon</strong> (three lines ☰) in the top-left</li>
            <li>3. <strong>Click the hamburger icon</strong> to open the sidebar menu</li>
            <li>4. <strong>Sidebar should slide in</strong> from the left with navigation items</li>
            <li>5. <strong>Click outside the menu</strong> or the X icon to close it</li>
          </ol>
          
          <div className="mt-4 p-3 bg-gaming-dark rounded">
            <h3 className="text-white font-medium mb-2">Status Check:</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                • Test button works: <span className="text-gaming-accent">{clicks > 0 ? 'YES' : 'Click the test button above'}</span>
              </p>
              <p className="text-gray-300">
                • Mobile breakpoint: <span className="text-gaming-accent md:hidden">MOBILE</span><span className="text-gaming-accent hidden md:inline">DESKTOP</span>
              </p>
              <p className="text-gray-300 md:hidden">
                • Hamburger menu should be visible in header
              </p>
              <p className="text-gray-300 hidden md:block">
                • Switch to mobile view to see the hamburger menu
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gaming-secondary/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Expected Behavior:</h3>
          <ul className="text-gray-300 space-y-1 text-sm">
            <li>✓ Hamburger icon appears only on mobile (screen width &lt; 768px)</li>
            <li>✓ Clicking hamburger opens sidebar from left</li>
            <li>✓ Sidebar contains navigation menu items</li>
            <li>✓ Clicking outside sidebar closes it</li>
            <li>✓ X icon appears in hamburger button when menu is open</li>
            <li>✓ Sidebar prevents body scrolling when open</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
