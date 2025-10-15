'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoomProvider, useRoomState, useRoomActions } from '@/lib/room-state';
import { GameInfo, RoomCreationOptions } from '@/lib/room-service';
import { navigateToGameWithRoom } from '@/lib/game-navigation';
import RoomsList from '@/components/features/RoomsList';
import RoomAlternativesModal from '@/components/features/RoomAlternativesModal';
import JoinByCodeModal from '@/components/features/JoinByCodeModal';
import CreateRoomModal from '@/components/features/CreateRoomModal';
import RoomSharingModal from '@/components/features/RoomSharingModal';
import RoomErrorBoundary from '@/components/features/RoomErrorBoundary';
import RoomErrorHandler from '@/components/features/RoomErrorHandler';
import RoomOperationProgress from '@/components/features/RoomOperationProgress';
import { LoadingOverlay, InlineLoading, ConnectionStatus } from '@/components/features/LoadingStates';
import OfflineNotification from '@/components/features/OfflineNotification';
import { ManualRefresh, ConnectionIssuesBanner } from '@/components/features/ManualRefresh';
import { Button } from '@/components/ui';
import { 
  PlusIcon,
  BoltIcon,
  HashtagIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/solid';

// Game info mapping - this will be moved to a proper API later
const GAME_INFO_MAP: Record<string, GameInfo> = {
  'snake-multiplayer': {
    id: 'snake', // Use server's game ID
    name: 'Multiplayer Snake Battle',
    roomType: 'snake_game', // Use server's room type
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Real-time multiplayer snake game with combat mechanics',
    features: ['Real-time multiplayer', 'Combat system', 'Special abilities'],
    settings: {
      gameSpeed: {
        type: 'select',
        label: 'Game Speed',
        default: 'normal',
        options: ['slow', 'normal', 'fast', 'extreme']
      },
      powerUps: {
        type: 'boolean',
        label: 'Enable Power-ups',
        default: true
      },
      mapSize: {
        type: 'select',
        label: 'Map Size',
        default: 'medium',
        options: ['small', 'medium', 'large']
      }
    }
  },
  'box-jump-multiplayer': {
    id: 'box_jump', // Use server's game ID
    name: 'Multiplayer Box Jump',
    roomType: 'box_jump_game', // Use server's room type
    minPlayers: 5,
    maxPlayers: 10, // Match server's maxPlayers
    description: 'Turn-based multiplayer platformer where players take turns attempting levels',
    features: ['Turn-based gameplay', 'Live spectating', 'Competitive progression'],
    settings: {
      turnTime: {
        type: 'number',
        label: 'Turn Time (seconds)',
        default: 60,
        min: 30,
        max: 180
      },
      maxLevels: {
        type: 'number',
        label: 'Maximum Levels',
        default: 20,
        min: 10,
        max: 50
      },
      allowSpectators: {
        type: 'boolean',
        label: 'Allow Spectators',
        default: true
      }
    }
  },
  'the-battle': {
    id: 'the-battle', // Server uses same ID
    name: 'The Battle',
    roomType: 'battle_game', // Use server's room type
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Real-time multiplayer tank battle with rock-paper-scissors mechanics',
    features: ['Real-time multiplayer', 'Strategic combat', 'Dynamic gameplay'],
    settings: {
      gameMode: {
        type: 'select',
        label: 'Game Mode',
        default: 'classic',
        options: ['classic', 'team', 'survival', 'tournament']
      },
      matchDuration: {
        type: 'number',
        label: 'Match Duration (minutes)',
        default: 10,
        min: 5,
        max: 30
      },
      enablePowerUps: {
        type: 'boolean',
        label: 'Enable Power-ups',
        default: true
      }
    }
  }
};

function RoomsViewContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const state = useRoomState();
  const { 
    connectToLobby, 
    setSelectedGame, 
    refreshRooms, 
    clearError, 
    clearRoomJoinError,
    joinRoom,
    joinByCode,
    quickMatch,
    createRoom,
    showCreateModal,
    showJoinByCodeModal,
    showSharingModal,
    showAlternativesModal
  } = useRoomActions();

  const [showConnectionIssues, setShowConnectionIssues] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  useEffect(() => {
    if (gameId) {
      initializeRoomsView();
    }
  }, [gameId]);

  const initializeRoomsView = async () => {
    try {
      console.log('🔄 Initializing rooms view for gameId:', gameId);
      clearError();
      
      // Get game information
      const gameInfo = GAME_INFO_MAP[gameId];
      console.log('🎮 Game info:', gameInfo);
      if (!gameInfo) {
        throw new Error(`Game '${gameId}' not found or not supported for multiplayer`);
      }
      
      // Set selected game (use server's game ID)
      console.log('🎯 Setting selected game...');
      setSelectedGame(gameInfo.id, gameInfo);
      
      // Connect to lobby if not already connected
      if (!state.isConnected) {
        console.log('🔌 Connecting to lobby...');
        await connectToLobby();
        console.log('✅ Connected to lobby');
      } else {
        console.log('✅ Already connected to lobby');
      }
      
      // Refresh rooms for this game
      console.log('🔄 Refreshing rooms...');
      await refreshRooms();
      console.log('✅ Rooms refreshed');
      
    } catch (err) {
      console.error('❌ Failed to initialize rooms view:', err);
    }
  };

  const handleBackToGame = () => {
    router.push(`/games/${gameId}`);
  };

  const handleBackToGames = () => {
    router.push('/games');
  };

  const handleRetry = () => {
    clearError();
    initializeRoomsView();
  };

  const handleManualRefresh = async () => {
    try {
      await refreshRooms();
      setLastRefreshTime(Date.now());
      setShowConnectionIssues(false);
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const handleOfflineReconnect = async () => {
    try {
      await connectToLobby();
      await refreshRooms();
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Offline reconnect failed:', error);
    }
  };

  // Show connection issues banner when there are connection problems
  useEffect(() => {
    if (state.connectionStatus === 'error' || 
        (state.connectionStatus === 'disconnected' && state.gameInfo)) {
      setShowConnectionIssues(true);
    } else if (state.connectionStatus === 'connected') {
      setShowConnectionIssues(false);
    }
  }, [state.connectionStatus, state.gameInfo]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      
      // Navigate to game with room information
      navigateToGameWithRoom(router, {
        gameId,
        roomId,
        connectionType: 'join'
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      // Error handling is done in the room state, including showing alternatives modal
    }
  };

  const handleJoinAlternative = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      
      // Navigate to game with room information
      navigateToGameWithRoom(router, {
        gameId,
        roomId,
        connectionType: 'join'
      });
    } catch (error) {
      console.error('Failed to join alternative room:', error);
    }
  };

  const handleCloseAlternatives = () => {
    showAlternativesModal(false);
    clearRoomJoinError();
  };

  const handleCreateRoom = () => {
    showCreateModal(true);
  };

  const handleCreateRoomSubmit = async (options: RoomCreationOptions) => {
    if (!state.selectedGameId) return;
    
    try {
      const roomId = await createRoom(state.selectedGameId, options);
      
      // Navigate to game with room information
      navigateToGameWithRoom(router, {
        gameId,
        roomId,
        connectionType: 'create',
        isHost: true
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      // Error handling is done in the room state
    }
  };

  const handleCloseCreateRoom = () => {
    showCreateModal(false);
    clearError(); // Clear any creation errors
  };

  const handleCloseSharingModal = () => {
    showSharingModal(false);
  };

  const handleGoToRoom = () => {
    if (state.createdRoomData) {
      // Navigate to game with room information
      navigateToGameWithRoom(router, {
        gameId,
        roomId: state.createdRoomData.roomId,
        connectionType: 'create',
        isHost: true
      });
    }
  };

  const handleJoinByCode = () => {
    showJoinByCodeModal(true);
  };

  const handleJoinByCodeSubmit = async (roomCode: string) => {
    try {
      await joinByCode(roomCode);
      
      // Navigate to game with room code information
      navigateToGameWithRoom(router, {
        gameId,
        roomCode,
        connectionType: 'join_by_code'
      });
    } catch (error) {
      console.error('Failed to join room by code:', error);
      // Error handling is done in the room state
    }
  };

  const handleCloseJoinByCode = () => {
    showJoinByCodeModal(false);
    clearError(); // Clear any join-by-code errors
  };

  const handleQuickMatch = async () => {
    if (!state.selectedGameId) return;
    
    try {
      await quickMatch(state.selectedGameId);
      
      // Navigate to game with quick match information
      navigateToGameWithRoom(router, {
        gameId,
        connectionType: 'quick_match',
        isQuickMatch: true
      });
    } catch (error) {
      console.error('Quick match failed:', error);
    }
  };

  if (state.isLoading && !state.gameInfo) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-center">
          <InlineLoading 
            message="Loading rooms..." 
            size="lg" 
            className="mb-4"
          />
          <div className="flex justify-center">
            <ConnectionStatus status={state.connectionStatus} />
          </div>
        </div>
      </div>
    );
  }

  if (state.error && !state.gameInfo) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Rooms</h1>
          <p className="text-gray-300 mb-6">
            {state.error || `Game '${gameId}' not found or not supported for multiplayer.`}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              onClick={handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToGames}
            >
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.gameInfo) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <InlineLoading message="Initializing..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToGame}
                className="text-gaming-accent hover:text-gaming-accent/80 touch-manipulation tap-target"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back to Game</span>
                <span className="xs:hidden">Back</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-gray-600"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToGames}
                className="text-gray-400 hover:text-gray-300 touch-manipulation tap-target"
              >
                <HomeIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">All Games</span>
                <span className="sm:hidden">Games</span>
              </Button>
            </div>
            
            <ConnectionStatus status={state.connectionStatus} />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-gaming font-bold text-white mb-2">
              <span className="hidden sm:inline">{state.gameInfo.name} - Rooms</span>
              <span className="sm:hidden">{state.gameInfo.name}</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">
              {state.gameInfo.description}
            </p>
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <span>Players: {state.gameInfo.minPlayers}-{state.gameInfo.maxPlayers}</span>
              <span className="hidden xs:inline">•</span>
              <span>Rooms: {state.rooms.length}</span>
              {state.statistics && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden xs:inline">Players: {state.statistics.totalPlayers}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Connection Issues Banner */}
        {showConnectionIssues && (
          <div className="max-w-6xl mx-auto mb-4 sm:mb-6">
            <ConnectionIssuesBanner
              isVisible={showConnectionIssues}
              onRefresh={handleManualRefresh}
              onDismiss={() => setShowConnectionIssues(false)}
              reconnectAttempts={state.connectionStatus === 'error' ? 1 : 0}
            />
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="max-w-6xl mx-auto mb-4 sm:mb-6">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="text-red-400 flex-shrink-0">⚠️</div>
                  <span className="text-red-300 text-sm break-words">{state.error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 touch-manipulation tap-target p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Action Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
            role="group"
            aria-label="Room actions"
          >
            <Button
              size="lg"
              variant="secondary"
              disabled={!state.isConnected || state.joiningRoomId === 'quick-match'}
              onClick={handleQuickMatch}
              className="flex-1 min-h-[48px] sm:min-h-[52px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg"
              aria-label={state.joiningRoomId === 'quick-match' ? 'Finding match...' : 'Find and join an available room automatically'}
            >
              {state.joiningRoomId === 'quick-match' ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                  <span className="truncate">Matching...</span>
                </>
              ) : (
                <>
                  <BoltIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Quick Match</span>
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant="primary"
              disabled={!state.isConnected || state.creatingRoom}
              onClick={handleCreateRoom}
              className="flex-1 min-h-[48px] sm:min-h-[52px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-gaming-accent/25"
              aria-label={state.creatingRoom ? 'Creating room...' : 'Create a new room with custom settings'}
            >
              {state.creatingRoom ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                  <span className="truncate">Creating...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Create Room</span>
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              disabled={!state.isConnected}
              onClick={handleJoinByCode}
              className="flex-1 min-h-[48px] sm:min-h-[52px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg"
              aria-label="Join a private room using a 6-character room code"
            >
              <HashtagIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                <span className="hidden xs:inline">Join by Code</span>
                <span className="xs:hidden">Join Code</span>
              </span>
            </Button>
          </div>

          {/* Rooms List Component */}
          <RoomsList
            rooms={state.rooms}
            gameInfo={state.gameInfo!}
            statistics={state.statistics || undefined}
            isLoading={state.isLoading}
            error={state.error}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onRefresh={refreshRooms}
            joiningRoomId={state.joiningRoomId}
            isConnected={state.isConnected}
          />

          {/* Operation Progress Indicators */}
          <RoomOperationProgress
            operation="creating"
            isVisible={state.creatingRoom}
          />
          
          <RoomOperationProgress
            operation="joining"
            isVisible={!!state.joiningRoomId && state.joiningRoomId !== 'quick-match'}
          />
          
          <RoomOperationProgress
            operation="connecting"
            isVisible={state.connectionStatus === 'connecting'}
          />

          {/* Loading Overlay for initial connection */}
          <LoadingOverlay
            isVisible={state.isLoading && !state.gameInfo}
            message="Connecting to multiplayer server..."
          />

          {/* Offline Notification */}
          <OfflineNotification onReconnect={handleOfflineReconnect} />

          {/* Manual Refresh for Connection Issues */}
          <ManualRefresh
            isVisible={state.connectionStatus === 'error' && !showConnectionIssues}
            onRefresh={handleManualRefresh}
            title="Connection Problems"
            description="Unable to connect to the multiplayer server. Room data may be outdated."
            lastRefresh={lastRefreshTime}
          />

          {/* Join By Code Modal */}
          <JoinByCodeModal
            isOpen={state.showJoinByCodeModal}
            onClose={handleCloseJoinByCode}
            onJoinByCode={handleJoinByCodeSubmit}
            isJoining={!!state.joiningRoomId}
            error={state.error}
          />

          {/* Create Room Modal */}
          <CreateRoomModal
            gameInfo={state.gameInfo!}
            isOpen={state.showCreateModal}
            onClose={handleCloseCreateRoom}
            onCreateRoom={handleCreateRoomSubmit}
            isCreating={state.creatingRoom}
            error={state.error}
          />

          {/* Room Sharing Modal */}
          <RoomSharingModal
            isOpen={state.showSharingModal}
            onClose={handleCloseSharingModal}
            roomData={state.createdRoomData ? {
              roomId: state.createdRoomData.roomId,
              roomCode: state.createdRoomData.roomCode,
              gameId: gameId,
              gameName: state.gameInfo?.name || 'Game',
              inviteLink: typeof window !== 'undefined' 
                ? `${window.location.origin}/games/${gameId}/rooms?join=${state.createdRoomData.roomCode}`
                : `https://yourgamesite.com/games/${gameId}/rooms?join=${state.createdRoomData.roomCode}`,
              isPrivate: state.createdRoomData.isPrivate,
              maxPlayers: state.createdRoomData.maxPlayers
            } : null}
            onStartGame={handleGoToRoom}
          />

          {/* Room Alternatives Modal */}
          <RoomAlternativesModal
            isOpen={state.showAlternativesModal}
            onClose={handleCloseAlternatives}
            alternatives={state.roomAlternatives}
            onJoinAlternative={handleJoinAlternative}
            originalRoomCode={state.roomJoinError?.roomId ? 
              state.rooms.find(r => r.roomId === state.roomJoinError?.roomId)?.roomCode : 
              undefined
            }
            isJoining={!!state.joiningRoomId}
            joiningRoomId={state.joiningRoomId}
          />
        </div>
      </div>
    </div>
  );
}

export default function RoomsViewPage() {
  return (
    <RoomErrorBoundary>
      <RoomProvider>
        <RoomErrorHandler>
          <RoomsViewContent />
        </RoomErrorHandler>
      </RoomProvider>
    </RoomErrorBoundary>
  );
}