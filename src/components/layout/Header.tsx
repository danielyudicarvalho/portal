'use client';

import React, { useState } from 'react';
import { useMobileMenuContext } from './MobileMenuContext';
import Link from 'next/link';
import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useSession, signIn, signOut } from 'next-auth/react';
import { BalanceSection } from './BalanceSection';
import CreditBalance from '../features/CreditBalance';

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
  const pathname = usePathname();

  const navigation = [
    { name: 'Championship', href: '/games/championship', icon: null },
    { name: 'Survival', href: '/games/survival', icon: null },
    { name: 'Team', href: '/games/team', icon: null },
    { name: 'Tournament', href: '/games/tournament', icon: null },
    { name: 'Credits', href: '/credits', icon: null },
    { name: 'PESQUISA', href: '/search', icon: <MagnifyingGlassIcon className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gaming-dark/90 backdrop-blur supports-[backdrop-filter]:bg-gaming-dark/80 border-b border-gaming-accent/20 shadow-[0_1px_0_0_rgba(255,107,53,0.08)] relative">
      {/* ambient gradient wash */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-70">
        <div className="absolute -top-16 left-1/4 w-80 h-80 bg-gaming-secondary/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 right-1/3 w-96 h-96 bg-gaming-accent/10 blur-3xl rounded-full" />
      </div>
      <div className="max-w-full mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Menu + Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                if (onMobileMenuToggle) {
                  onMobileMenuToggle();
                  return;
                }
                mobileMenu?.toggle?.();
              }}
              className="p-2 text-gray-300 hover:text-white hover:bg-gaming-accent/10 rounded-md transition-colors"
              type="button"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <FireIcon className="h-8 w-8 text-gaming-accent" />
              <span className="text-white font-bold text-xl tracking-tight">blaze</span>
            </Link>
          </div>

          {/* Center Section: Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname?.startsWith(item.href)
                    ? 'text-white bg-gaming-accent/15 ring-1 ring-inset ring-gaming-accent/30'
                    : 'text-gray-300 hover:text-white hover:bg-gaming-accent/10'
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section: User Controls */}
          <div className="flex items-center space-x-3">
            {status === 'authenticated' ? (
              <>
                {/* Language Selector */}
                <button className="flex items-center space-x-1 text-gray-300 hover:text-white hover:bg-gaming-accent/10 px-2 py-1 text-sm rounded-md">
                  <span>🇧🇷</span>
                  <span>Português</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-300 hover:text-white hover:bg-gaming-accent/10 rounded-md relative">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gaming-accent rounded-full"></span>
                </button>

                {/* User Avatar */}
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gaming-accent/10 rounded-md px-2 py-1">
                  <div className="w-8 h-8 bg-gaming-accent/20 border border-gaming-accent/30 rounded-full flex items-center justify-center">
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
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {/* Credit Balance */}
                <div className="hidden md:flex">
                  <CreditBalance 
                    showPurchaseButton={false}
                  />
                </div>

                {/* Buy Credits Button */}
                <Link href="/credits">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-gaming-accent hover:bg-gaming-accent/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-gaming-accent/30"
                  >
                    Buy Credits
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gaming-accent border border-gaming-accent/60 hover:bg-gaming-accent hover:text-white px-4 py-2 text-sm rounded-md transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    signIn();
                  }}
                >
                  Login
                </Button>

                {/* Register Button */}
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-gaming-accent hover:bg-gaming-accent/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-gaming-accent/30"
                  onClick={(e) => {
                    e.preventDefault();
                    signIn();
                  }}
                >
                  Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-gaming-accent/20">
        <nav className="px-4 py-3 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname?.startsWith(item.href)
                  ? 'text-white bg-gaming-accent/15 ring-1 ring-inset ring-gaming-accent/30'
                  : 'text-gray-300 hover:text-white hover:bg-gaming-accent/10'
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
