'use client';

import React, { useState, useRef } from 'react';
import { Game } from '@/types';
import { Button } from '@/components/ui';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { 
  PlayIcon, 
  HeartIcon, 
  StarIcon,
  FireIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/solid';

import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

interface MobileGameCardProps {
  game: Game;
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  isFavorite?: boolean;
  isOffline?: boolean;
  size?: 'sm' | 'md';
}

const MobileGameCard: React.FC<MobileGameCardProps> = ({ 
  game,
  onGameClick, 
  onToggleFavorite,
  isFavorite = false,
  isOffline = false,
  size = 'md'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  
  const sizeClasses = {
    sm: 'aspect-[4/3]',
    md: 'aspect-[4/3]'
  };

  const renderStars = (rating: number) => {
    const stars = Math.min(5, Math.max(0, Math.floor(rating)));
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`h-2.5 w-2.5 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`} 
      />
    ));
  };

  // Touch event handlers for better mobile interaction
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setTouchStartTime(Date.now());
    setIsPressed(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If user moved too much, cancel the press state
    if (deltaX > 10 || deltaY > 10) {
      setIsPressed(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    setIsPressed(false);
    
    // Only trigger click if it was a quick tap with minimal movement
    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
      onGameClick?.(game);
    }
  };

  const handleCardClick = () => {
    onGameClick?.(game);
  };

  const handleFavoriteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite?.(game.id);
  };

  const handlePlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onGameClick?.(game);
  };

  return (
    <div 
      className={`group cursor-pointer bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden transition-all duration-200 touch-manipulation ${
        isPressed ? 'scale-95 border-gaming-accent/60' : 'hover:border-gaming-accent/40 hover:shadow-lg'
      }`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Game Thumbnail */}
      <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-gaming-accent/20 to-gaming-secondary/20 overflow-hidden`}>
        {game.thumbnail ? (
          <OptimizedImage
            src={game.thumbnail}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="transition-transform duration-300 group-hover:scale-105"
            fallbackSrc="/images/game-placeholder.svg"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gaming-accent/30 to-gaming-secondary/30 flex items-center justify-center">
            <PlayIcon className="h-8 w-8 text-white/60" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {game.isFeatured && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center">
              <FireIcon className="h-2.5 w-2.5 mr-0.5" />
              HOT
            </span>
          )}
          {isOffline && (
            <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center">
              <CloudArrowDownIcon className="h-2.5 w-2.5 mr-0.5" />
              OFFLINE
            </span>
          )}
          {game.popularity > 80 && (
            <span className="bg-gaming-secondary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              TOP
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors tap-target touch-manipulation"
          onClick={handleFavoriteClick}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartIcon className="h-4 w-4 text-red-500" />
          ) : (
            <HeartOutlineIcon className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Play Overlay - Only show on hover for desktop, always visible on mobile */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center md:opacity-0">
          <Button 
            size="sm" 
            className="bg-gaming-accent hover:bg-gaming-accent/90 text-white shadow-lg touch-manipulation tap-target px-3 py-2"
            onClick={handlePlayClick}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <PlayIcon className="h-3 w-3 mr-1" />
            Play
          </Button>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-3">
        {/* Title and Category */}
        <div className="mb-2">
          <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-gaming-accent transition-colors line-clamp-1">
            {game.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-gaming-accent text-xs font-medium bg-gaming-accent/10 px-2 py-0.5 rounded-full">
              {game.category.name}
            </span>
            <div className="flex items-center gap-0.5">
              {renderStars(game.popularity / 20)}
            </div>
          </div>
        </div>

        {/* Description - Only show on larger mobile screens */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 hidden xs:block">
          {game.description}
        </p>

        {/* Play Button */}
        <Button 
          size="sm" 
          className="w-full group-hover:bg-gaming-accent group-hover:text-white transition-all duration-300 touch-manipulation tap-target text-xs py-2"
          variant="outline"
          onClick={handlePlayClick}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <PlayIcon className="h-3 w-3 mr-1" />
          Play Game
        </Button>
      </div>
    </div>
  );
};

export default MobileGameCard;