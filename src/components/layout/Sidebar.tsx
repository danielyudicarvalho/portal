'use client';

import React, { useState } from 'react';
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
  ListBulletIcon,
  UsersIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['championship']);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const gameCategories = [
    {
      id: 'championship',
      name: 'CHAMPIONSHIP',
      isExpandable: true,
      games: [
        { name: 'Memdot', href: '/games/memdot' },
        { name: 'Fill the Holes', href: '/games/fill-the-holes' },
        { name: 'Clocks', href: '/games/clocks' },
        { name: '123', href: '/games/123' },
        { name: 'Perfect Square', href: '/games/perfect-square' },
        { name: 'Circle Path', href: '/games/circle-path' },
      ]
    },
    {
      id: 'survival',
      name: 'SURVIVAL',
      isExpandable: true,
      games: [
        { name: 'Endless Runner', href: '/games/survival/endless' },
        { name: 'Battle Royale', href: '/games/survival/battle-royale' },
        { name: 'Last Stand', href: '/games/survival/last-stand' },
        { name: 'Boom Dots', href: '/games/boom-dots' },
        { name: 'Doodle Jump', href: '/games/doodle-jump' },
      ]
    },
    {
      id: 'team',
      name: 'TEAM',
      isExpandable: true,
      games: [
        { name: 'The Battle', href: '/games/the-battle' },
        { name: 'Cooperative', href: '/games/team/cooperative' },
        { name: 'Competitive', href: '/games/team/competitive' },
        { name: 'Battle Arena', href: '/games/team/battle' },
        { name: 'Box Jump', href: '/games/box-jump' },
      ]
    },
    {
      id: 'tournament',
      name: 'TOURNAMENT',
      isExpandable: true,
      games: [
        { name: 'Ranked Matches', href: '/games/tournament/ranked' },
        { name: 'Championships', href: '/games/tournament/championships' },
        { name: 'Leaderboards', href: '/games/tournament/leaderboards' },
        { name: 'Weekly Tournaments', href: '/games/tournament/weekly' },
      ]
    }
  ];

  const supportLinks = [
    {
      name: 'Suporte Ao Vivo',
      href: '/support/live',
      icon: ChatBubbleLeftRightIcon,
      current: pathname === '/support/live'
    },
    {
      name: 'Promoções',
      href: '/promotions',
      icon: GiftIcon,
      current: pathname === '/promotions'
    },
    {
      name: 'Patrocínios',
      href: '/sponsorships',
      icon: StarIcon,
      current: pathname === '/sponsorships'
    },
    {
      name: 'Central De Apoio',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      current: pathname === '/help'
    },
    {
      name: 'Blog',
      href: '/blog',
      icon: NewspaperIcon,
      current: pathname === '/blog'
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
        'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-80 transform bg-gaming-dark/95 backdrop-blur-sm border-r border-gaming-accent/20 transition-transform duration-300 ease-in-out shadow-[0_0_0_1px_rgba(255,107,53,0.06)] relative',
        // Stick on desktop (lg and up) while remaining in layout flow
        'lg:translate-x-0 lg:sticky lg:top-16',
        // On mobile, controlled by isOpen prop
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* ambient gradient wash for the gaming vibe */}
        <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-gaming-secondary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-gaming-accent/10 blur-3xl" />
        </div>

        <div className="flex flex-col h-full relative">
          {/* Navigation */}
          <nav className="flex-1 px-0 py-0 overflow-y-auto">
            {/* Game Categories */}
            <div className="space-y-0">
              {gameCategories.map((category) => (
                <div key={category.id} className="border-b border-gaming-accent/15">
                  {category.isExpandable ? (
                    <>
                      <button
                        onClick={() => toggleSection(category.id)}
                        className="w-full flex items-center justify-between px-6 py-3 text-left text-gray-300 hover:text-white hover:bg-gaming-accent/10 transition-colors rounded-lg"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                          {category.name}
                        </span>
                        {expandedSections.includes(category.id) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gaming-accent/80" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gaming-accent/80" />
                        )}
                      </button>
                      
                      {expandedSections.includes(category.id) && (
                        <div className="bg-transparent">
                          {category.games.map((game) => (
                            <Link
                              key={game.name}
                              href={game.href}
                              onClick={handleLinkClick}
                              className={clsx(
                                'block px-8 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gaming-accent/10 transition-colors border-l-2 border-transparent hover:border-gaming-accent',
                                pathname === game.href && 'text-white bg-gaming-accent/15 border-gaming-accent'
                              )}
                            >
                              {game.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/games/${category.id}`}
                      onClick={handleLinkClick}
                      className="block px-6 py-3 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gaming-accent/10 transition-colors uppercase tracking-wider rounded-lg"
                    >
                      {category.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Support Links */}
            <div className="mt-6 space-y-0">
              {supportLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    'flex items-center px-6 py-3 text-sm text-gray-300 hover:text-white hover:bg-gaming-accent/10 transition-colors rounded-lg',
                    item.current && 'text-white bg-gaming-accent/15 border-l-2 border-gaming-accent'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gaming-accent/80" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>


        </div>
      </aside>
    </>
  );
};

export default Sidebar;
