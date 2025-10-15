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
    <header className="sticky top-0 z-40 bg-gaming-dark/95 backdrop-blur-sm border-b border-gaming-accent/20">
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

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gaming-accent/20 rounded-md transition-colors touch-manipulation tap-target">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {status !== 'authenticated' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden xs:inline-flex text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-manipulation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Open NextAuth default sign-in page with available providers (Google, Discord, Email)
                      signIn();
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-manipulation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // You can target a specific provider, e.g. signIn('google')
                      signIn();
                    }}
                  >
                    <span className="hidden xs:inline">Sign Up</span>
                    <span className="xs:hidden">Join</span>
                  </Button>
                </>
              )}
              {status === 'authenticated' && (
                <>
                  <span className="hidden sm:inline text-gray-300 text-sm mr-1">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-manipulation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    Sign out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-3 sm:px-4 pb-3">
        <Input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          className="bg-gaming-darker/50 border-gaming-accent/30 text-white placeholder:text-gray-400 text-sm touch-manipulation"
        />
      </div>
    </header>
  );
};

export default Header;
