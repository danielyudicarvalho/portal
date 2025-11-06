'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GameGrid } from '@/components/features';
import { ChampionshipCard, CreateChampionshipModal } from '@/components/features';
import { Game } from '@/types';
import { TrophyIcon, PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

// Championship games data
const championshipGames: Game[] = [
  {
    id: 'memdot',
    title: 'Memdot',
    slug: 'memdot',
    description: 'Test your memory! Remember the colored circles and click on them when they turn white.',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
    id: 'box-jump',
    title: 'Box Jump',
    slug: 'box-jump',
    description: 'Jump from box to box in this exciting platformer game. Test your timing and precision!',
    thumbnail: '/images/game-placeholder.svg',
    category: {
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
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
      id: '1',
      name: 'Championship',
      slug: 'championship',
      description: 'Competitive games for champions',
      icon: '🏆',
      order: 1,
      isActive: true
    },
    provider: 'In-House',
    isActive: true,
    isFeatured: true,
    popularity: 91,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['arcade', 'matching', 'explosions']
  }
];

interface Championship {
  id: string;
  title: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants?: number;
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  game: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
  };
  creator: {
    id: string;
    name: string;
    username?: string;
  };
  _count: {
    participants: number;
  };
  participants?: Array<{
    id: string;
    bestScore: number;
    user: {
      id: string;
      name: string;
      username?: string;
    };
  }>;
}

export default function ChampionshipGamesPage() {
  const { data: session } = useSession();
  const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [userParticipations, setUserParticipations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');

  useEffect(() => {
    fetchChampionships();
  }, []);

  const fetchChampionships = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/championships');
      if (response.ok) {
        const data = await response.json();
        setChampionships(data.championships);
        
        // Track user participations
        if (session?.user?.id) {
          const participations = new Set<string>();
          data.championships.forEach((championship: Championship) => {
            if (championship.participants?.some(p => p.user.id === session.user.id)) {
              participations.add(championship.id);
            }
          });
          setUserParticipations(participations);
        }
      }
    } catch (error) {
      console.error('Error fetching championships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChampionship = async (championshipId: string) => {
    if (!session?.user?.id) {
      alert('Please sign in to join championships');
      return;
    }

    try {
      setIsJoining(championshipId);
      const response = await fetch(`/api/championships/${championshipId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        setUserParticipations(prev => new Set([...prev, championshipId]));
        await fetchChampionships(); // Refresh to get updated participant count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join championship');
      }
    } catch (error) {
      console.error('Error joining championship:', error);
      alert('Failed to join championship');
    } finally {
      setIsJoining(null);
    }
  };

  const handleViewChampionship = (championshipId: string) => {
    window.location.href = `/championships/${championshipId}`;
  };

  const handleCreateChampionship = async (championshipData: any) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/championships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(championshipData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        await fetchChampionships(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create championship');
      }
    } catch (error) {
      console.error('Error creating championship:', error);
      alert('Failed to create championship');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGameClick = (game: Game) => {
    console.log('Game clicked:', game.title);
    // Navigate to the game-specific championship page
    window.location.href = `/games/${game.slug}/championship`;
  };

  const handleToggleFavorite = (gameId: string) => {
    setFavoriteGameIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const getFilteredChampionships = () => {
    return championships.filter(championship => {
      switch (activeTab) {
        case 'active':
          return championship.status === 'ACTIVE';
        case 'upcoming':
          return championship.status === 'UPCOMING';
        case 'completed':
          return championship.status === 'COMPLETED';
        default:
          return true;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrophyIcon className="h-12 w-12 text-gaming-accent mr-4" />
            <h1 className="text-4xl md:text-5xl font-gaming font-bold text-white">
              Championship Mode
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Compete for the highest score before time runs out! Join active championships or create your own to share with others.
          </p>
          
          {session?.user && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Championship
              </button>
            </div>
          )}
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold text-white mb-2">Competitive Play</h3>
            <p className="text-gray-400 text-sm">Challenge yourself and compete for the highest scores</p>
          </div>
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Leaderboards</h3>
            <p className="text-gray-400 text-sm">Track your progress and see how you rank against others</p>
          </div>
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Skill-Based</h3>
            <p className="text-gray-400 text-sm">Games that reward strategy, timing, and precision</p>
          </div>
        </div>

        {/* Championships Section */}
        <section className="mb-16">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1 bg-gaming-darker rounded-lg p-1">
              {[
                { key: 'active', label: 'Active', count: championships.filter(c => c.status === 'ACTIVE').length },
                { key: 'upcoming', label: 'Upcoming', count: championships.filter(c => c.status === 'UPCOMING').length },
                { key: 'completed', label: 'Completed', count: championships.filter(c => c.status === 'COMPLETED').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-gaming-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Championships Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gaming-accent/20 rounded mb-4"></div>
                  <div className="h-3 bg-gaming-accent/10 rounded mb-2"></div>
                  <div className="h-3 bg-gaming-accent/10 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {getFilteredChampionships().length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredChampionships().map((championship) => (
                    <ChampionshipCard
                      key={championship.id}
                      championship={championship}
                      onJoin={handleJoinChampionship}
                      onView={handleViewChampionship}
                      userParticipating={userParticipations.has(championship.id)}
                      isLoading={isJoining === championship.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <TrophyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2 text-lg">
                      No {activeTab} championships
                    </h3>
                    <p className="text-gray-400">
                      {activeTab === 'active' && 'No championships are currently running.'}
                      {activeTab === 'upcoming' && 'No championships are scheduled to start soon.'}
                      {activeTab === 'completed' && 'No championships have been completed yet.'}
                    </p>
                    {session?.user && activeTab !== 'completed' && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-medium rounded transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Championship
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Available Games Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <PlayIcon className="h-8 w-8 text-gaming-accent mr-3" />
            <h2 className="text-3xl font-gaming font-bold text-white">
              Available Games
            </h2>
          </div>
          
          {championshipGames.length > 0 ? (
            <GameGrid
              games={championshipGames}
              onGameClick={handleGameClick}
              onToggleFavorite={handleToggleFavorite}
              favoriteGameIds={favoriteGameIds}
              columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
              emptyState={{
                title: 'No championship games found',
                description: 'Check back later for new championship games.'
              }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <TrophyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 text-lg">
                  Coming Soon!
                </h3>
                <p className="text-gray-400">
                  More championship games are being developed. Stay tuned for exciting new challenges!
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
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-lg font-semibold text-white mb-2">Memory Games</h3>
              <p className="text-gray-400 text-sm">Test and improve your memory skills</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">Precision Games</h3>
              <p className="text-gray-400 text-sm">Perfect timing and accuracy challenges</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-lg font-semibold text-white mb-2">Logic Puzzles</h3>
              <p className="text-gray-400 text-sm">Strategic thinking and problem solving</p>
            </div>
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 text-center hover:border-gaming-accent/40 transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Arcade Action</h3>
              <p className="text-gray-400 text-sm">Fast-paced skill-based gameplay</p>
            </div>
          </div>
        </section>

        {/* Championship Leaderboards */}
        <section className="mb-16">
          <h2 className="text-3xl font-gaming font-bold text-white mb-8 text-center">
            Championship Leaderboards
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 text-gaming-accent mr-2" />
                Memdot Champions
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-400 mb-3">Top players this week</div>
                <div className="text-center py-4">
                  <a
                    href="/games/memdot/championship"
                    className="inline-flex items-center px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 text-white rounded text-sm transition-colors"
                  >
                    View Full Leaderboard
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 text-gray-400 mr-2" />
                More Games Coming Soon
              </h3>
              <div className="text-sm text-gray-400">
                Additional championship leaderboards will be available as more games are added to the championship mode.
              </div>
            </div>
            
            <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 text-gray-400 mr-2" />
                Global Rankings
              </h3>
              <div className="text-sm text-gray-400">
                Cross-game rankings and achievements system coming soon to track your overall championship performance.
              </div>
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

      {/* Create Championship Modal */}
      <CreateChampionshipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateChampionship}
        games={championshipGames}
        isLoading={isCreating}
      />
    </div>
  );
}