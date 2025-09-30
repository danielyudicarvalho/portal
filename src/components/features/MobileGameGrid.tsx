'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Game } from '@/types';
import MobileGameCard from './MobileGameCard';
import { Button } from '@/components/ui';
import { 
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface MobileGameGridProps {
  games: Game[];
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  favoriteGameIds?: string[];
  offlineGameIds?: string[];
  loading?: boolean;
  error?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: Array<{ id: string; name: string; }>;
  emptyState?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
}

const MobileGameGrid: React.FC<MobileGameGridProps> = ({
  games,
  onGameClick,
  onToggleFavorite,
  favoriteGameIds = [],
  offlineGameIds = [],
  loading = false,
  error,
  onLoadMore,
  hasMore = false,
  searchQuery = '',
  onSearchChange,
  selectedCategory = '',
  onCategoryChange,
  categories = [],
  emptyState = {
    title: 'No games found',
    description: 'Try adjusting your search or filters.'
  }
}) => {
  const [displayedGames, setDisplayedGames] = useState<Game[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Handle infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onLoadMore) return;
    
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, hasMore, onLoadMore]);

  // Update displayed games
  useEffect(() => {
    setDisplayedGames(games);
  }, [games]);

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange?.(value);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange?.(categoryId);
    setShowFilters(false);
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden">
            <div className="aspect-[4/3] bg-gray-700"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-sm mx-auto">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Games</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="tap-target touch-manipulation"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && displayedGames.length === 0) {
    return renderLoadingSkeleton();
  }

  // Empty state
  if (displayedGames.length === 0 && !loading) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-sm mx-auto">
          <h3 className="text-white font-semibold mb-2 text-lg">
            {emptyState.title}
          </h3>
          <p className="text-gray-400 mb-6 text-sm">
            {emptyState.description}
          </p>
          {emptyState.action}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="sticky top-16 z-30 bg-gaming-dark/95 backdrop-blur-sm border-b border-gaming-accent/20 px-4 py-3">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gaming-darker border border-gaming-accent/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gaming-accent/40 touch-manipulation"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors tap-target touch-manipulation ${
              showFilters || selectedCategory
                ? 'bg-gaming-accent border-gaming-accent text-white'
                : 'bg-gaming-darker border-gaming-accent/20 text-gray-400 hover:text-white hover:border-gaming-accent/40'
            }`}
            aria-label="Filter games"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 bg-gaming-darker border border-gaming-accent/20 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gaming-accent/20">
              <h4 className="text-sm font-medium text-white">Categories</h4>
            </div>
            <div className="max-h-48 overflow-y-auto scroll-smooth-mobile">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left px-4 py-3 text-sm transition-colors tap-target touch-manipulation ${
                  selectedCategory === ''
                    ? 'bg-gaming-accent text-white'
                    : 'text-gray-300 hover:bg-gaming-accent/20 hover:text-white'
                }`}
              >
                All Games
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors tap-target touch-manipulation ${
                    selectedCategory === category.id
                      ? 'bg-gaming-accent text-white'
                      : 'text-gray-300 hover:bg-gaming-accent/20 hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Games Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 xs:gap-4">
          {displayedGames.map((game, index) => (
            <div 
              key={game.id}
              className="animate-fade-in"
              style={{ animationDelay: `${(index % 6) * 0.05}s` }}
            >
              <MobileGameCard
                game={game}
                onGameClick={onGameClick}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favoriteGameIds.includes(game.id)}
                isOffline={offlineGameIds.includes(game.id)}
              />
            </div>
          ))}
        </div>

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8">
            {isLoadingMore && (
              <div className="text-center">
                <div className="inline-flex items-center text-gaming-accent">
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Loading more games...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Load More Button (fallback) */}
        {hasMore && !isLoadingMore && displayedGames.length > 0 && (
          <div className="text-center py-6">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleLoadMore}
              className="group tap-target touch-manipulation"
            >
              Load More Games
              <ChevronDownIcon className="h-5 w-5 ml-2 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && displayedGames.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">
              You&apos;ve seen all {displayedGames.length} games
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileGameGrid;