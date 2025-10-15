'use client';

import React, { useState } from 'react';
import { GameGrid } from '@/components/features';
import { Game } from '@/types';
import { UsersIcon, PlayIcon } from '@heroicons/react/24/outline';

// Multiplayer games data
const multiplayerGames: Game[] = [
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
  }
];

export default function MultiplayerGamesPage() {
  const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>([]);

  const handleGameClick = (game: Game) => {
    console.log('Game clicked:', game.title);
    // Navigate to the game page
    if (game.slug === 'the-battle' || game.slug === 'snake-multiplayer' || game.slug === 'box-jump-multiplayer') {
      window.location.href = `/games/${game.slug}`;
    } else {
      // For future multiplayer games
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <UsersIcon className="h-12 w-12 text-gaming-accent mr-4" />
            <h1 className="text-4xl md:text-5xl font-gaming font-bold text-white">
              Multiplayer Games
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Battle other players in real-time! Experience competitive gaming with friends and players from around the world.
          </p>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Action</h3>
            <p className="text-gray-400 text-sm">Experience seamless real-time gameplay with instant responses</p>
          </div>
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold text-white mb-2">Competitive Play</h3>
            <p className="text-gray-400 text-sm">Compete against players worldwide and climb the leaderboards</p>
          </div>
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-white mb-2">Social Gaming</h3>
            <p className="text-gray-400 text-sm">Play with friends or make new ones in our gaming community</p>
          </div>
        </div>

        {/* Games Grid */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <PlayIcon className="h-8 w-8 text-gaming-accent mr-3" />
            <h2 className="text-3xl font-gaming font-bold text-white">
              Available Multiplayer Games
            </h2>
          </div>
          
          {multiplayerGames.length > 0 ? (
            <GameGrid
              games={multiplayerGames}
              onGameClick={handleGameClick}
              onToggleFavorite={handleToggleFavorite}
              favoriteGameIds={favoriteGameIds}
              columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
              emptyState={{
                title: 'No multiplayer games found',
                description: 'Check back later for new multiplayer games.'
              }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 text-lg">
                  Coming Soon!
                </h3>
                <p className="text-gray-400">
                  More multiplayer games are being developed. Stay tuned for exciting new battles!
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Game Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-gaming font-bold text-white mb-8 text-center">
            Game Types
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Battle Games</h3>
              <p className="text-gray-400 text-sm">Real-time combat and strategy games</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors opacity-50">
              <div className="text-4xl mb-4">🏁</div>
              <h3 className="text-lg font-semibold text-white mb-2">Racing Games</h3>
              <p className="text-gray-400 text-sm">Coming Soon</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors opacity-50">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-lg font-semibold text-white mb-2">Puzzle Co-op</h3>
              <p className="text-gray-400 text-sm">Coming Soon</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors opacity-50">
              <div className="text-4xl mb-4">⚽</div>
              <h3 className="text-lg font-semibold text-white mb-2">Sports Games</h3>
              <p className="text-gray-400 text-sm">Coming Soon</p>
            </div>
          </div>
        </section>

        {/* Back to Games */}
        <div className="text-center">
          <a
            href="/games"
            className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to All Games
          </a>
        </div>
      </div>
    </div>
  );
}