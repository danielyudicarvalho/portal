'use client';

import React, { useState } from 'react';
import { useMobileMenuContext } from './MobileMenuContext';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useSession, signIn, signOut } from 'next-auth/react';
import { BalanceSection } from './BalanceSection';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const mobileMenu = useMobileMenuContext();
  const isMenuOpen = typeof isMobileMenuOpen === 'boolean'
    ? isMobileMenuOpen
    : mobileMenu?.isOpen ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { data: session, status } = useSession();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Casino', href: '/games/casino' },
    { name: 'Sports', href: '/games/sports' },
    { name: 'Live', href: '/games/live' },
    { name: 'Promotions', href: '/promotions' },
  ];

  return (
    <header className="sticky top-0 z-40 header-glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={() => {
                if (onMobileMenuToggle) {
                  onMobileMenuToggle();
                  return;
                }

                mobileMenu?.toggle?.();
              }}
              className="lg:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gaming-accent/20 transition-colors"
              type="button"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>



            <Link href="/" className="flex items-center ml-1 sm:ml-2 lg:ml-0 touch-manipulation">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gaming-accent to-gaming-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base sm:text-lg">G</span>
                </div>
                <span className="text-white font-gaming font-bold text-lg sm:text-xl hidden xs:block">
                  GamePortal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white hover:bg-gaming-accent/20 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                className={clsx(
                  'bg-gaming-darker/50 border-gaming-accent/30 text-white placeholder:text-gray-400',
                  isSearchFocused && 'ring-gaming-accent/50 border-gaming-accent'
                )}
              />
            </div>
          </div>

          {/* Balance Section and Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gaming-accent/20 rounded-lg transition-all duration-200 touch-manipulation tap-target">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Balance Section - Only show when authenticated */}
            {status === 'authenticated' && (
              <BalanceSection className="hidden sm:flex" />
            )}

            {/* Auth Section */}
            <div className="flex items-center space-x-2">
              {status !== 'authenticated' && (
                <div className="auth-container flex items-center space-x-2 rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden xs:inline-flex text-xs sm:text-sm px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 touch-manipulation border-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      signIn();
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Login</span>
                    </span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs sm:text-sm px-4 py-2 bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-gaming-accent/30 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      signIn();
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span className="hidden xs:inline">Cadastrar</span>
                      <span className="xs:hidden">Join</span>
                    </span>
                  </Button>
                </div>
              )}
              
              {status === 'authenticated' && (
                <div className="flex items-center space-x-3">
                  {/* User Info */}
                  <div className="auth-container hidden lg:flex items-center space-x-2 rounded-xl px-3 py-2">
                    <div className="user-avatar w-8 h-8 rounded-full flex items-center justify-center">
                      {session?.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm font-medium max-w-[120px] truncate">
                      {session?.user?.name || session?.user?.email}
                    </span>
                  </div>

                  {/* Sign Out Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-3 py-2 border-gray-600/50 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 rounded-lg transition-all duration-200 touch-manipulation group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Sair</span>
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar and Balance */}
      <div className="md:hidden px-3 sm:px-4 pb-3 space-y-3">
        <Input
          type="text"
          placeholder="Buscar jogos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          className="bg-gaming-darker/50 border-gaming-accent/30 text-white placeholder:text-gray-400 text-sm touch-manipulation"
        />
        
        {/* Mobile Balance Section */}
        {status === 'authenticated' && (
          <div className="sm:hidden">
            <BalanceSection />
          </div>
        )}

        {/* Mobile Auth Section */}
        {status !== 'authenticated' && (
          <div className="sm:hidden flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-sm px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 touch-manipulation border border-gray-600/30"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                signIn();
              }}
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1 text-sm px-4 py-3 bg-gradient-to-r from-gaming-accent to-gaming-secondary hover:from-gaming-accent/90 hover:to-gaming-secondary/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-gaming-accent/30 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                signIn();
              }}
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Cadastrar</span>
              </span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
