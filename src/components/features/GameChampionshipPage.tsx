'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { ChampionshipCard, CreateChampionshipModal } from '@/components/features';
import GameCostDisplay from '@/components/features/GameCostDisplay';
import { TrophyIcon, PlayIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

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

interface GameChampionshipPageProps {
  gameSlug: string;
  gameTitle: string;
  gameDescription: string;
  gameInstructions: {
    objective: string[];
    scoring: string[];
  };
  gameId?: string;
}

function GameChampionshipContent({ 
  gameSlug, 
  gameTitle, 
  gameDescription, 
  gameInstructions,
  gameId 
}: GameChampionshipPageProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const championshipId = searchParams.get('championshipId');
  
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [activeChampionship, setActiveChampionship] = useState<Championship | null>(null);
  const [userParticipations, setUserParticipations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');

  useEffect(() => {
    fetchGameChampionships();
  }, []);

  useEffect(() => {
    if (championshipId && championships.length > 0) {
      const championship = championships.find(c => c.id === championshipId);
      setActiveChampionship(championship || null);
    }
  }, [championshipId, championships]);

  const fetchGameChampionships = async () => {
    try {
      setIsLoading(true);
      // Fetch championships for this specific game
      const response = await fetch(`/api/championships?gameSlug=${gameSlug}`);
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
      console.error(`Error fetching ${gameSlug} championships:`, error);
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
        await fetchGameChampionships(); // Refresh to get updated participant count
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
        body: JSON.stringify({
          ...championshipData,
          gameSlug: gameSlug,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        await fetchGameChampionships(); // Refresh the list
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

  const activeChampionships = championships.filter(c => c.status === 'ACTIVE');
  const upcomingChampionships = championships.filter(c => c.status === 'UPCOMING');

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <a
              href="/games/championship"
              className="inline-flex items-center text-gaming-accent hover:text-gaming-accent/80 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to All Championships
            </a>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TrophyIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                {gameTitle} Championships
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              {gameDescription}
            </p>
            
            {session?.user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create {gameTitle} Championship
              </button>
            )}
          </div>

          {/* Active Championship Game */}
          {activeChampionship && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Playing: {activeChampionship.title}</h2>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Game Area */}
                <div className="lg:col-span-2">
                  <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gaming-accent/20">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white flex items-center">
                          <PlayIcon className="h-5 w-5 mr-2" />
                          Play Championship
                        </h3>
                        <div className="text-sm text-gray-300">
                          Prize Pool: <span className="text-gaming-accent font-semibold">{activeChampionship.prizePool}</span> credits
                        </div>
                      </div>
                    </div>
                    
                    <div className="aspect-[2/3] bg-black">
                      <iframe
                        src={`/games/${gameSlug}/index.html?championshipId=${activeChampionship.id}`}
                        className="w-full h-full border-0"
                        title={`${gameTitle} Championship`}
                      />
                    </div>
                  </div>
                </div>

                {/* Championship Leaderboard */}
                <div className="lg:col-span-1">
                  <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrophyIcon className="h-5 w-5 text-gaming-accent mr-2" />
                      Live Leaderboard
                    </h3>
                    {activeChampionship.participants && activeChampionship.participants.length > 0 ? (
                      <div className="space-y-2">
                        {activeChampionship.participants.slice(0, 10).map((participant, index) => (
                          <div
                            key={participant.id}
                            className={`flex items-center justify-between p-3 rounded ${
                              participant.user.id === session?.user?.id
                                ? 'bg-gaming-accent/10 border border-gaming-accent/30'
                                : 'bg-gaming-darker'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-amber-600 text-black' :
                                'bg-gaming-accent/20 text-gaming-accent'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-white text-sm">
                                {participant.user.name || participant.user.username}
                                {participant.user.id === session?.user?.id && (
                                  <span className="ml-1 text-xs text-gaming-accent">(You)</span>
                                )}
                              </span>
                            </div>
                            <span className="text-white font-semibold">
                              {participant.bestScore.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No scores yet. Be the first to play!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Championships Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gaming-darker rounded-lg p-1 max-w-md">
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

          {/* Championships List */}
          <div className="space-y-8">
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
                        No {activeTab} {gameTitle} championships
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {activeTab === 'active' && `No ${gameTitle} championships are currently running.`}
                        {activeTab === 'upcoming' && `No ${gameTitle} championships are scheduled to start soon.`}
                        {activeTab === 'completed' && `No ${gameTitle} championships have been completed yet.`}
                      </p>
                      {session?.user && activeTab !== 'completed' && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-medium rounded transition-colors"
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
          </div>

          {/* Game Instructions */}
          <div className="mt-12 bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How to Play</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-gaming-accent mb-2">Objective</h4>
                <ul className="space-y-1">
                  {gameInstructions.objective.map((instruction, index) => (
                    <li key={index}>• {instruction}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gaming-accent mb-2">Championship Scoring</h4>
                <ul className="space-y-1">
                  {gameInstructions.scoring.map((instruction, index) => (
                    <li key={index}>• {instruction}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Overall Leaderboard */}
          <div className="mt-8">
            <GameLeaderboard gameId={gameId || gameSlug} />
          </div>
        </div>
      </div>

      {/* Create Championship Modal */}
      <CreateChampionshipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateChampionship}
        games={[{
          id: gameId || gameSlug,
          title: gameTitle,
          slug: gameSlug,
          thumbnail: '/images/game-placeholder.svg'
        }]}
        isLoading={isCreating}
        preSelectedGameId={gameId || gameSlug}
      />
    </Layout>
  );
}

export default function GameChampionshipPage(props: GameChampionshipPageProps) {
  return (
    <Suspense fallback={
      <Layout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker flex items-center justify-center">
          <div className="text-white">Loading championships...</div>
        </div>
      </Layout>
    }>
      <GameChampionshipContent {...props} />
    </Suspense>
  );
}