/**
 * Room State Management - Context and reducer for managing room state
 * Provides centralized state management for room operations and real-time updates
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  RoomService, 
  ActiveRoom, 
  RoomStatistics, 
  ConnectionStatus, 
  ConnectionError,
  GameInfo,
  RoomJoinError,
  RoomAlternative,
  RoomCreationOptions,
  getRoomService 
} from './room-service';

// Debounce utility for performance optimization
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Throttle utility for high-frequency updates
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

// State interface
export interface RoomState {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  
  // Room data
  rooms: ActiveRoom[];
  selectedGameId: string | null;
  gameInfo: GameInfo | null;
  statistics: RoomStatistics | null;
  
  // UI state
  showCreateModal: boolean;
  showJoinByCodeModal: boolean;
  showSharingModal: boolean;
  joiningRoomId: string | null;
  creatingRoom: boolean;
  createdRoomData: { roomId: string; roomCode: string; isPrivate: boolean; maxPlayers: number } | null;
  
  // Error handling and alternatives
  roomJoinError: RoomJoinError | null;
  roomAlternatives: RoomAlternative[];
  showAlternativesModal: boolean;
  
  // Real-time updates
  lastUpdate: number;
}

// Action types
export type RoomAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ROOMS'; payload: { rooms: ActiveRoom[]; statistics: RoomStatistics } }
  | { type: 'SET_SELECTED_GAME'; payload: { gameId: string; gameInfo: GameInfo } }
  | { type: 'ROOM_STATE_CHANGED'; payload: { roomId: string; newState: ActiveRoom['state']; metadata?: Partial<ActiveRoom> } }
  | { type: 'ROOM_CREATED'; payload: { roomId: string; roomCode: string; isPrivate: boolean; maxPlayers: number } }
  | { type: 'ROOM_JOINED'; payload: { roomId: string } }
  | { type: 'ROOM_DISPOSED'; payload: { roomId: string } }
  | { type: 'SET_SHOW_CREATE_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_JOIN_BY_CODE_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_SHARING_MODAL'; payload: boolean }
  | { type: 'SET_JOINING_ROOM'; payload: string | null }
  | { type: 'SET_CREATING_ROOM'; payload: boolean }
  | { type: 'SET_CREATED_ROOM_DATA'; payload: { roomId: string; roomCode: string; isPrivate: boolean; maxPlayers: number } | null }
  | { type: 'SET_ROOM_JOIN_ERROR'; payload: RoomJoinError | null }
  | { type: 'SET_ROOM_ALTERNATIVES'; payload: RoomAlternative[] }
  | { type: 'SET_SHOW_ALTERNATIVES_MODAL'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: RoomState = {
  isConnected: false,
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',
  rooms: [],
  selectedGameId: null,
  gameInfo: null,
  statistics: null,
  showCreateModal: false,
  showJoinByCodeModal: false,
  showSharingModal: false,
  joiningRoomId: null,
  creatingRoom: false,
  createdRoomData: null,
  roomJoinError: null,
  roomAlternatives: [],
  showAlternativesModal: false,
  lastUpdate: 0
};

// Reducer
function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'SET_CONNECTION_STATUS':
      return { 
        ...state, 
        connectionStatus: action.payload,
        isConnected: action.payload === 'connected'
      };
      
    case 'SET_CONNECTED':
      return { 
        ...state, 
        isConnected: action.payload,
        error: action.payload ? null : state.error
      };
      
    case 'SET_ROOMS':
      return { 
        ...state, 
        rooms: action.payload.rooms,
        statistics: action.payload.statistics,
        lastUpdate: Date.now(),
        isLoading: false,
        error: null
      };
      
    case 'SET_SELECTED_GAME':
      return { 
        ...state, 
        selectedGameId: action.payload.gameId,
        gameInfo: action.payload.gameInfo,
        rooms: [], // Clear rooms when switching games
        statistics: null
      };
      
    case 'ROOM_STATE_CHANGED':
      return {
        ...state,
        rooms: state.rooms.map(room =>
          room.roomId === action.payload.roomId
            ? {
                ...room,
                state: action.payload.newState,
                ...(action.payload.metadata ? action.payload.metadata : {})
              }
            : room
        ),
        lastUpdate: Date.now()
      };
      
    case 'ROOM_CREATED':
      return { 
        ...state, 
        creatingRoom: false,
        showCreateModal: false,
        showSharingModal: true,
        createdRoomData: action.payload,
        error: null
      };
      
    case 'ROOM_JOINED':
      return { 
        ...state, 
        joiningRoomId: null,
        showJoinByCodeModal: false,
        error: null
      };
      
    case 'ROOM_DISPOSED':
      return {
        ...state,
        rooms: state.rooms.filter(room => room.roomId !== action.payload.roomId),
        lastUpdate: Date.now()
      };
      
    case 'SET_SHOW_CREATE_MODAL':
      return { ...state, showCreateModal: action.payload };
      
    case 'SET_SHOW_JOIN_BY_CODE_MODAL':
      return { ...state, showJoinByCodeModal: action.payload };
      
    case 'SET_SHOW_SHARING_MODAL':
      return { ...state, showSharingModal: action.payload };
      
    case 'SET_CREATED_ROOM_DATA':
      return { ...state, createdRoomData: action.payload };
      
    case 'SET_JOINING_ROOM':
      return { ...state, joiningRoomId: action.payload };
      
    case 'SET_CREATING_ROOM':
      return { ...state, creatingRoom: action.payload };
      
    case 'SET_ROOM_JOIN_ERROR':
      return { 
        ...state, 
        roomJoinError: action.payload,
        roomAlternatives: action.payload?.alternatives || [],
        showAlternativesModal: action.payload?.code === 'ROOM_FULL' && (action.payload?.alternatives?.length || 0) > 0
      };
      
    case 'SET_ROOM_ALTERNATIVES':
      return { ...state, roomAlternatives: action.payload };
      
    case 'SET_SHOW_ALTERNATIVES_MODAL':
      return { ...state, showAlternativesModal: action.payload };
      
    case 'RESET_STATE':
      return { ...initialState };
      
    default:
      return state;
  }
}

// Context
interface RoomContextType {
  state: RoomState;
  dispatch: React.Dispatch<RoomAction>;
  roomService: RoomService;
  
  // Action creators
  connectToLobby: () => Promise<void>;
  disconnectFromLobby: () => Promise<void>;
  setSelectedGame: (gameId: string, gameInfo: GameInfo) => void;
  refreshRooms: () => Promise<void>;
  createRoom: (gameId: string, options: any) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  joinByCode: (roomCode: string) => Promise<void>;
  quickMatch: (gameId: string) => Promise<void>;
  showCreateModal: (show: boolean) => void;
  showJoinByCodeModal: (show: boolean) => void;
  showSharingModal: (show: boolean) => void;
  showAlternativesModal: (show: boolean) => void;
  clearError: () => void;
  clearRoomJoinError: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

// Provider component
interface RoomProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

export function RoomProvider({ children, serverUrl }: RoomProviderProps) {
  const [state, dispatch] = useReducer(roomReducer, initialState);
  const roomService = getRoomService(serverUrl);
  
  // Performance optimization: batch updates and debounce rapid changes
  const updateBatchRef = useRef<{
    rooms?: ActiveRoom[];
    statistics?: RoomStatistics;
    stateChanges?: Array<{ roomId: string; newState: ActiveRoom['state']; metadata?: Partial<ActiveRoom> }>;
    timeout?: NodeJS.Timeout;
  }>({});

  // Debounced room updates to prevent excessive re-renders
  const debouncedRoomUpdate = useDebounce((rooms: ActiveRoom[], statistics: RoomStatistics) => {
    dispatch({ type: 'SET_ROOMS', payload: { rooms, statistics } });
  }, 100);

  // Throttled state changes to batch rapid updates
  // Batch multiple room state changes
  const batchStateChanges = useCallback((roomId: string, newState: ActiveRoom['state'], metadata: Partial<ActiveRoom> = {}) => {
    if (!updateBatchRef.current.stateChanges) {
      updateBatchRef.current.stateChanges = [];
    }

    // Update or add the state change
    const existingIndex = updateBatchRef.current.stateChanges.findIndex(change => change.roomId === roomId);
    if (existingIndex >= 0) {
      updateBatchRef.current.stateChanges[existingIndex].newState = newState;
      updateBatchRef.current.stateChanges[existingIndex].metadata = {
        ...(updateBatchRef.current.stateChanges[existingIndex].metadata || {}),
        ...metadata
      };
    } else {
      updateBatchRef.current.stateChanges.push({ roomId, newState, metadata });
    }
    
    // Clear existing timeout
    if (updateBatchRef.current.timeout) {
      clearTimeout(updateBatchRef.current.timeout);
    }
    
    // Set new timeout to process batch
    updateBatchRef.current.timeout = setTimeout(() => {
      if (updateBatchRef.current.stateChanges) {
        updateBatchRef.current.stateChanges.forEach(({ roomId, newState, metadata }) => {
          dispatch({ type: 'ROOM_STATE_CHANGED', payload: { roomId, newState, metadata } });
        });
        updateBatchRef.current.stateChanges = [];
      }
    }, 150);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    };

    const handleDisconnected = () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    };

    const handleConnectionStatusChanged = ({ status }: { status: ConnectionStatus }) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
    };

    const handleRoomsUpdated = ({ rooms, statistics }: { rooms: ActiveRoom[]; statistics: RoomStatistics }) => {
      // Track message performance
      trackMessagePerformance();
      
      // Use debounced update to prevent excessive re-renders
      debouncedRoomUpdate(rooms, statistics);
    };

    const handleRoomStateChanged = (data: { roomId: string; newState: ActiveRoom['state']; [key: string]: any }) => {
      const { roomId, newState, playerCount, phaseStartedAt, phaseEndsAt, countdown } = data;
      // Track message performance
      trackMessagePerformance();

      // Use batched state changes for better performance
      batchStateChanges(roomId, newState, {
        ...(typeof playerCount === 'number' ? { playerCount } : {}),
        ...(typeof phaseStartedAt === 'number' ? { phaseStartedAt } : {}),
        ...(typeof phaseEndsAt === 'number' ? { phaseEndsAt } : {}),
        ...(typeof countdown === 'number' ? { countdown } : {})
      });
    };

    const handleRoomCreated = ({ roomId, roomCode }: { roomId: string; roomCode: string }) => {
      // Get the creation options from the temporary storage
      const creationOptions = (roomService as any)._lastCreationOptions as RoomCreationOptions;
      const gameInfo = state.gameInfo;
      
      dispatch({ 
        type: 'ROOM_CREATED', 
        payload: { 
          roomId, 
          roomCode,
          isPrivate: creationOptions?.isPrivate || false,
          maxPlayers: creationOptions?.maxPlayers || gameInfo?.maxPlayers || 8
        } 
      });
      
      // Clean up temporary storage
      delete (roomService as any)._lastCreationOptions;
    };

    const handleRoomJoined = ({ roomId }: { roomId: string }) => {
      dispatch({ type: 'ROOM_JOINED', payload: { roomId } });
    };

    const handleRoomDisposed = ({ roomId }: { roomId: string }) => {
      dispatch({ type: 'ROOM_DISPOSED', payload: { roomId } });
    };

    const handleError = (error: ConnectionError) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_CREATING_ROOM', payload: false });
      dispatch({ type: 'SET_JOINING_ROOM', payload: null });
    };

    // Register event listeners
    roomService.on('connected', handleConnected);
    roomService.on('disconnected', handleDisconnected);
    roomService.on('connection_status_changed', handleConnectionStatusChanged);
    roomService.on('rooms_updated', handleRoomsUpdated);
    roomService.on('room_state_changed', handleRoomStateChanged);
    roomService.on('room_created', handleRoomCreated);
    roomService.on('room_joined', handleRoomJoined);
    roomService.on('room_disposed', handleRoomDisposed);
    roomService.on('error', handleError);

    // Cleanup on unmount
    return () => {
      roomService.off('connected', handleConnected);
      roomService.off('disconnected', handleDisconnected);
      roomService.off('connection_status_changed', handleConnectionStatusChanged);
      roomService.off('rooms_updated', handleRoomsUpdated);
      roomService.off('room_state_changed', handleRoomStateChanged);
      roomService.off('room_created', handleRoomCreated);
      roomService.off('room_joined', handleRoomJoined);
      roomService.off('room_disposed', handleRoomDisposed);
      roomService.off('error', handleError);
    };
  }, [roomService]);

  // Action creators
  const connectToLobby = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await roomService.connectToLobby();
    } catch (error) {
      console.error('Failed to connect to lobby:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to multiplayer server' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnectFromLobby = async (): Promise<void> => {
    try {
      await roomService.disconnectFromLobby();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Failed to disconnect from lobby:', error);
    }
  };

  const setSelectedGame = (gameId: string, gameInfo: GameInfo): void => {
    dispatch({ type: 'SET_SELECTED_GAME', payload: { gameId, gameInfo } });
  };

  const refreshRooms = async (): Promise<void> => {
    if (!state.selectedGameId) {
      console.log('⚠️ No selected game ID, skipping room refresh');
      return;
    }
    
    try {
      console.log('🔄 Refreshing rooms for game:', state.selectedGameId);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const rooms = await roomService.getActiveRooms(state.selectedGameId);
      console.log('📡 Received rooms:', rooms.length);
      const statistics = calculateStatistics(rooms);
      console.log('📊 Calculated statistics:', statistics);
      
      dispatch({ type: 'SET_ROOMS', payload: { rooms, statistics } });
      console.log('✅ Rooms state updated');
    } catch (error) {
      console.error('❌ Failed to refresh rooms:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh rooms' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createRoom = async (gameId: string, options: RoomCreationOptions): Promise<string> => {
    try {
      dispatch({ type: 'SET_CREATING_ROOM', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const roomId = await roomService.createRoom(gameId, options);
      
      // Note: The room created event with roomCode will be handled by the event listener
      // We store the creation options to use when the event is received
      (roomService as any)._lastCreationOptions = options;
      
      return roomId;
    } catch (error) {
      console.error('Failed to create room:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create room' });
      throw error;
    } finally {
      dispatch({ type: 'SET_CREATING_ROOM', payload: false });
    }
  };

  const joinRoom = async (roomId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_JOINING_ROOM', payload: roomId });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_ROOM_JOIN_ERROR', payload: null });
      
      // Pass current rooms for pre-validation and alternatives
      await roomService.joinRoom(roomId, state.rooms);
    } catch (error) {
      console.error('Failed to join room:', error);
      
      if (error instanceof Error && 'code' in error) {
        const joinError = error as RoomJoinError;
        dispatch({ type: 'SET_ROOM_JOIN_ERROR', payload: joinError });
        
        // Set user-friendly error message
        let errorMessage = 'Failed to join room';
        switch (joinError.code) {
          case 'ROOM_FULL':
            errorMessage = joinError.alternatives && joinError.alternatives.length > 0 
              ? 'Room is full, but we found some alternatives for you!'
              : 'Room is full. Try creating a new room or joining another one.';
            break;
          case 'ROOM_NOT_FOUND':
            errorMessage = 'Room not found. It may have been closed or the ID is incorrect.';
            break;
          case 'ROOM_CLOSED':
            errorMessage = 'Room has been closed by the host.';
            break;
          case 'INVALID_ROOM_STATE':
            errorMessage = 'Cannot join room - game is already in progress.';
            break;
          case 'CONNECTION_FAILED':
            errorMessage = 'Connection failed. Please check your internet connection and try again.';
            break;
          case 'PERMISSION_DENIED':
            errorMessage = 'You do not have permission to join this room.';
            break;
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to join room' });
      }
      
      throw error;
    } finally {
      dispatch({ type: 'SET_JOINING_ROOM', payload: null });
    }
  };

  const joinByCode = async (roomCode: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_JOINING_ROOM', payload: roomCode });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_ROOM_JOIN_ERROR', payload: null });
      
      await roomService.joinByCode(roomCode);
    } catch (error) {
      console.error('Failed to join room by code:', error);
      
      if (error instanceof Error && 'code' in error) {
        const joinError = error as RoomJoinError;
        dispatch({ type: 'SET_ROOM_JOIN_ERROR', payload: joinError });
        dispatch({ type: 'SET_ERROR', payload: joinError.message });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to join room by code' });
      }
      
      throw error;
    } finally {
      dispatch({ type: 'SET_JOINING_ROOM', payload: null });
    }
  };

  const quickMatch = async (gameId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_JOINING_ROOM', payload: 'quick-match' });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await roomService.quickMatch(gameId);
    } catch (error) {
      console.error('Quick match failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Quick match failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_JOINING_ROOM', payload: null });
    }
  };

  const showCreateModal = (show: boolean): void => {
    dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: show });
  };

  const showJoinByCodeModal = (show: boolean): void => {
    dispatch({ type: 'SET_SHOW_JOIN_BY_CODE_MODAL', payload: show });
  };

  const showSharingModal = (show: boolean): void => {
    dispatch({ type: 'SET_SHOW_SHARING_MODAL', payload: show });
  };

  const showAlternativesModal = (show: boolean): void => {
    dispatch({ type: 'SET_SHOW_ALTERNATIVES_MODAL', payload: show });
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const clearRoomJoinError = (): void => {
    dispatch({ type: 'SET_ROOM_JOIN_ERROR', payload: null });
    dispatch({ type: 'SET_SHOW_ALTERNATIVES_MODAL', payload: false });
  };

  // Performance monitoring for WebSocket messages
  const messageStatsRef = useRef({
    messagesReceived: 0,
    lastMessageTime: 0,
    averageMessageInterval: 0,
    messageQueue: [] as number[]
  });

  const trackMessagePerformance = useCallback(() => {
    const now = Date.now();
    const stats = messageStatsRef.current;
    
    stats.messagesReceived++;
    
    if (stats.lastMessageTime > 0) {
      const interval = now - stats.lastMessageTime;
      stats.messageQueue.push(interval);
      
      // Keep only last 10 intervals for average calculation
      if (stats.messageQueue.length > 10) {
        stats.messageQueue.shift();
      }
      
      stats.averageMessageInterval = stats.messageQueue.reduce((sum, interval) => sum + interval, 0) / stats.messageQueue.length;
    }
    
    stats.lastMessageTime = now;
    
    // Log performance warnings if messages are too frequent
    if (stats.averageMessageInterval < 50 && stats.messageQueue.length >= 5) {
      console.warn('High frequency WebSocket messages detected. Consider implementing additional throttling.');
    }
  }, []);

  // Helper function to calculate statistics (memoized)
  const calculateStatistics = useMemo(() => {
    return (rooms: ActiveRoom[]): RoomStatistics => {
      return {
        totalRooms: rooms.length,
        publicRooms: rooms.filter(room => !room.isPrivate).length,
        privateRooms: rooms.filter(room => room.isPrivate).length,
        totalPlayers: rooms.reduce((sum, room) => sum + room.playerCount, 0),
        averagePlayersPerRoom: rooms.length > 0 ? 
          Math.round((rooms.reduce((sum, room) => sum + room.playerCount, 0) / rooms.length) * 10) / 10 : 0,
        roomsByState: {
          LOBBY: rooms.filter(room => room.state === 'LOBBY').length,
          COUNTDOWN: rooms.filter(room => room.state === 'COUNTDOWN').length,
          PLAYING: rooms.filter(room => room.state === 'PLAYING').length,
          RESULTS: rooms.filter(room => room.state === 'RESULTS').length
        }
      };
    };
  }, []);

  const contextValue: RoomContextType = {
    state,
    dispatch,
    roomService,
    connectToLobby,
    disconnectFromLobby,
    setSelectedGame,
    refreshRooms,
    createRoom,
    joinRoom,
    joinByCode,
    quickMatch,
    showCreateModal,
    showJoinByCodeModal,
    showSharingModal,
    showAlternativesModal,
    clearError,
    clearRoomJoinError
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
}

// Hook to use room context
export function useRoomContext(): RoomContextType {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
}

// Convenience hooks
export function useRoomState(): RoomState {
  const { state } = useRoomContext();
  return state;
}

export function useRoomActions() {
  const { 
    connectToLobby,
    disconnectFromLobby,
    setSelectedGame,
    refreshRooms,
    createRoom,
    joinRoom,
    joinByCode,
    quickMatch,
    showCreateModal,
    showJoinByCodeModal,
    showSharingModal,
    showAlternativesModal,
    clearError,
    clearRoomJoinError
  } = useRoomContext();
  
  return {
    connectToLobby,
    disconnectFromLobby,
    setSelectedGame,
    refreshRooms,
    createRoom,
    joinRoom,
    joinByCode,
    quickMatch,
    showCreateModal,
    showJoinByCodeModal,
    showSharingModal,
    showAlternativesModal,
    clearError,
    clearRoomJoinError
  };
}