'use client';

import React, { useState } from 'react';
import { GameGrid, GameCategory } from '@/components/features';
import { Game, GameCategory as GameCategoryType } from '@/types';

// Mock data for demonstration
const mockGames: Game[] = [
  {
    id: 'memdot',
    title: 'Memdot',
    slug: 'memdot',
    description: 'Test your memory! Remember the colored circles and click on them when they turn white.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '4',
      name: 'Memory Games',
      slug: 'memory',
      description: 'Brain training and memory games',
      icon: '🧠',
      order: 4,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['memory', 'puzzle', 'brain-training']
  },
  {
    id: 'perfect-square',
    title: 'Perfect Square',
    slug: 'perfect-square',
    description: 'Grow your square to the perfect size and land it in the target area. Test your timing and precision!',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '5',
      name: 'Puzzle Games',
      slug: 'puzzle',
      description: 'Mind-bending puzzle and logic games',
      icon: '🧩',
      order: 5,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 87,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['puzzle', 'timing', 'precision']
  },
  {
    id: 'fill-the-holes',
    title: 'Fill the Holes',
    slug: 'fill-the-holes',
    description: 'A challenging puzzle game where you need to fill all the holes to complete each level.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '5',
      name: 'Puzzle Games',
      slug: 'puzzle',
      description: 'Mind-bending puzzle and logic games',
      icon: '🧩',
      order: 5,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['puzzle', 'logic', 'strategy']
  },
  {
    id: 'clocks',
    title: 'Clocks',
    slug: 'clocks',
    description: 'A time-based puzzle game where you need to manage and synchronize different clocks.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '5',
      name: 'Puzzle Games',
      slug: 'puzzle',
      description: 'Mind-bending puzzle and logic games',
      icon: '🧩',
      order: 5,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['puzzle', 'time', 'strategy']
  },
  {
    id: '123',
    title: '123',
    slug: '123',
    description: 'A numbers-based puzzle game that challenges your mathematical thinking and logic skills.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '5',
      name: 'Puzzle Games',
      slug: 'puzzle',
      description: 'Mind-bending puzzle and logic games',
      icon: '🧩',
      order: 5,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 86,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['puzzle', 'numbers', 'math']
  },
  {
    id: 'circle-path',
    title: 'Circle Path',
    slug: 'circle-path',
    description: 'Navigate through circular paths in this challenging arcade-style game. Test your reflexes and timing!',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '6',
      name: 'Arcade Games',
      slug: 'arcade',
      description: 'Fast-paced arcade games for quick thrills',
      icon: '🕹️',
      order: 6,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 92,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['arcade', 'reflexes', 'timing']
  },
  {
    id: 'box-jump',
    title: 'Box Jump',
    slug: 'box-jump',
    description: 'Jump from box to box in this exciting platformer game. Test your timing and precision!',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '6',
      name: 'Arcade Games',
      slug: 'arcade',
      description: 'Fast-paced arcade games for quick thrills',
      icon: '🕹️',
      order: 6,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['arcade', 'platformer', 'jumping']
  },
  {
    id: 'boom-dots',
    title: 'Boom Dots',
    slug: 'boom-dots',
    description: 'An explosive dot-matching game with chain reactions and colorful effects!',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '6',
      name: 'Arcade Games',
      slug: 'arcade',
      description: 'Fast-paced arcade games for quick thrills',
      icon: '🕹️',
      order: 6,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 91,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['arcade', 'matching', 'explosions']
  },
  {
    id: 'doodle-jump',
    title: 'Doodle Jump',
    slug: 'doodle-jump',
    description: 'Jump as high as you can in this addictive vertical platformer! Avoid obstacles and reach new heights.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '6',
      name: 'Arcade Games',
      slug: 'arcade',
      description: 'Fast-paced arcade games for quick thrills',
      icon: '🕹️',
      order: 6,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 94,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['arcade', 'jumping', 'endless']
  },
  {
    id: 'the-battle',
    title: 'The Battle',
    slug: 'the-battle',
    description: 'Real-time multiplayer tank battle with rock-paper-scissors mechanics! Each tank type has unique strengths and weaknesses.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '7',
      name: 'Multiplayer Games',
      slug: 'multiplayer',
      description: 'Real-time multiplayer games for competitive fun',
      icon: '👥',
      order: 7,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 96,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['multiplayer', 'tanks', 'strategy', 'real-time']
  },
  {
    id: 'snake-multiplayer',
    title: 'Multiplayer Snake Battle',
    slug: 'snake-multiplayer',
    description: 'Real-time multiplayer snake game inspired by Slither.io! Battle up to 8 players with special abilities, shooting, armor, and dangerous poison food.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '7',
      name: 'Multiplayer Games',
      slug: 'multiplayer',
      description: 'Real-time multiplayer games for competitive fun',
      icon: '👥',
      order: 7,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 98,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['multiplayer', 'snake', 'battle', 'real-time', 'shooting']
  },
  {
    id: 'box-jump-multiplayer',
    title: 'Multiplayer Box Jump',
    slug: 'box-jump-multiplayer',
    description: 'Turn-based multiplayer platformer! At least 5 players take turns attempting each level. Only those who complete a level can advance to the next one.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '7',
      name: 'Multiplayer Games',
      slug: 'multiplayer',
      description: 'Real-time multiplayer games for competitive fun',
      icon: '👥',
      order: 7,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 94,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['multiplayer', 'platformer', 'turn-based', 'competitive']
  },
  {
    id: '1',
    title: 'Mega Fortune Slots',
    slug: 'mega-fortune-slots',
    description: 'Progressive jackpot slot with luxury theme and massive payouts',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '1',
      name: 'Slots',
      slug: 'slots',
      description: 'Slot machine games',
      icon: '🎰',
      order: 1,
      isActive: true
    },
    provider: 'NetEnt',
    isActive: true,
    isFeatured: true,
    popularity: 95,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['progressive', 'jackpot']
  },
  {
    id: '2',
    title: 'Live Blackjack Pro',
    slug: 'live-blackjack-pro',
    description: 'Professional live blackjack with real dealers and HD streaming',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '2',
      name: 'Live Casino',
      slug: 'live-casino',
      description: 'Live dealer games',
      icon: '🃏',
      order: 2,
      isActive: true
    },
    provider: 'Evolution Gaming',
    isActive: true,
    isFeatured: false,
    popularity: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['live', 'cards']
  },
  {
    id: '3',
    title: 'Football Champions',
    slug: 'football-champions',
    description: 'Sports-themed slot with championship bonuses and free spins',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '3',
      name: 'Sports',
      slug: 'sports',
      description: 'Sports betting and games',
      icon: '⚽',
      order: 3,
      isActive: true
    },
    provider: 'Pragmatic Play',
    isActive: true,
    isFeatured: false,
    popularity: 82,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['sports', 'football']
  },
  {
    id: '4',
    title: 'Dragon\'s Gold',
    slug: 'dragons-gold',
    description: 'Asian-themed adventure with expanding wilds and multipliers',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '1',
      name: 'Slots',
      slug: 'slots',
      description: 'Slot machine games',
      icon: '🎰',
      order: 1,
      isActive: true
    },
    provider: 'Red Tiger',
    isActive: true,
    isFeatured: true,
    popularity: 79,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['asian', 'dragons']
  },
  {
    id: '5',
    title: 'Roulette Royal',
    slug: 'roulette-royal',
    description: 'Classic European roulette with premium graphics',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '2',
      name: 'Live Casino',
      slug: 'live-casino',
      description: 'Live dealer games',
      icon: '🃏',
      order: 2,
      isActive: true
    },
    provider: 'Evolution Gaming',
    isActive: true,
    isFeatured: false,
    popularity: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['roulette', 'classic']
  },
  {
    id: '6',
    title: 'Basketball Slam',
    slug: 'basketball-slam',
    description: 'High-energy basketball slot with slam dunk bonuses',
    thumbnail: '/api/placeholder/300/200',
    category: {
      id: '3',
      name: 'Sports',
      slug: 'sports',
      description: 'Sports betting and games',
      icon: '⚽',
      order: 3,
      isActive: true
    },
    provider: 'Pragmatic Play',
    isActive: true,
    isFeatured: false,
    popularity: 77,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['sports', 'basketball']
  }
];

const slotsCategory: GameCategoryType = {
  id: '1',
  name: 'Slot Games',
  slug: 'slots',
  description: 'Exciting slot machine games with various themes and features',
  icon: '🎰',
  order: 1,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'slots')
};

const liveCasinoCategory: GameCategoryType = {
  id: '2',
  name: 'Live Casino',
  slug: 'live-casino',
  description: 'Real dealers, real-time action, authentic casino experience',
  icon: '🃏',
  order: 2,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'live-casino')
};

const memoryGamesCategory: GameCategoryType = {
  id: '4',
  name: 'Memory Games',
  slug: 'memory',
  description: 'Challenge your mind with brain training and memory games',
  icon: '🧠',
  order: 4,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'memory')
};

const puzzleGamesCategory: GameCategoryType = {
  id: '5',
  name: 'Puzzle Games',
  slug: 'puzzle',
  description: 'Mind-bending puzzle and logic games',
  icon: '🧩',
  order: 5,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'puzzle')
};

const arcadeGamesCategory: GameCategoryType = {
  id: '6',
  name: 'Arcade Games',
  slug: 'arcade',
  description: 'Fast-paced arcade games for quick thrills',
  icon: '🕹️',
  order: 6,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'arcade')
};

const multiplayerGamesCategory: GameCategoryType = {
  id: '7',
  name: 'Multiplayer Games',
  slug: 'multiplayer',
  description: 'Real-time multiplayer games for competitive fun',
  icon: '👥',
  order: 7,
  isActive: true,
  games: mockGames.filter(game => game.category.slug === 'multiplayer')
};

export default function GamesPage() {
  const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>(['1', '3']);

  const handleGameClick = (game: Game) => {
    console.log('Game clicked:', game.title);
    // Navigate to the game page
    if (game.slug === 'memdot' || game.slug === 'fill-the-holes' || game.slug === 'clocks' || game.slug === 'circle-path' || game.slug === 'box-jump' || game.slug === 'boom-dots' || game.slug === '123' || game.slug === 'doodle-jump' || game.slug === 'perfect-square' || game.slug === 'the-battle' || game.slug === 'snake-multiplayer' || game.slug === 'box-jump-multiplayer') {
      window.location.href = `/games/${game.slug}`;
    } else {
      // For other games, show placeholder message
      alert(`Starting ${game.title}...`);
    }
  };

  const handleToggleFavorite = (gameId: string) => {
    setFavoriteGameIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const handleViewAllClick = (category: GameCategoryType) => {
    console.log('View all clicked for category:', category.name);
    // In a real app, this would navigate to a category page
    alert(`Viewing all ${category.name} games...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-gaming font-bold text-white mb-4">
            Game Portal
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing games across different categories. Play your favorites and explore new adventures.
          </p>
        </div>

        {/* Multiplayer Games Highlight */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-gaming-accent/20 to-gaming-secondary/20 rounded-lg p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl mr-3">👥</span>
              <h2 className="text-3xl font-gaming font-bold text-white">
                Multiplayer Games
              </h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Battle other players in real-time! Experience competitive gaming with friends and players from around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/games/multiplayer"
                className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                <span className="mr-2">⚔️</span>
                Browse Multiplayer Games
              </a>
              <a
                href="/games/the-battle"
                className="inline-flex items-center px-6 py-3 border border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-white font-semibold rounded-lg transition-colors"
              >
                Play The Battle Now
              </a>
            </div>
          </div>
        </section>

        {/* All Games Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-gaming font-bold text-white mb-8">
            All Games
          </h2>
          <GameGrid
            games={mockGames}
            onGameClick={handleGameClick}
            onToggleFavorite={handleToggleFavorite}
            favoriteGameIds={favoriteGameIds}
            pagination={{ 
              enabled: true, 
              pageSize: 4, 
              showLoadMore: true 
            }}
            columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          />
        </section>

        {/* Category Sections */}
        <GameCategory
          category={slotsCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        <GameCategory
          category={liveCasinoCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        <GameCategory
          category={memoryGamesCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        <GameCategory
          category={puzzleGamesCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        <GameCategory
          category={arcadeGamesCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        <GameCategory
          category={multiplayerGamesCategory}
          onGameClick={handleGameClick}
          onToggleFavorite={handleToggleFavorite}
          onViewAllClick={handleViewAllClick}
          favoriteGameIds={favoriteGameIds}
          maxGamesShown={4}
        />

        {/* Infinite Scroll Example */}
        <section className="mt-16">
          <h2 className="text-3xl font-gaming font-bold text-white mb-8">
            Infinite Scroll Demo
          </h2>
          <GameGrid
            games={mockGames}
            onGameClick={handleGameClick}
            onToggleFavorite={handleToggleFavorite}
            favoriteGameIds={favoriteGameIds}
            infiniteScroll={{
              enabled: true,
              onLoadMore: () => console.log('Loading more games...'),
              hasMore: true,
              loading: false
            }}
            columns={{ sm: 1, md: 2, lg: 2, xl: 3 }}
          />
        </section>
      </div>
    </div>
  );
}