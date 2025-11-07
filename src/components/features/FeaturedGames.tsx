'use client';

import React from 'react';
import { CardContent, Button } from '@/components/ui';
import { 
  PlayIcon, 
  HeartIcon, 
  StarIcon,
  FireIcon 
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

interface FeaturedGame {
  id: string;
  title: string;
  provider: string;
  thumbnail: string;
  category: string;
  rating: number;
  isHot?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  description: string;
}

interface FeaturedGamesProps {
  games?: FeaturedGame[];
  onGameClick?: (game: FeaturedGame) => void;
  onToggleFavorite?: (gameId: string) => void;
}

const FeaturedGames: React.FC<FeaturedGamesProps> = ({ 
  games, 
  onGameClick, 
  onToggleFavorite 
}) => {
  const defaultGames: FeaturedGame[] = [
    {
      id: 'memdot',
      title: 'Memdot',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Memory',
      rating: 4.9,
      isNew: true,
      isFavorite: false,
      description: 'Test your memory! Remember the colored circles and click on them when they turn white.'
    },
    {
      id: 'perfect-square',
      title: 'Perfect Square',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Puzzle',
      rating: 4.7,
      isNew: true,
      isFavorite: false,
      description: 'Grow your square to the perfect size and land it in the target area. Test your timing and precision!'
    },
    {
      id: '1',
      title: 'Memdot',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Championship',
      rating: 4.8,
      isHot: true,
      isFavorite: false,
      description: 'Test your memory! Remember the colored circles and click on them when they turn white.'
    },
    {
      id: '2',
      title: 'The Battle',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Team',
      rating: 4.9,
      isNew: true,
      isFavorite: true,
      description: 'Real-time multiplayer tank battle with rock-paper-scissors mechanics!'
    },
    {
      id: '3',
      title: 'Snake Battle',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Survival',
      rating: 4.7,
      isFavorite: false,
      description: 'Real-time multiplayer snake game inspired by Slither.io! Battle up to 8 players.'
    },
    {
      id: '4',
      title: 'Box Jump Tournament',
      provider: 'In-House',
      thumbnail: '/images/game-placeholder.svg',
      category: 'Tournament',
      rating: 4.6,
      isHot: true,
      isFavorite: false,
      description: 'Turn-based multiplayer platformer! Compete with other players in tournaments.'
    }
  ];

  const featuredGames = games || defaultGames;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-600'}`} 
      />
    ));
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-gaming font-bold text-white mb-4">
              Featured Games
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl">
              Handpicked games with the best graphics, gameplay, and winning potential
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Button variant="outline" size="lg">
              View All Games
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredGames.map((game, index) => (
            <div 
              key={game.id} 
              className="group cursor-pointer bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden animate-slide-up hover:shadow-lg hover:border-gaming-accent/40 transition-all duration-200"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onGameClick?.(game)}
            >
              {/* Game Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-gaming-accent/20 to-gaming-secondary/20 overflow-hidden">
                {/* Placeholder for game thumbnail */}
                <div className="w-full h-full bg-gradient-to-br from-gaming-accent/30 to-gaming-secondary/30 flex items-center justify-center">
                  <PlayIcon className="h-12 w-12 text-white/60" />
                </div>
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {game.isHot && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                      <FireIcon className="h-3 w-3 mr-1" />
                      HOT
                    </span>
                  )}
                  {game.isNew && (
                    <span className="bg-gaming-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </span>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(game.id);
                  }}
                >
                  {game.isFavorite ? (
                    <HeartIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <HeartOutlineIcon className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" className="glow-accent">
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Play Now
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Game Info */}
                <div className="mb-3">
                  <h3 className="font-semibold text-white mb-1 group-hover:text-gaming-accent transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    by {game.provider}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {game.description}
                  </p>
                </div>

                {/* Rating and Category */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {renderStars(game.rating)}
                    <span className="text-gray-400 text-sm ml-1">
                      {game.rating}
                    </span>
                  </div>
                  <span className="text-gaming-accent text-xs font-medium bg-gaming-accent/10 px-2 py-1 rounded-full">
                    {game.category}
                  </span>
                </div>

                {/* Play Button */}
                <Button 
                  size="sm" 
                  className="w-full group-hover:bg-gaming-accent group-hover:text-white transition-all duration-300"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGameClick?.(game);
                  }}
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Play Game
                </Button>
              </CardContent>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="group"
          >
            Load More Games
            <PlayIcon className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedGames;