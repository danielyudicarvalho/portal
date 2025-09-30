'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { usePWA } from '@/components/providers/PWAProvider';
import { MobileMenuProvider, useMobileMenu } from './MobileMenuContext';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

const LayoutContent: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true,
}) => {
  const { isOnline, offlineGamesCount } = usePWA();
  const { isOpen, toggle, close } = useMobileMenu();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker scroll-smooth-mobile">
      {/* Header */}
      <Header
        onMobileMenuToggle={toggle}
        isMobileMenuOpen={isOpen}
      />

      <div className="flex">
        {/* Sidebar - Handles both desktop and mobile */}
        {showSidebar && (
          <Sidebar
            isOpen={isOpen}
            onClose={close}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-0' : ''}`}>
          <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Mobile Navigation Panel */}
      {showSidebar && (
        <MobileNav
          isOpen={isOpen}
          onClose={close}
          isOnline={isOnline}
          offlineGamesCount={offlineGamesCount}
        />
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = (props) => (
  <MobileMenuProvider>
    <LayoutContent {...props} />
  </MobileMenuProvider>
);

export default Layout;
