'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  SparklesIcon,
  TrophyIcon,
  PlayIcon,
  GiftIcon,
  StarIcon,
  FireIcon,
  ClockIcon,
  PuzzlePieceIcon,
  CommandLineIcon,
  NumberedListIcon,
  UsersIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
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
    },
    {
      name: 'Classic Games',
      href: '/games/classic',
      icon: SparklesIcon,
      current: pathname.startsWith('/games/classic'),
      children: [
        { name: 'Puzzle Games', href: '/games/classic/puzzle' },
        { name: 'Memory Games', href: '/games/classic/memory' },
        { name: 'Arcade Games', href: '/games/classic/arcade' },
      ]
    },
    {
      name: 'Team Games',
      href: '/games/team',
      icon: TrophyIcon,
      current: pathname.startsWith('/games/team'),
      children: [
        { name: 'Cooperative', href: '/games/team/cooperative' },
        { name: 'Competitive', href: '/games/team/competitive' },
        { name: 'Battle Arena', href: '/games/team/battle' },
      ]
    },
    {
      name: 'Survival Games',
      href: '/games/survival',
      icon: FireIcon,
      current: pathname.startsWith('/games/survival'),
      children: [
        { name: 'Endless Runner', href: '/games/survival/endless' },
        { name: 'Battle Royale', href: '/games/survival/battle-royale' },
        { name: 'Last Stand', href: '/games/survival/last-stand' },
      ]
    },
    {
      name: 'Tournament',
      href: '/games/tournament',
      icon: BoltIcon,
      current: pathname.startsWith('/games/tournament'),
      children: [
        { name: 'Ranked Matches', href: '/games/tournament/ranked' },
        { name: 'Championships', href: '/games/tournament/championships' },
        { name: 'Leaderboards', href: '/games/tournament/leaderboards' },
      ]
    },
    {
      name: 'Live Games',
      href: '/games/live',
      icon: PlayIcon,
      current: pathname.startsWith('/games/live')
    },
    {
      name: 'Memory Games',
      href: '/games',
      icon: PuzzlePieceIcon,
      current: pathname.startsWith('/games/memdot'),
      children: [
        { name: 'Memdot', href: '/games/memdot' },
      ]
    },
    {
      name: 'Puzzle Games',
      href: '/games',
      icon: PuzzlePieceIcon,
      current: pathname.startsWith('/games/fill-the-holes') || pathname.startsWith('/games/clocks') || pathname.startsWith('/games/123') || pathname.startsWith('/games/perfect-square'),
      children: [
        { name: 'Fill the Holes', href: '/games/fill-the-holes' },
        { name: 'Clocks', href: '/games/clocks' },
        { name: '123', href: '/games/123' },
        { name: 'Perfect Square', href: '/games/perfect-square' },
      ]
    },
    {
      name: 'Arcade Games',
      href: '/games',
      icon: CommandLineIcon,
      current: pathname.startsWith('/games/circle-path') || pathname.startsWith('/games/box-jump') || pathname.startsWith('/games/boom-dots') || pathname.startsWith('/games/doodle-jump'),
      children: [
        { name: 'Circle Path', href: '/games/circle-path' },
        { name: 'Box Jump', href: '/games/box-jump' },
        { name: 'Boom Dots', href: '/games/boom-dots' },
        { name: 'Doodle Jump', href: '/games/doodle-jump' },
      ]
    },
    {
      name: 'Multiplayer Games',
      href: '/games/multiplayer',
      icon: UsersIcon,
      current: pathname.startsWith('/games/multiplayer') || pathname.startsWith('/games/the-battle'),
      children: [
        { name: 'The Battle', href: '/games/the-battle' },
      ]
    },
    {
      name: 'Promotions',
      href: '/promotions',
      icon: GiftIcon,
      current: pathname.startsWith('/promotions')
    }
  ];

  const quickLinks = [
    {
      name: 'Memdot',
      href: '/games/memdot',
      icon: PuzzlePieceIcon,
      current: pathname === '/games/memdot'
    },
    {
      name: 'Fill the Holes',
      href: '/games/fill-the-holes',
      icon: PuzzlePieceIcon,
      current: pathname === '/games/fill-the-holes'
    },
    {
      name: 'Clocks',
      href: '/games/clocks',
      icon: ClockIcon,
      current: pathname === '/games/clocks'
    },
    {
      name: 'Circle Path',
      href: '/games/circle-path',
      icon: CommandLineIcon,
      current: pathname === '/games/circle-path'
    },
    {
      name: 'Box Jump',
      href: '/games/box-jump',
      icon: CommandLineIcon,
      current: pathname === '/games/box-jump'
    },
    {
      name: 'Boom Dots',
      href: '/games/boom-dots',
      icon: CommandLineIcon,
      current: pathname === '/games/boom-dots'
    },
    {
      name: '123',
      href: '/games/123',
      icon: NumberedListIcon,
      current: pathname === '/games/123'
    },
    {
      name: 'Doodle Jump',
      href: '/games/doodle-jump',
      icon: CommandLineIcon,
      current: pathname === '/games/doodle-jump'
    },
    {
      name: 'Perfect Square',
      href: '/games/perfect-square',
      icon: PuzzlePieceIcon,
      current: pathname === '/games/perfect-square'
    },
    {
      name: 'The Battle',
      href: '/games/the-battle',
      icon: UsersIcon,
      current: pathname === '/games/the-battle'
    },
    {
      name: 'Popular',
      href: '/games/popular',
      icon: StarIcon,
      current: pathname === '/games/popular'
    },
    {
      name: 'Hot Games',
      href: '/games/hot',
      icon: FireIcon,
      current: pathname === '/games/hot'
    },
    {
      name: 'New Releases',
      href: '/games/new',
      icon: ClockIcon,
      current: pathname === '/games/new'
    }
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-14 sm:top-16 left-0 z-30 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 transform bg-gaming-dark border-r border-gaming-accent/20 transition-transform duration-300 ease-in-out',
        // Always visible on desktop (lg and up)
        'lg:translate-x-0 lg:static lg:inset-0',
        // On mobile, controlled by isOpen prop
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      item.current
                        ? 'bg-gaming-accent text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gaming-accent/20'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                  
                  {/* Sub-navigation */}
                  {item.children && item.current && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={handleLinkClick}
                          className="block px-3 py-1 text-sm text-gray-400 hover:text-gaming-accent transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gaming-accent/20 my-4"></div>

            {/* Quick Links */}
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Access
              </h3>
              {quickLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    item.current
                      ? 'bg-gaming-accent text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gaming-accent/20'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gaming-accent/20">
            <div className="bg-gradient-to-r from-gaming-accent/20 to-gaming-secondary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-1">
                Welcome Bonus
              </h4>
              <p className="text-xs text-gray-300 mb-2">
                Get 100% bonus on your first deposit!
              </p>
              <button className="w-full px-3 py-1 bg-gaming-accent hover:bg-gaming-accent/90 text-white text-xs rounded transition-colors">
                Claim Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;