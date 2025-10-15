'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import GameGrid from './GameGrid';
import { Button } from '@/components/ui';
import { Game, GameCategory as GameCategoryType } from '@/types';
import {
  ChevronRightIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface GameCategoryProps {
  category: GameCategoryType;
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  onViewAllClick?: (category: GameCategoryType) => void;
  favoriteGameIds?: string[];
  maxGamesShown?: number;
  showViewAll?: boolean;
  layout?: 'grid' | 'carousel';
  loading?: boolean;
  error?: string;
}

const GameCategory: React.FC<GameCategoryProps> = ({
  category,
  onGameClick,
  onToggleFavorite,
  onViewAllClick,
  favoriteGameIds = [],
  maxGamesShown = 8,
  showViewAll = true,
  layout = 'grid',
  loading = false,
  error
}) => {
  const [showAll, setShowAll] = useState(false);

  const games = category.games || [];
  const displayedGames = showAll ? games : games.slice(0, maxGamesShown);
  const hasMoreGames = games.length > maxGamesShown;

  const handleViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick(category);
    } else {
      setShowAll(true);
    }
  };

  const renderCategoryIcon = () => {
    if (category.icon) {
      // Check if it's an emoji or URL by checking if it starts with http/https or /
      const isUrl = category.icon.startsWith('http') || category.icon.startsWith('/');

      if (!isUrl) {
        // It's an emoji, render as text
        return (
          <span className="text-2xl" role="img" aria-label={category.name}>
            {category.icon}
          </span>
        );
      } else {
        // It's a URL, render as image
        return (
          <Image
            src={category.icon}
            alt={category.name}
            width={24}
            height={24}
            className="h-6 w-6"
          />
        );
      }
    }

    // Default icon based on category name
    return <PlayIcon className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Games Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: maxGamesShown }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-400 font-semibold mb-2">Error Loading {category.name}</h3>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Category Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="text-gaming-accent">
                {renderCategoryIcon()}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-gaming font-bold text-white">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-400 mt-1">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <PlayIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2 text-lg">
                No games available
              </h3>
              <p className="text-gray-400">
                Games in this category are coming soon!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="text-gaming-accent">
              {renderCategoryIcon()}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-gaming font-bold text-white">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-400 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* View All Button */}
          {showViewAll && hasMoreGames && !showAll && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewAllClick}
              className="group self-start md:self-auto"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View All {games.length} Games
              <ChevronRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>

        {/* Games Display */}
        {layout === 'grid' ? (
          <GameGrid
            games={displayedGames}
            onGameClick={onGameClick}
            onToggleFavorite={onToggleFavorite}
            favoriteGameIds={favoriteGameIds}
            columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
            emptyState={{
              title: `No ${category.name.toLowerCase()} games found`,
              description: 'Check back later for new games in this category.'
            }}
          />
        ) : (
          // Carousel layout (simplified for now)
          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4">
              {displayedGames.map((game, index) => (
                <div
                  key={game.id}
                  className="flex-shrink-0 w-64"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* GameCard would be used here with different sizing */}
                  <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden hover:border-gaming-accent/40 transition-colors cursor-pointer">
                    <div className="aspect-video bg-gradient-to-br from-gaming-accent/20 to-gaming-secondary/20">
                      {game.thumbnail ? (
                        <Image
                          src={game.thumbnail}
                          alt={game.title}
                          width={256}
                          height={144}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayIcon className="h-12 w-12 text-white/60" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm mb-1 truncate">
                        {game.title}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        by {game.provider}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show More Button (for expanded view) */}
        {showAll && hasMoreGames && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setShowAll(false)}
            >
              Show Less
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default GameCategory;