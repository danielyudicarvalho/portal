'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { 
  SparklesIcon, 
  FireIcon, 
  BoltIcon, 
  TrophyIcon,
  CubeIcon,
  HeartIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/solid';

interface GameCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gameCount: number;
  color: string;
  href: string;
}

interface GameCategoriesProps {
  onCategoryClick?: (category: GameCategory) => void;
}

const GameCategories: React.FC<GameCategoriesProps> = ({ onCategoryClick }) => {
  const categories: GameCategory[] = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Timeless games that never go out of style',
      icon: <SparklesIcon className="h-8 w-8" />,
      gameCount: 8,
      color: 'from-gaming-accent to-orange-500',
      href: '/games/classic'
    },
    {
      id: 'team',
      name: 'Team',
      description: 'Cooperative and competitive team-based games',
      icon: <TrophyIcon className="h-8 w-8" />,
      gameCount: 1,
      color: 'from-gaming-secondary to-blue-500',
      href: '/games/team'
    },
    {
      id: 'survival',
      name: 'Survival',
      description: 'Test your endurance and survival skills',
      icon: <FireIcon className="h-8 w-8" />,
      gameCount: 3,
      color: 'from-red-500 to-pink-500',
      href: '/games/survival'
    },
    {
      id: 'tournament',
      name: 'Tournament',
      description: 'Competitive tournaments and ranked matches',
      icon: <BoltIcon className="h-8 w-8" />,
      gameCount: 1,
      color: 'from-yellow-500 to-gaming-warning',
      href: '/games/tournament'
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-gaming font-bold text-white mb-4">
            Game Categories
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover your favorite games across our diverse collection of gaming categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 animate-slide-up bg-gradient-to-br from-gaming-dark to-gaming-darker border border-gaming-accent/20 shadow-lg rounded-lg hover:shadow-xl"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onCategoryClick?.(category)}
            >
              <div className="text-center p-6 text-gray-600 dark:text-gray-300">
                {/* Icon with Gradient Background */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>

                {/* Category Info */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gaming-accent transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-400 mb-4 text-sm">
                  {category.description}
                </p>

                {/* Game Count */}
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-gradient">
                    {category.gameCount.toLocaleString()}
                  </span>
                  <span className="text-gray-400 ml-2 text-sm">
                    games
                  </span>
                </div>

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-gaming-accent group-hover:text-white group-hover:border-gaming-accent transition-all duration-300"
                >
                  Explore Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="group"
          >
            View All Categories
            <BoltIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GameCategories;