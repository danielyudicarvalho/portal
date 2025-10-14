'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { 
  PlayIcon, 
  HeartIcon, 
  StarIcon,
  FireIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { Game } from '@/types';

interface GameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  isFavorite?: boolean;
  showProvider?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GameCard: React.FC<GameCardProps> = ({ 
  game,
  onGameClick, 
  onToggleFavorite,
  isFavorite = false,
  showProvider = true,
  size = 'md'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const router = useRouter();
  
  // Check if this is a multiplayer game
  const isMultiplayer = game.category.slug === 'multiplayer';
  
  const sizeClasses = {
    sm: 'aspect-[4/3]',
    md: 'aspect-video',
    lg: 'aspect-[16/10]'
  };

  const renderStars = (rating: number) => {
    const stars = Math.min(5, Math.max(0, Math.floor(rating)));
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`h-3 w-3 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`} 
      />
    ));
  };

  const handleCardClick = () => {
    onGameClick?.(game);
  };

  const handleFavoriteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(game.id);
  };

  const handlePlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onGameClick?.(game);
  };

  const handleViewRooms = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    router.push(`/games/${game.slug}/rooms`);
  };

  // Mobile touch handlers
  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div 
      className={`group cursor-pointer bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-gaming-accent/40 hover:shadow-lg touch-manipulation ${
        isPressed ? 'scale-95' : ''
      }`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Game Thumbnail */}
      <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-gaming-accent/20 to-gaming-secondary/20 overflow-hidden`}>
        {game.thumbnail ? (
          <OptimizedImage
            src={game.thumbnail}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="transition-transform duration-300 group-hover:scale-105"
            fallbackSrc="/images/game-placeholder.svg"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gaming-accent/30 to-gaming-secondary/30 flex items-center justify-center">
            <PlayIcon className="h-12 w-12 text-white/60" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {isMultiplayer && (
            <span className="bg-gaming-accent text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <UserGroupIcon className="h-3 w-3 mr-1" />
              MULTIPLAYER
            </span>
          )}
          {game.isFeatured && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <FireIcon className="h-3 w-3 mr-1" />
              HOT
            </span>
          )}
          {game.popularity > 80 && (
            <span className="bg-gaming-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100 tap-target touch-manipulation"
          onClick={handleFavoriteClick}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartOutlineIcon className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            size="sm" 
            className="bg-gaming-accent hover:bg-gaming-accent/90 text-white shadow-lg touch-manipulation tap-target"
            onClick={handlePlayClick}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Play Now</span>
            <span className="xs:hidden">Play</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Game Info */}
        <div className="mb-3">
          <h3 className="font-semibold text-white mb-1 group-hover:text-gaming-accent transition-colors line-clamp-1">
            {game.title}
          </h3>
          {showProvider && (
            <p className="text-gray-400 text-sm mb-2">
              by {game.provider}
            </p>
          )}
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
            {game.description}
          </p>
        </div>

        {/* Rating and Category */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {renderStars(game.popularity / 20)} {/* Convert popularity to 5-star rating */}
            <span className="text-gray-400 text-sm ml-1">
              {(game.popularity / 20).toFixed(1)}
            </span>
          </div>
          <span className="text-gaming-accent text-xs font-medium bg-gaming-accent/10 px-2 py-1 rounded-full">
            {game.category.name}
          </span>
        </div>

        {/* Action Buttons */}
        {isMultiplayer ? (
          <div className="space-y-2">
            <Button 
              size="sm" 
              className="w-full bg-gaming-accent hover:bg-gaming-accent/80 text-white transition-all duration-300 touch-manipulation tap-target"
              onClick={handleViewRooms}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">View Rooms</span>
              <span className="xs:hidden">Rooms</span>
            </Button>
            <Button 
              size="sm" 
              className="w-full group-hover:bg-gaming-accent group-hover:text-white transition-all duration-300 touch-manipulation tap-target"
              variant="outline"
              onClick={handlePlayClick}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Play Solo</span>
              <span className="xs:hidden">Solo</span>
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            className="w-full group-hover:bg-gaming-accent group-hover:text-white transition-all duration-300 touch-manipulation tap-target"
            variant="outline"
            onClick={handlePlayClick}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Play Game</span>
            <span className="xs:hidden">Play</span>
          </Button>
        )}
      </CardContent>
    </div>
  );
};

export default GameCard;