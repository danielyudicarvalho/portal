'use client';

import React from 'react';
import { 
  TrophyIcon, 
  UsersIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

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

interface ChampionshipCardProps {
  championship: Championship;
  onJoin?: (championshipId: string) => void;
  onView?: (championshipId: string) => void;
  userParticipating?: boolean;
  isLoading?: boolean;
}

export function ChampionshipCard({ 
  championship, 
  onJoin, 
  onView, 
  userParticipating = false,
  isLoading = false 
}: ChampionshipCardProps) {
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

  const getTimeDisplay = () => {
    const now = new Date();
    const startTime = new Date(championship.startTime);
    const endTime = new Date(championship.endTime);

    if (championship.status === 'UPCOMING') {
      return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
    } else if (championship.status === 'ACTIVE') {
      return `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    } else {
      return `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    }
  };

  const canJoin = championship.status === 'UPCOMING' && 
                  !userParticipating && 
                  (!championship.maxParticipants || championship._count.participants < championship.maxParticipants);

  return (
    <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden hover:border-gaming-accent/40 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gaming-accent/10">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white truncate flex-1 mr-2">
            {championship.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(championship.status)}`}>
            {championship.status}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-400 mb-2">
          <img 
            src={championship.game.thumbnail} 
            alt={championship.game.title}
            className="w-6 h-6 rounded mr-2"
          />
          <span>{championship.game.title}</span>
        </div>

        {championship.description && (
          <p className="text-sm text-gray-300 line-clamp-2">
            {championship.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm">
            <CurrencyDollarIcon className="h-4 w-4 text-gaming-accent mr-2" />
            <span className="text-gray-300">
              Entry: <span className="text-white font-medium">{championship.entryFee}</span> credits
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <TrophyIcon className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-gray-300">
              Prize: <span className="text-white font-medium">{championship.prizePool}</span> credits
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm">
            <UsersIcon className="h-4 w-4 text-gaming-accent mr-2" />
            <span className="text-gray-300">
              {championship._count.participants}
              {championship.maxParticipants && `/${championship.maxParticipants}`} players
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <ClockIcon className="h-4 w-4 text-gaming-accent mr-2" />
            <span className="text-gray-300 truncate">
              {getTimeDisplay()}
            </span>
          </div>
        </div>

        {/* Time Range */}
        <div className="flex items-center text-xs text-gray-400 pt-2 border-t border-gaming-accent/10">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>
            {format(new Date(championship.startTime), 'MMM d, HH:mm')} - {format(new Date(championship.endTime), 'MMM d, HH:mm')}
          </span>
        </div>

        {/* Top Participants Preview */}
        {championship.participants && championship.participants.length > 0 && (
          <div className="pt-2 border-t border-gaming-accent/10">
            <div className="text-xs text-gray-400 mb-2">Top Players:</div>
            <div className="space-y-1">
              {championship.participants.slice(0, 3).map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <span className="text-gaming-accent mr-2">#{index + 1}</span>
                    <span className="text-gray-300">
                      {participant.user.name || participant.user.username}
                    </span>
                  </div>
                  <span className="text-white font-medium">
                    {participant.bestScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gaming-accent/10">
        <div className="flex gap-2">
          {canJoin && onJoin && (
            <button
              onClick={() => onJoin(championship.id)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 disabled:bg-gaming-accent/50 text-white font-medium rounded text-sm transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Championship'}
            </button>
          )}
          
          {userParticipating && (
            <div className="flex-1 px-4 py-2 bg-green-600/20 border border-green-600/30 text-green-400 font-medium rounded text-sm text-center">
              Participating
            </div>
          )}
          
          <button
            onClick={() => onView?.(championship.id)}
            className="px-4 py-2 bg-gaming-dark border border-gaming-accent/30 hover:border-gaming-accent/50 text-white font-medium rounded text-sm transition-colors"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}