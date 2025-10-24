'use client';

import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import RoomCard from './RoomCard';
import { Button } from '@/components/ui';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  SignalIcon,
  WifiIcon
} from '@heroicons/react/24/solid';
import { ActiveRoom, GameInfo, RoomStatistics } from '@/lib/room-service';
import { RoomListSkeleton } from './RoomCardSkeleton';
import { InlineLoading, EmptyState } from './LoadingStates';

interface RoomsListProps {
  rooms: ActiveRoom[];
  gameInfo: GameInfo;
  statistics?: RoomStatistics;
  isLoading?: boolean;
  error?: string | null;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom?: () => void;
  onRefresh?: () => void;
  joiningRoomId?: string | null;
  isConnected?: boolean;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'players-asc' | 'players-desc' | 'state';
type FilterOption = 'all' | 'public' | 'private' | 'joinable' | 'lobby' | 'playing';

const RoomsList: React.FC<RoomsListProps> = memo(({
  rooms,
  gameInfo,
  statistics,
  isLoading = false,
  error = null,
  onJoinRoom,
  onCreateRoom,
  onRefresh,
  joiningRoomId = null,
  isConnected = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Track real-time updates (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastUpdateTime(Date.now());
    }, 100); // Debounce updates
    
    return () => clearTimeout(timer);
  }, [rooms]);

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(room => 
        room.roomCode.toLowerCase().includes(query) ||
        room.roomId.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'public':
        filtered = filtered.filter(room => !room.isPrivate);
        break;
      case 'private':
        filtered = filtered.filter(room => room.isPrivate);
        break;
      case 'joinable':
        filtered = filtered.filter(room => 
          room.state === 'LOBBY' && room.playerCount < room.maxPlayers
        );
        break;
      case 'lobby':
        filtered = filtered.filter(room => room.state === 'LOBBY');
        break;
      case 'playing':
        filtered = filtered.filter(room =>
          room.state === 'PLAYING' ||
          room.state === 'COUNTDOWN' ||
          room.state === 'RESULTS' ||
          room.state === 'RESET'
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'players-asc':
          return a.playerCount - b.playerCount;
        case 'players-desc':
          return b.playerCount - a.playerCount;
        case 'state':
          const stateOrder: Record<ActiveRoom['state'], number> = {
            LOBBY: 0,
            COUNTDOWN: 1,
            PLAYING: 2,
            RESULTS: 3,
            RESET: 4
          };
          return stateOrder[a.state] - stateOrder[b.state];
        default:
          return 0;
      }
    });

    return sorted;
  }, [rooms, searchQuery, sortBy, filterBy]);

  // Get filter counts for display
  const filterCounts = useMemo(() => {
    return {
      all: rooms.length,
      public: rooms.filter(room => !room.isPrivate).length,
      private: rooms.filter(room => room.isPrivate).length,
      joinable: rooms.filter(room => 
        room.state === 'LOBBY' && room.playerCount < room.maxPlayers
      ).length,
      lobby: rooms.filter(room => room.state === 'LOBBY').length,
      playing: rooms.filter(room =>
        room.state === 'PLAYING' ||
        room.state === 'COUNTDOWN' ||
        room.state === 'RESULTS' ||
        room.state === 'RESET'
      ).length
    };
  }, [rooms]);

  // Memoize event handlers
  const handleJoinRoom = useCallback((roomId: string) => {
    onJoinRoom(roomId);
  }, [onJoinRoom]);

  const handleRefresh = useCallback(() => {
    if (onRefresh && !isLoading) {
      onRefresh();
    }
  }, [onRefresh, isLoading]);

  const handleFilterChange = useCallback((filter: FilterOption) => {
    setFilterBy(filter);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterBy('all');
  }, []);

  // Empty state component
  const EmptyRoomsState: React.FC<{ hasFilters: boolean }> = ({ hasFilters }) => (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        {hasFilters ? (
          <>
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No rooms match your filters
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filter criteria to find more rooms.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </>
        ) : (
          <>
            <UserGroupIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No active rooms
            </h3>
            <p className="text-gray-400 mb-6">
              There are currently no active rooms for {gameInfo.name}. 
              Be the first to create one!
            </p>
            <div className="space-y-2">
              {onCreateRoom && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCreateRoom}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Error state component
  const ErrorState: React.FC = () => (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Unable to load rooms
        </h3>
        <p className="text-gray-400 mb-6">
          {error || 'There was an error loading the room list. Please try again.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    </div>
  );



  if (error) {
    return <ErrorState />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Bar */}
      {statistics && (
        <div className="bg-gaming-dark/50 border border-gaming-accent/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Live Statistics</h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-400">
              {isConnected ? (
                <>
                  <WifiIcon className="h-3 w-3 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 hidden xs:inline">Live</span>
                </>
              ) : (
                <>
                  <SignalIcon className="h-3 w-3 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 hidden xs:inline">Offline</span>
                </>
              )}
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Updated {new Date(lastUpdateTime).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gaming-accent">{statistics.totalRooms}</p>
              <p className="text-xs text-gray-400">
                <span className="hidden xs:inline">Total </span>Rooms
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-green-400">{statistics.totalPlayers}</p>
              <p className="text-xs text-gray-400">
                <span className="hidden xs:inline">Active </span>Players
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{statistics.roomsByState.LOBBY}</p>
              <p className="text-xs text-gray-400">Waiting</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-yellow-300">{statistics.roomsByState.COUNTDOWN}</p>
              <p className="text-xs text-gray-400">Starting</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-purple-400">{statistics.roomsByState.PLAYING}</p>
              <p className="text-xs text-gray-400">Playing</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-amber-400">{statistics.roomsByState.RESULTS}</p>
              <p className="text-xs text-gray-400">Results</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-orange-400">{statistics.roomsByState.RESET ?? 0}</p>
              <p className="text-xs text-gray-400">Resetting</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <label htmlFor="room-search" className="sr-only">
            Search rooms by room code
          </label>
          <MagnifyingGlassIcon 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" 
            aria-hidden="true"
          />
          <input
            id="room-search"
            type="text"
            placeholder="Search by room code..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gaming-dark border border-gaming-accent/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gaming-accent/40 focus:ring-2 focus:ring-gaming-accent/20 transition-all duration-200 text-sm sm:text-base touch-manipulation"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="search-results-count"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFilters}
            className="text-gray-400 hover:text-white touch-manipulation tap-target"
            aria-expanded={showFilters}
            aria-controls="filter-controls"
            aria-label={`${showFilters ? 'Hide' : 'Show'} room filters`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">Filters {showFilters ? '▲' : '▼'}</span>
          </Button>
          
          <div 
            id="search-results-count"
            className="text-xs sm:text-sm text-gray-400"
            aria-live="polite"
          >
            <span className="hidden xs:inline">{filteredAndSortedRooms.length} of {rooms.length} </span>
            <span className="xs:hidden">{filteredAndSortedRooms.length}/{rooms.length} </span>
            rooms
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div 
            id="filter-controls"
            className="bg-gaming-dark/50 border border-gaming-accent/20 rounded-lg p-3 sm:p-4 space-y-4"
            role="region"
            aria-label="Room filter controls"
          >
            {/* Filter Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Filter by:</p>
              <div 
                className="flex flex-wrap gap-1.5 sm:gap-2"
                role="group"
                aria-label="Room filter options"
              >
                {Object.entries(filterCounts).map(([filter, count]) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter as FilterOption)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation tap-target ${
                      filterBy === filter
                        ? 'bg-gaming-accent text-white shadow-lg shadow-gaming-accent/25'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-600 hover:shadow-md'
                    }`}
                    aria-pressed={filterBy === filter}
                    aria-label={`Filter by ${filter}, ${count} rooms available`}
                  >
                    <span className="hidden xs:inline">
                      {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                    </span>
                    <span className="xs:hidden">
                      {filter.charAt(0).toUpperCase() + filter.slice(1).substring(0, 3)} ({count})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Sort by:</p>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="w-full sm:w-auto bg-gaming-dark border border-gaming-accent/20 rounded-lg px-3 py-2.5 sm:py-2 text-white text-sm focus:outline-none focus:border-gaming-accent/40 touch-manipulation"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="players-desc">Most Players</option>
                <option value="players-asc">Fewest Players</option>
                <option value="state">By Status</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div role="status" aria-label="Loading rooms">
          <RoomListSkeleton count={6} />
        </div>
      ) : filteredAndSortedRooms.length === 0 ? (
        <EmptyRoomsState hasFilters={searchQuery.trim() !== '' || filterBy !== 'all'} />
      ) : (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          role="list"
          aria-label={`${filteredAndSortedRooms.length} available rooms for ${gameInfo.name}`}
        >
          {filteredAndSortedRooms.map((room, index) => (
            <div key={room.roomId} role="listitem">
              <RoomCard
                room={room}
                gameInfo={gameInfo}
                onJoinRoom={handleJoinRoom}
                isJoining={joiningRoomId === room.roomId}
                className={`animate-stagger-${Math.min(index + 1, 5)}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.rooms.length === nextProps.rooms.length &&
    prevProps.rooms.every((room, index) => {
      const nextRoom = nextProps.rooms[index];
      return room && nextRoom && 
        room.roomId === nextRoom.roomId &&
        room.playerCount === nextRoom.playerCount &&
        room.state === nextRoom.state;
    }) &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.joiningRoomId === nextProps.joiningRoomId &&
    prevProps.isConnected === nextProps.isConnected &&
    JSON.stringify(prevProps.statistics) === JSON.stringify(nextProps.statistics)
  );
});

RoomsList.displayName = 'RoomsList';

export default RoomsList;