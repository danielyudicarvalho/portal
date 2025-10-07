'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  PlayIcon,
  GiftIcon,
  UserCircleIcon,
  WifiIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { InstallPrompt } from '@/components/features/InstallPrompt';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline?: boolean;
  offlineGamesCount?: number;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  isOpen, 
  onClose, 
  isOnline = true,
  offlineGamesCount = 0
}) => {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      current: pathname === '/'
    },
    {
      name: 'All Games',
      href: '/games',
      icon: PlayIcon,
      current: pathname === '/games'
    }
  ];

  // Available games list
  const availableGames = [
    {
      name: 'Memory Dots',
      href: '/games/memdot',
      emoji: '🧠',
      description: 'Test your memory skills',
      current: pathname === '/games/memdot'
    },
    {
      name: 'Box Jump',
      href: '/games/box-jump',
      emoji: '📦',
      description: 'Jump and avoid obstacles',
      current: pathname === '/games/box-jump'
    },
    {
      name: 'Clocks',
      href: '/games/clocks',
      emoji: '🕐',
      description: 'Time-based puzzle game',
      current: pathname === '/games/clocks'
    },
    {
      name: 'Doodle Jump',
      href: '/games/doodle-jump',
      emoji: '🦘',
      description: 'Jump as high as you can',
      current: pathname === '/games/doodle-jump'
    },
    {
      name: 'Circle Path',
      href: '/games/circle-path',
      emoji: '⭕',
      description: 'Navigate the circular path',
      current: pathname === '/games/circle-path'
    },
    {
      name: 'Boom Dots',
      href: '/games/boom-dots',
      emoji: '💥',
      description: 'Pop the colorful dots',
      current: pathname === '/games/boom-dots'
    },
    {
      name: 'Endless Scale',
      href: '/games/endless-scale',
      emoji: '⚖️',
      description: 'Balance and scale endlessly',
      current: pathname === '/games/endless-scale'
    },
    {
      name: 'Fill The Holes',
      href: '/games/fill-the-holes',
      emoji: '🕳️',
      description: 'Fill all the holes to win',
      current: pathname === '/games/fill-the-holes'
    },
    {
      name: '123 Game',
      href: '/games/123',
      emoji: '🔢',
      description: 'Number sequence game',
      current: pathname === '/games/123'
    },
    {
      name: 'Perfect Square',
      href: '/games/perfect-square',
      emoji: '🟦',
      description: 'Time-based puzzle game',
      current: pathname === '/games/perfect-square'
    },
    {
      name: 'The Battle',
      href: '/games/the-battle',
      emoji: '⚔️',
      description: 'Multiplayer tank battle',
      current: pathname === '/games/the-battle'
    }
  ];

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Only render menu when open */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          {/* Mobile Navigation Panel */}
          <div 
            className="fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-80 max-w-full bg-gaming-dark border-r border-gaming-accent/20 shadow-2xl"
          >
        <div className="flex flex-col h-full">

          {/* Connection Status */}
          <div className="px-4 py-3 border-b border-gaming-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <WifiIcon className={clsx(
                  "h-4 w-4",
                  isOnline ? "text-green-400" : "text-red-400"
                )} />
                <span className="text-sm text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {!isOnline && offlineGamesCount > 0 && (
                <span className="text-xs bg-gaming-accent/20 text-gaming-accent px-2 py-1 rounded-full">
                  {offlineGamesCount} offline games
                </span>
              )}
            </div>
          </div>

          {/* PWA Install Prompt */}
          <div className="px-4 py-3 border-b border-gaming-accent/20">
            <InstallPrompt 
              variant="banner" 
              className="w-full"
              showDismiss={false}
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scroll-smooth-mobile">
            {/* Main Navigation */}
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    'flex items-center px-4 py-4 text-base font-medium rounded-lg transition-colors tap-target touch-manipulation',
                    item.current
                      ? 'bg-gaming-accent text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30'
                  )}
                >
                  <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gaming-accent/20"></div>

            {/* Available Games */}
            <div className="space-y-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Available Games
              </h3>
              
              {availableGames.map((game) => (
                <Link
                  key={game.href}
                  href={game.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    'flex items-center px-4 py-3 text-sm rounded-lg transition-colors tap-target touch-manipulation',
                    game.current
                      ? 'bg-gaming-accent text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30'
                  )}
                >
                  <span className="text-lg mr-3 flex-shrink-0">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{game.name}</div>
                    <div className="text-xs opacity-75 truncate">{game.description}</div>
                  </div>
                  {!isOnline && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                      Offline
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Multiplayer Games */}
            <div className="space-y-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Multiplayer Games
              </h3>
              
              <Link
                href="/games/the-battle"
                onClick={handleLinkClick}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm rounded-lg transition-colors tap-target touch-manipulation',
                  pathname === '/games/the-battle'
                    ? 'bg-gaming-accent text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30'
                )}
              >
                <span className="text-lg mr-3 flex-shrink-0">⚔️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">The Battle</div>
                  <div className="text-xs opacity-75 truncate">Real-time tank combat</div>
                </div>
                <span className="ml-2 text-xs bg-gaming-accent/20 text-gaming-accent px-2 py-1 rounded-full">
                  Multiplayer
                </span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mt-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              
              <Link
                href="/games"
                onClick={handleLinkClick}
                className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30 rounded-lg transition-colors tap-target touch-manipulation"
              >
                <PlayIcon className="h-4 w-4 mr-3" />
                Browse All Games
              </Link>
              
              <Link
                href="/games/multiplayer"
                onClick={handleLinkClick}
                className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30 rounded-lg transition-colors tap-target touch-manipulation"
              >
                <UsersIcon className="h-4 w-4 mr-3" />
                Multiplayer Games
              </Link>
              
              <Link
                href="/favorites"
                onClick={handleLinkClick}
                className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30 rounded-lg transition-colors tap-target touch-manipulation"
              >
                <GiftIcon className="h-4 w-4 mr-3" />
                My Favorites
              </Link>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gaming-accent/20">
            {/* User Profile Link */}
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gaming-accent/20 active:bg-gaming-accent/30 rounded-lg transition-colors mb-4 tap-target touch-manipulation"
            >
              <UserCircleIcon className="mr-4 h-6 w-6 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">My Account</div>
                <div className="text-xs text-gray-400">View profile & settings</div>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleLinkClick}
                className="w-full px-4 py-3 text-sm font-medium text-gaming-accent border border-gaming-accent rounded-lg hover:bg-gaming-accent hover:text-white active:bg-gaming-accent/90 transition-colors tap-target touch-manipulation"
              >
                Login
              </button>
              <button
                onClick={handleLinkClick}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gaming-accent hover:bg-gaming-accent/90 active:bg-gaming-accent/80 rounded-lg transition-colors tap-target touch-manipulation"
              >
                Sign Up
              </button>
            </div>

            {/* Promotional Banner */}
            <div className="mt-4 bg-gradient-to-r from-gaming-accent/20 to-gaming-secondary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-1">
                Welcome Bonus
              </h4>
              <p className="text-xs text-gray-300 mb-2">
                Get 100% bonus on your first deposit!
              </p>
              <button
                onClick={handleLinkClick}
                className="w-full px-3 py-2 bg-gaming-accent hover:bg-gaming-accent/90 active:bg-gaming-accent/80 text-white text-xs rounded transition-colors tap-target touch-manipulation"
              >
                Claim Now
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
};

export default MobileNav;
