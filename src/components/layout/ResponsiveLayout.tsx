'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Footer from './Footer';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close mobile menu on resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setIsMobileMenuOpen(false);
          setIsSidebarOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (isMobileMenuOpen || isSidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobileMenuOpen, isSidebarOpen]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => {
      const next = !prev;
      setIsSidebarOpen(next);
      return next;
    });
  };

  // const handleSidebarToggle = () => {
  //   setIsSidebarOpen(!isSidebarOpen);
  // };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsSidebarOpen(false);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
      {/* Header */}
      <Header 
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <Sidebar 
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] ${showSidebar ? 'lg:ml-0' : ''}`}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default ResponsiveLayout;
