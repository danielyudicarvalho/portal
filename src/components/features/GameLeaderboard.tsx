'use client';

import React, { useState, useEffect } from 'react';
import { TrophyIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

interface LeaderboardEntry {
  rank: number;
  score: number;
  level: number;
  duration?: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface GameLeaderboardProps {
  gameId: string;
  className?: string;
}

type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export function GameLeaderboard({ gameId, className = '' }: GameLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>('ALL_TIME');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [gameId, period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/games/${gameId}/scores?period=${period}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <TrophyIcon className="h-5 w-5 text-gray-400" />;
      case 3:
        return <TrophyIcon className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-semibold">#{rank}</span>;
    }
  };

  const periodLabels = {
    DAILY: 'Today',
    WEEKLY: 'This Week',
    MONTHLY: 'This Month',
    ALL_TIME: 'All Time'
  };

  return (
    <div className={`bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrophyIcon className="h-6 w-6 text-gaming-accent mr-2" />
          <h3 className="text-xl font-semibold text-white">Leaderboard</h3>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
          className="bg-gaming-darker border border-gaming-accent/20 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-gaming-accent"
        >
          {Object.entries(periodLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gaming-accent mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-2 px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <TrophyIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No scores yet</p>
          <p className="text-gray-500 text-sm">Be the first to set a record!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.user.id}-${entry.rank}`}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.rank <= 3
                  ? 'bg-gaming-accent/10 border border-gaming-accent/20'
                  : 'bg-gaming-darker hover:bg-gaming-accent/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex items-center space-x-2">
                  {entry.user.avatar ? (
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gaming-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-gaming-accent text-sm font-semibold">
                        {entry.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-white font-medium text-sm">{entry.user.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Level {entry.level}</span>
                      {entry.duration && (
                        <>
                          <span>•</span>
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDuration(entry.duration)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-gaming-accent font-bold">
                  <StarIcon className="h-4 w-4 mr-1" />
                  {entry.score.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}