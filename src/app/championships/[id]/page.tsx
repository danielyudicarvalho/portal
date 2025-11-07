'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout';
import { 
  TrophyIcon, 
  UsersIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  PlayIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns';

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
    description: string;
  };
  creator: {
    id: string;
    name: string;
    username?: string;
  };
  participants: Array<{
    id: string;
    bestScore: number;
    finalRank?: number;
    prizeWon: number;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      username?: string;
      avatar?: string;
    };
    gameScore?: {
      id: string;
      score: number;
      level: number;
      duration?: number;
      createdAt: string;
    };
  }>;
  _count: {
    participants: number;
  };
}

interface UserParticipation {
  id: string;
  bestScore: number;
  finalRank?: number;
  prizeWon: number;
  joinedAt: string;
}

export default function ChampionshipDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const championshipId = params.id as string;

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [userParticipation, setUserParticipation] = useState<UserParticipation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (championshipId) {
      fetchChampionship();
    }
  }, [championshipId]);

  useEffect(() => {
    if (championship) {
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [championship]);

  const fetchChampionship = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/championships/${championshipId}`);
      if (response.ok) {
        const data = await response.json();
        setChampionship(data.championship);
        setUserParticipation(data.userParticipation);
      } else {
        console.error('Failed to fetch championship');
      }
    } catch (error) {
      console.error('Error fetching championship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (!championship) return;

    const now = new Date();
    const startTime = new Date(championship.startTime);
    const endTime = new Date(championship.endTime);

    if (isBefore(now, startTime)) {
      setTimeLeft(`Starts in ${formatDistanceToNow(startTime)}`);
    } else if (isAfter(now, endTime)) {
      setTimeLeft('Championship ended');
    } else {
      setTimeLeft(`Ends in ${formatDistanceToNow(endTime)}`);
    }
  };

  const handleJoinChampionship = async () => {
    if (!session?.user?.id || !championship) {
      alert('Please sign in to join championships');
      return;
    }

    try {
      setIsJoining(true);
      const response = await fetch(`/api/championships/${championship.id}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchChampionship(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join championship');
      }
    } catch (error) {
      console.error('Error joining championship:', error);
      alert('Failed to join championship');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePlayGame = () => {
    if (!championship) return;
    
    // Navigate to the game with championship context
    window.location.href = `/games/${championship.game.slug}/championship?championshipId=${championship.id}`;
  };

  const getStatusColor = (status: Championship['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ACTIVE':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'COMPLETED':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'CANCELLED':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const canJoin = championship?.status === 'UPCOMING' && 
                  !userParticipation && 
                  (!championship.maxParticipants || championship._count.participants < championship.maxParticipants);

  const canPlay = championship?.status === 'ACTIVE' && userParticipation;

  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker flex items-center justify-center">
          <div className="text-white">Loading championship...</div>
        </div>
      </Layout>
    );
  }

  if (!championship) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Championship Not Found</h1>
            <a
              href="/games/championship"
              className="inline-flex items-center px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 text-white rounded transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Championships
            </a>
          </div>
        </div>
      </Layout>
    );
  }

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
              Back to Championships
            </a>
          </div>

          {/* Championship Header */}
          <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <TrophyIcon className="h-8 w-8 text-gaming-accent mr-3" />
                  <h1 className="text-3xl font-bold text-white">{championship.title}</h1>
                  <span className={`ml-4 px-3 py-1 text-sm font-medium rounded border ${getStatusColor(championship.status)}`}>
                    {championship.status}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-300 mb-4">
                  <img 
                    src={championship.game.thumbnail} 
                    alt={championship.game.title}
                    className="w-8 h-8 rounded mr-3"
                  />
                  <span className="text-lg">{championship.game.title}</span>
                </div>

                {championship.description && (
                  <p className="text-gray-300 mb-4">{championship.description}</p>
                )}

                <div className="text-sm text-gray-400">
                  Created by {championship.creator.name || championship.creator.username}
                </div>
              </div>
            </div>

            {/* Championship Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gaming-darker rounded-lg p-4 text-center">
                <CurrencyDollarIcon className="h-6 w-6 text-gaming-accent mx-auto mb-2" />
                <div className="text-sm text-gray-400">Entry Fee</div>
                <div className="text-lg font-semibold text-white">{championship.entryFee} credits</div>
              </div>
              
              <div className="bg-gaming-darker rounded-lg p-4 text-center">
                <TrophyIcon className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Prize Pool</div>
                <div className="text-lg font-semibold text-white">{championship.prizePool} credits</div>
              </div>
              
              <div className="bg-gaming-darker rounded-lg p-4 text-center">
                <UsersIcon className="h-6 w-6 text-gaming-accent mx-auto mb-2" />
                <div className="text-sm text-gray-400">Participants</div>
                <div className="text-lg font-semibold text-white">
                  {championship._count.participants}
                  {championship.maxParticipants && `/${championship.maxParticipants}`}
                </div>
              </div>
              
              <div className="bg-gaming-darker rounded-lg p-4 text-center">
                <ClockIcon className="h-6 w-6 text-gaming-accent mx-auto mb-2" />
                <div className="text-sm text-gray-400">Time</div>
                <div className="text-lg font-semibold text-white">{timeLeft}</div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-gaming-darker rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-gaming-accent mr-2" />
                <span className="font-medium text-white">Schedule</span>
              </div>
              <div className="text-sm text-gray-300">
                <div>Start: {format(new Date(championship.startTime), 'PPP p')}</div>
                <div>End: {format(new Date(championship.endTime), 'PPP p')}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {canJoin && (
                <button
                  onClick={handleJoinChampionship}
                  disabled={isJoining}
                  className="px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 disabled:bg-gaming-accent/50 text-white font-semibold rounded-lg transition-colors"
                >
                  {isJoining ? 'Joining...' : `Join Championship (${championship.entryFee} credits)`}
                </button>
              )}
              
              {canPlay && (
                <button
                  onClick={handlePlayGame}
                  className="px-6 py-3 bg-green-600 hover:bg-green-600/80 text-white font-semibold rounded-lg transition-colors flex items-center"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Play Now
                </button>
              )}
              
              {userParticipation && !canPlay && (
                <div className="px-6 py-3 bg-blue-600/20 border border-blue-600/30 text-blue-400 font-semibold rounded-lg">
                  {championship.status === 'UPCOMING' ? 'Registered - Waiting for start' : 'Championship ended'}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <TrophyIcon className="h-6 w-6 text-gaming-accent mr-2" />
              Leaderboard
            </h2>

            {championship.participants.length > 0 ? (
              <div className="space-y-2">
                {championship.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      participant.user.id === session?.user?.id
                        ? 'bg-gaming-accent/10 border border-gaming-accent/30'
                        : 'bg-gaming-darker'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-black' :
                        'bg-gaming-accent/20 text-gaming-accent'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <div className="font-medium text-white">
                          {participant.user.name || participant.user.username}
                          {participant.user.id === session?.user?.id && (
                            <span className="ml-2 text-xs text-gaming-accent">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Joined {formatDistanceToNow(new Date(participant.joinedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {participant.bestScore.toLocaleString()}
                      </div>
                      {participant.gameScore && (
                        <div className="text-sm text-gray-400">
                          Level {participant.gameScore.level}
                          {participant.gameScore.duration && (
                            <span> • {Math.round(participant.gameScore.duration)}s</span>
                          )}
                        </div>
                      )}
                      {championship.status === 'COMPLETED' && participant.prizeWon > 0 && (
                        <div className="text-sm text-green-400">
                          Won {participant.prizeWon} credits
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No participants yet. Be the first to join!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}