'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui';
import { CardContent } from '@/components/ui';
import {
  UserGroupIcon,
  LockClosedIcon,
  PlayIcon,
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  SignalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { ActiveRoom, GameInfo } from '@/lib/room-service';
import { ButtonLoading } from './LoadingStates';

interface RoomCardProps {
  room: ActiveRoom;
  gameInfo: GameInfo;
  onJoinRoom: (roomId: string) => void;
  isJoining?: boolean;
  className?: string;
}

const RoomCard: React.FC<RoomCardProps> = memo(({ 
  room, 
  gameInfo, 
  onJoinRoom, 
  isJoining = false,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [prevPlayerCount, setPrevPlayerCount] = useState(room.playerCount);
  const [prevState, setPrevState] = useState(room.state);
  const [phaseRemaining, setPhaseRemaining] = useState<number | null>(null);

  // Detect real-time updates and show visual feedback (debounced)
  useEffect(() => {
    if (room.playerCount !== prevPlayerCount || room.state !== prevState) {
      setIsUpdated(true);
      setPrevPlayerCount(room.playerCount);
      setPrevState(room.state);
      
      // Remove the update indicator after animation
      const timer = setTimeout(() => {
        setIsUpdated(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [room.playerCount, room.state, prevPlayerCount, prevState]);

  // Memoize expensive calculations
  const roomMetrics = useMemo(() => {
    const capacityPercentage = (room.playerCount / room.maxPlayers) * 100;
    const isRoomFull = room.playerCount >= room.maxPlayers;
    const isRoomJoinable = room.state === 'LOBBY' && !isRoomFull;
    
    return {
      capacityPercentage,
      isRoomFull,
      isRoomJoinable
    };
  }, [room.playerCount, room.maxPlayers, room.state]);

  const { capacityPercentage, isRoomFull, isRoomJoinable } = roomMetrics;

  useEffect(() => {
    if (typeof room.phaseEndsAt !== 'number' || room.phaseEndsAt <= Date.now()) {
      if (room.state === 'COUNTDOWN' && typeof room.countdown === 'number') {
        setPhaseRemaining(room.countdown);
      } else {
        setPhaseRemaining(null);
      }
      return;
    }

    const updateRemaining = () => {
      const target = room.phaseEndsAt as number;
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setPhaseRemaining(remaining > 0 ? remaining : 0);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [room.phaseEndsAt, room.state, room.countdown, room.roomId]);

  // Memoize room state display info
  const stateInfo = useMemo(() => {
    switch (room.state) {
      case 'LOBBY':
        return {
          label: 'Waiting',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          icon: ClockIcon
        };
      case 'COUNTDOWN':
        return {
          label: 'Starting',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          icon: PlayIcon
        };
      case 'PLAYING':
        return {
          label: 'In Game',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          icon: PlayIcon
        };
      case 'RESULTS':
        return {
          label: 'Results',
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          icon: TrophyIcon
        };
      case 'RESET':
        return {
          label: 'Resetting',
          color: 'text-orange-300',
          bgColor: 'bg-orange-300/10',
          icon: ArrowPathIcon
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          icon: EyeIcon
        };
    }
  }, [room.state]);

  const StateIcon = stateInfo.icon;

  const phaseLabel = useMemo(() => {
    if (phaseRemaining === null || phaseRemaining <= 0) return null;

    switch (room.state) {
      case 'COUNTDOWN':
        return `${phaseRemaining}s`;
      case 'RESULTS':
        return `${phaseRemaining}s to lobby`;
      case 'RESET':
        return `${phaseRemaining}s`;
      default:
        return null;
    }
  }, [phaseRemaining, room.state]);

  // Memoize formatted room age
  const roomAge = useMemo(() => {
    const now = Date.now();
    const ageMs = now - room.createdAt;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    
    if (ageMinutes < 1) return 'Just created';
    if (ageMinutes < 60) return `${ageMinutes}m ago`;
    
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return `${ageHours}h ago`;
    
    const ageDays = Math.floor(ageHours / 24);
    return `${ageDays}d ago`;
  }, [room.createdAt]);

  // Memoize event handlers
  const handleJoinClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isRoomJoinable && !isJoining) {
      onJoinRoom(room.roomId);
    }
  }, [isRoomJoinable, isJoining, onJoinRoom, room.roomId]);

  // Mobile touch handlers
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div 
      className={`group bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-gaming-accent/40 hover:shadow-lg hover:shadow-gaming-accent/10 touch-manipulation animate-room-enter ${
        isPressed ? 'scale-95 animate-button-press' : ''
      } ${isUpdated ? 'ring-2 ring-gaming-accent/50 border-gaming-accent/60 animate-room-update' : ''} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="article"
      aria-label={`Room ${room.roomCode} for ${gameInfo.name}`}
      aria-describedby={`room-${room.roomId}-details`}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Room Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Room Code */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-mono font-bold text-base sm:text-lg text-white tracking-wider">
                {room.roomCode}
              </h3>
              {room.isPrivate && (
                <LockClosedIcon 
                  className="h-3 w-3 sm:h-4 sm:w-4 text-gaming-accent flex-shrink-0" 
                  aria-label="Private room"
                />
              )}
            </div>
            
            {/* Room Age */}
            <p className="text-gray-400 text-xs">
              {roomAge}
            </p>
          </div>

          {/* Room State Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${stateInfo.color} ${stateInfo.bgColor} ${
              isUpdated ? 'animate-pulse' : ''
            }`}
            role="status"
            aria-label={`Room status: ${stateInfo.label}`}
          >
            <StateIcon className="h-3 w-3" aria-hidden="true" />
            <span className="hidden xs:inline">{stateInfo.label}</span>
            {phaseLabel && (
              <span className="text-[10px] leading-none text-gray-300/90">
                {phaseLabel}
              </span>
            )}
            {isUpdated && (
              <SignalIcon
                className="h-3 w-3 animate-bounce text-gaming-accent"
                aria-label="Room updated"
              />
            )}
          </div>
        </div>

        {/* Player Count Section */}
        <div className="mb-3 sm:mb-4" id={`room-${room.roomId}-details`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300">
              <UserGroupIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="sr-only">Players: </span>
                {room.playerCount}/{room.maxPlayers}
                <span className="hidden xs:inline"> players</span>
              </span>
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">
              {Math.round(capacityPercentage)}% full
            </span>
          </div>
          
          {/* Capacity Bar */}
          <div 
            className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={room.playerCount}
            aria-valuemin={0}
            aria-valuemax={room.maxPlayers}
            aria-label={`Room capacity: ${room.playerCount} of ${room.maxPlayers} players`}
          >
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                capacityPercentage >= 100 
                  ? 'bg-red-500' 
                  : capacityPercentage >= 75 
                    ? 'bg-yellow-500' 
                    : 'bg-gaming-accent'
              }`}
              style={{ 
                width: `${Math.min(capacityPercentage, 100)}%`,
                transition: 'width 0.5s ease-out, background-color 0.3s ease-out'
              }}
            />
          </div>
        </div>

        {/* Game Info */}
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gaming-accent/5 rounded-lg border border-gaming-accent/10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-xs sm:text-sm truncate">{gameInfo.name}</p>
              <p className="text-gray-400 text-xs line-clamp-1 sm:line-clamp-2">{gameInfo.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-gaming-accent text-xs font-medium">
                <span className="hidden sm:inline">{gameInfo.minPlayers}-</span>{gameInfo.maxPlayers}
                <span className="hidden xs:inline"> players</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          {isRoomJoinable ? (
            <Button 
              size="sm" 
              className="w-full bg-gaming-accent hover:bg-gaming-accent/80 hover:shadow-lg hover:shadow-gaming-accent/25 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation tap-target min-h-[44px] text-sm"
              onClick={handleJoinClick}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isJoining}
              aria-describedby={`room-${room.roomId}-details`}
              aria-label={`Join room ${room.roomCode} with ${room.playerCount} of ${room.maxPlayers} players`}
            >
              <ButtonLoading isLoading={isJoining} loadingText="Joining...">
                <UserGroupIcon className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">Join Room</span>
              </ButtonLoading>
            </Button>
          ) : isRoomFull ? (
            <Button 
              size="sm" 
              className="w-full min-h-[44px] text-sm"
              variant="outline"
              disabled
              aria-label={`Room ${room.roomCode} is full with ${room.maxPlayers} players`}
            >
              <UserGroupIcon className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">Room Full</span>
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="w-full min-h-[44px] text-sm"
              variant="outline"
              disabled
              aria-label={`Room ${room.roomCode} is ${stateInfo.label.toLowerCase()}`}
            >
              <StateIcon className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{stateInfo.label}</span>
            </Button>
          )}
          
          {/* Room Details */}
          <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
            <span className="truncate">ID: {room.roomId.slice(-8)}</span>
            <span className="flex-shrink-0">{room.isPrivate ? 'Private' : 'Public'}</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.room.roomId === nextProps.room.roomId &&
    prevProps.room.playerCount === nextProps.room.playerCount &&
    prevProps.room.state === nextProps.room.state &&
    prevProps.room.maxPlayers === nextProps.room.maxPlayers &&
    prevProps.room.isPrivate === nextProps.room.isPrivate &&
    prevProps.isJoining === nextProps.isJoining &&
    prevProps.className === nextProps.className
  );
});

RoomCard.displayName = 'RoomCard';

export default RoomCard;