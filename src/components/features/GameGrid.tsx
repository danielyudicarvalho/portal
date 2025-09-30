'use client';

import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';
import { Button } from '@/components/ui';
import { Game } from '@/types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface GameGridProps {
  games: Game[];
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  favoriteGameIds?: string[];
  loading?: boolean;
  error?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    showLoadMore?: boolean;
  };
  infiniteScroll?: {
    enabled: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
  };
  emptyState?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
}

const GameGrid: React.FC<GameGridProps> = ({
  games,
  onGameClick,
  onToggleFavorite,
  favoriteGameIds = [],
  loading = false,
  error,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  pagination = { enabled: false, pageSize: 12 },
  infiniteScroll = { enabled: false },
  emptyState = {
    title: 'No games found',
    description: 'Try adjusting your filters or search terms.'
  }
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedGames, setDisplayedGames] = useState<Game[]>([]);

  // Handle pagination
  useEffect(() => {
    if (pagination.enabled && pagination.pageSize) {
      const startIndex = (currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      setDisplayedGames(games.slice(0, endIndex));
    } else {
      setDisplayedGames(games);
    }
  }, [games, currentPage, pagination.enabled, pagination.pageSize]);

  // Handle infinite scroll
  useEffect(() => {
    if (!infiniteScroll.enabled) return;

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (infiniteScroll.hasMore && !infiniteScroll.loading) {
          infiniteScroll.onLoadMore?.();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [infiniteScroll]);

  const getGridClasses = () => {
    const baseClasses = 'grid gap-3 xs:gap-4 sm:gap-6';
    const columnClasses = [
      columns.sm && `grid-cols-${columns.sm}`,
      columns.md && `xs:grid-cols-${columns.md}`,
      columns.lg && `sm:grid-cols-${columns.lg}`,
      columns.xl && `md:grid-cols-${columns.xl}`
    ].filter(Boolean).join(' ');
    
    return `${baseClasses} ${columnClasses}`;
  };

  const totalPages = pagination.enabled && pagination.pageSize 
    ? Math.ceil(games.length / pagination.pageSize) 
    : 1;

  const handleLoadMore = () => {
    if (pagination.enabled && pagination.pageSize) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className={getGridClasses()}>
          {Array.from({ length: pagination.pageSize || 12 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-700"></div>
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="h-3 sm:h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 sm:h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Games</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (games.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="max-w-md mx-auto px-4">
          <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">
            {emptyState.title}
          </h3>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            {emptyState.description}
          </p>
          {emptyState.action}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Games Grid */}
      <div className={getGridClasses()}>
        {displayedGames.map((game, index) => (
          <div 
            key={game.id}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 12) * 0.05}s` }}
          >
            <GameCard
              game={game}
              onGameClick={onGameClick}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteGameIds.includes(game.id)}
            />
          </div>
        ))}
      </div>

      {/* Infinite Scroll Loading */}
      {infiniteScroll.enabled && infiniteScroll.loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center text-gaming-accent">
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            Loading more games...
          </div>
        </div>
      )}

      {/* Load More Button */}
      {pagination.enabled && pagination.showLoadMore && currentPage < totalPages && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleLoadMore}
            className="group"
          >
            Load More Games
            <ChevronRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}

      {/* Pagination */}
      {pagination.enabled && !pagination.showLoadMore && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            const isActive = page === currentPage;
            
            return (
              <Button
                key={page}
                variant={isActive ? "primary" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={isActive ? "bg-gaming-accent text-white" : ""}
              >
                {page}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameGrid;