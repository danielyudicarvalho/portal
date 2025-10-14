/**
 * RoomService - Manages multiplayer room operations and real-time updates
 * Integrates with the existing Colyseus-based multiplayer infrastructure
 */

import { Client, Room } from 'colyseus.js';
import { RetryMechanism, retryConnection, retryRoomOperation } from './retry-mechanism';
import { OfflineHandler } from './offline-handler';

// Types based on the existing server implementation
export interface GameSettings {
  [key: string]: {
    type: 'boolean' | 'number' | 'string' | 'select';
    label: string;
    default: any;
    options?: any[];
    min?: number;
    max?: number;
  };
}

export interface GameInfo {
  id: string;
  name: string;
  roomType: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
  features?: string[];
  settings?: GameSettings;
}

export interface ActiveRoom {
  roomId: string;
  roomCode: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  state: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS';
  isPrivate: boolean;
  createdAt: number;
}

export interface RoomCreationOptions {
  isPrivate: boolean;
  maxPlayers: number;
  gameSettings?: Record<string, any>;
  roomName?: string;
}

export interface RoomStatistics {
  totalRooms: number;
  publicRooms: number;
  privateRooms: number;
  totalPlayers: number;
  averagePlayersPerRoom: number;
  roomsByState: {
    LOBBY: number;
    COUNTDOWN: number;
    PLAYING: number;
    RESULTS: number;
  };
}

export interface ConnectionError {
  code: string;
  message: string;
  details?: any;
}

export interface RoomAlternative {
  roomId: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  state: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS';
  similarity: number; // 0-1 score indicating how similar this room is to the requested one
}

export interface RoomJoinError extends Error {
  code: 'ROOM_FULL' | 'ROOM_NOT_FOUND' | 'ROOM_CLOSED' | 'INVALID_ROOM_STATE' | 'CONNECTION_FAILED' | 'PERMISSION_DENIED';
  alternatives?: RoomAlternative[];
  roomId?: string;
}

export type RoomServiceEventType = 
  | 'connected'
  | 'disconnected'
  | 'rooms_updated'
  | 'room_state_changed'
  | 'room_created'
  | 'room_joined'
  | 'room_disposed'
  | 'error'
  | 'connection_status_changed';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class RoomService {
  private client: Client | null = null;
  private lobbyConnection: Room | null = null;
  private serverUrl: string;
  private eventHandlers: Map<RoomServiceEventType, Array<(data: any) => void>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private offlineHandler: OfflineHandler | null = null;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || 
      (typeof window !== 'undefined' ? 
        process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:3002' : 
        'ws://localhost:3002');
    this.initializeEventHandlers();
    this.initializeOfflineHandler();
  }

  private initializeEventHandlers(): void {
    // Initialize event handler arrays
    const eventTypes: RoomServiceEventType[] = [
      'connected', 'disconnected', 'rooms_updated', 'room_state_changed',
      'room_created', 'room_joined', 'room_disposed', 'error', 'connection_status_changed'
    ];
    
    eventTypes.forEach(eventType => {
      this.eventHandlers.set(eventType, []);
    });
  }

  private initializeOfflineHandler(): void {
    if (typeof window === 'undefined') return;

    this.offlineHandler = new OfflineHandler({
      onOffline: () => {
        console.log('🌐 Offline detected, pausing room operations');
        this.emit('connection_status_changed', { status: 'disconnected', reason: 'offline' });
      },
      onOnline: () => {
        console.log('🌐 Online detected, attempting to reconnect');
        if (this.connectionStatus === 'disconnected') {
          this.connectToLobby().catch(error => {
            console.error('Auto-reconnect failed:', error);
          });
        }
      },
      onReconnectAttempt: (attempt) => {
        this.emit('connection_status_changed', { 
          status: 'connecting', 
          reason: 'offline_reconnect',
          attempt 
        });
      },
      onReconnectSuccess: () => {
        console.log('🌐 Offline handler reconnected successfully');
      },
      onReconnectFailed: (error) => {
        console.error('🌐 Offline handler reconnection failed:', error);
        this.emit('error', {
          code: 'OFFLINE_RECONNECT_FAILED',
          message: 'Failed to reconnect after coming back online',
          details: error
        });
      },
      maxReconnectAttempts: 3,
      reconnectDelay: 2000,
      pingInterval: 30000,
      pingUrl: '/api/health', // We'll need to create this endpoint
    });
  }

  // Event system
  public on(event: RoomServiceEventType, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.push(handler);
    }
  }

  public off(event: RoomServiceEventType, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: RoomServiceEventType, data: any = {}): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit('connection_status_changed', { status });
    }
  }

  // Connection management
  public async connectToLobby(): Promise<void> {
    if (this.connectionStatus === 'connecting' || this.connectionStatus === 'connected') {
      console.log('🔌 Already connecting or connected, status:', this.connectionStatus);
      return;
    }

    console.log('🔌 Starting connection to lobby at:', this.serverUrl);
    const result = await retryConnection(async () => {
      this.setConnectionStatus('connecting');
      console.log('🔌 Creating Colyseus client...');
      
      // Initialize Colyseus client
      this.client = new Client(this.serverUrl);
      console.log('✅ Colyseus client created');
      
      // Connect to the GameLobby
      console.log('🏛️ Joining lobby...');
      this.lobbyConnection = await this.client.joinOrCreate('lobby');
      console.log('✅ Joined lobby successfully');
      
      this.setupLobbyHandlers();
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      
      this.emit('connected');
      console.log('🔌 Connected to multiplayer lobby');
    });

    if (!result.success) {
      console.error('Failed to connect to lobby after retries:', result.error);
      this.setConnectionStatus('error');
      
      const connectionError: ConnectionError = {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to multiplayer server after multiple attempts',
        details: result.error
      };
      
      this.emit('error', connectionError);
      
      // Attempt reconnection
      this.scheduleReconnect();
      throw result.error;
    }
  }

  public async disconnectFromLobby(): Promise<void> {
    this.clearReconnectTimer();
    this.isReconnecting = false;
    
    if (this.lobbyConnection) {
      try {
        await this.lobbyConnection.leave();
      } catch (error) {
        console.warn('Error leaving lobby:', error);
      }
      this.lobbyConnection = null;
    }
    
    if (this.client) {
      this.client = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.emit('disconnected');
    console.log('👋 Disconnected from multiplayer lobby');
  }

  private setupLobbyHandlers(): void {
    if (!this.lobbyConnection) return;

    // Handle initial lobby data
    this.lobbyConnection.onMessage('lobby_joined', (data) => {
      console.log('🏛️ Joined lobby, received initial data');
      this.emit('rooms_updated', {
        rooms: data.activeRooms || [],
        statistics: this.calculateStatistics(data.activeRooms || [])
      });
    });

    // Handle real-time room updates
    this.lobbyConnection.onMessage('rooms_updated', (data) => {
      console.log('📡 Received room updates:', data.stats || 'no stats');
      this.emit('rooms_updated', {
        rooms: data.activeRooms || [],
        statistics: {
          totalRooms: data.totalRooms || 0,
          publicRooms: data.publicRooms || 0,
          privateRooms: data.privateRooms || 0,
          totalPlayers: data.totalPlayers || 0,
          averagePlayersPerRoom: data.totalRooms > 0 ? 
            Math.round((data.totalPlayers / data.totalRooms) * 10) / 10 : 0,
          roomsByState: {
            LOBBY: 0,
            COUNTDOWN: 0,
            PLAYING: 0,
            RESULTS: 0
          }
        }
      });
    });

    // Handle room state changes
    this.lobbyConnection.onMessage('room_state_changed', (data) => {
      console.log(`🔄 Room state changed: ${data.roomCode} ${data.oldState} → ${data.newState}`);
      this.emit('room_state_changed', data);
    });

    // Handle room creation responses
    this.lobbyConnection.onMessage('room_created', (data) => {
      console.log(`🏗️ Room created: ${data.roomCode} (${data.roomId})`);
      this.emit('room_created', data);
    });

    // Handle room join responses
    this.lobbyConnection.onMessage('join_room', (data) => {
      console.log(`🚪 Joining room: ${data.roomCode} (${data.roomId})`);
      this.emit('room_joined', data);
    });

    // Handle room disposal notifications
    this.lobbyConnection.onMessage('room_disposed', (data) => {
      console.log(`🗑️ Room disposed: ${data.roomCode} - ${data.reason}`);
      this.emit('room_disposed', data);
    });

    // Handle room alternatives (when room is full)
    this.lobbyConnection.onMessage('room_alternatives', (data) => {
      console.log('🔄 Room full, received alternatives:', data.alternatives?.length || 0);
      this.emit('room_alternatives', data);
    });

    // Handle errors
    this.lobbyConnection.onMessage('error', (data) => {
      console.error('❌ Lobby error:', data.message);
      const error: ConnectionError = {
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'Unknown error occurred',
        details: data.details
      };
      this.emit('error', error);
    });

    // Handle disconnection
    this.lobbyConnection.onLeave((code) => {
      console.log(`🔌 Disconnected from lobby (code: ${code})`);
      this.setConnectionStatus('disconnected');
      this.emit('disconnected', { code });
      
      // Attempt reconnection if not intentional
      if (!this.isReconnecting && code !== 1000) {
        this.scheduleReconnect();
      }
    });

    // Handle connection errors
    this.lobbyConnection.onError((code, message) => {
      console.error(`❌ Lobby connection error (${code}): ${message}`);
      this.setConnectionStatus('error');
      
      const error: ConnectionError = {
        code: `CONNECTION_ERROR_${code}`,
        message: message || 'Connection error occurred',
        details: { code }
      };
      
      this.emit('error', error);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.emit('error', {
          code: 'MAX_RECONNECT_ATTEMPTS',
          message: 'Failed to reconnect after maximum attempts'
        });
      }
      return;
    }

    this.isReconnecting = true;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      this.isReconnecting = false;
      
      try {
        await this.connectToLobby();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Room validation methods
  public validateRoomJoinability(room: ActiveRoom): { canJoin: boolean; reason?: string } {
    if (room.playerCount >= room.maxPlayers) {
      return { canJoin: false, reason: 'Room is at maximum capacity' };
    }
    
    if (room.state !== 'LOBBY') {
      return { canJoin: false, reason: `Room is currently ${room.state.toLowerCase()}` };
    }
    
    return { canJoin: true };
  }

  public findRoomAlternatives(targetRoom: ActiveRoom, allRooms: ActiveRoom[]): RoomAlternative[] {
    return allRooms
      .filter(room => 
        room.roomId !== targetRoom.roomId && 
        room.gameId === targetRoom.gameId &&
        room.state === 'LOBBY' &&
        room.playerCount < room.maxPlayers &&
        !room.isPrivate // Only suggest public rooms as alternatives
      )
      .map(room => {
        // Calculate similarity score based on player count and max players
        const targetCapacityRatio = targetRoom.playerCount / targetRoom.maxPlayers;
        const roomCapacityRatio = room.playerCount / room.maxPlayers;
        const capacitySimilarity = 1 - Math.abs(targetCapacityRatio - roomCapacityRatio);
        
        // Prefer rooms with similar player counts
        const playerCountSimilarity = 1 - Math.abs(targetRoom.playerCount - room.playerCount) / Math.max(targetRoom.maxPlayers, room.maxPlayers);
        
        // Combine similarity factors
        const similarity = (capacitySimilarity * 0.6) + (playerCountSimilarity * 0.4);
        
        return {
          roomId: room.roomId,
          roomCode: room.roomCode,
          playerCount: room.playerCount,
          maxPlayers: room.maxPlayers,
          state: room.state,
          similarity
        };
      })
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, 3); // Return top 3 alternatives
  }

  // Room operations
  public async getActiveRooms(gameId: string): Promise<ActiveRoom[]> {
    if (!this.lobbyConnection) {
      console.error('❌ Not connected to lobby');
      throw new Error('Not connected to lobby');
    }

    console.log('📡 Getting active rooms for game:', gameId);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Timeout getting active rooms');
        reject(new Error('Timeout getting active rooms'));
      }, 10000);

      console.log('📤 Sending refresh_rooms message...');
      this.lobbyConnection!.send('refresh_rooms');
      
      const handler = (data: any) => {
        console.log('📡 Received rooms_updated response:', data);
        clearTimeout(timeout);
        this.off('rooms_updated', handler);
        
        const rooms = data.rooms || [];
        console.log('📋 Total rooms received:', rooms.length);
        const filteredRooms = gameId ? 
          rooms.filter((room: ActiveRoom) => room.gameId === gameId) : 
          rooms;
        console.log('🎯 Filtered rooms for', gameId + ':', filteredRooms.length);
        
        resolve(filteredRooms);
      };
      
      this.on('rooms_updated', handler);
    });
  }

  public async createRoom(gameId: string, options: RoomCreationOptions): Promise<string> {
    if (!this.lobbyConnection) {
      throw new Error('Not connected to lobby');
    }

    const result = await retryRoomOperation(async () => {
      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout creating room'));
        }, 15000);

        const successHandler = (data: any) => {
          clearTimeout(timeout);
          this.off('room_created', successHandler);
          this.off('error', errorHandler);
          resolve(data.roomId);
        };

        const errorHandler = (error: ConnectionError) => {
          if (error.code.includes('ROOM_CREATION') || error.code === 'INVALID_GAME_TYPE') {
            clearTimeout(timeout);
            this.off('room_created', successHandler);
            this.off('error', errorHandler);
            reject(new Error(error.message));
          }
        };

        this.on('room_created', successHandler);
        this.on('error', errorHandler);

        this.lobbyConnection!.send('create_room', {
          gameId,
          isPrivate: options.isPrivate,
          settings: options.gameSettings || {}
        });
      });
    });

    if (!result.success) {
      throw result.error;
    }

    return result.result!;
  }

  public async joinRoom(roomId: string, allRooms?: ActiveRoom[]): Promise<void> {
    if (!this.lobbyConnection) {
      throw new Error('Not connected to lobby');
    }

    // Validate room ID format
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID provided');
    }

    // Pre-validate room if we have room data
    if (allRooms) {
      const targetRoom = allRooms.find(room => room.roomId === roomId);
      if (targetRoom) {
        const validation = this.validateRoomJoinability(targetRoom);
        if (!validation.canJoin) {
          const error = new Error(validation.reason) as RoomJoinError;
          
          if (targetRoom.playerCount >= targetRoom.maxPlayers) {
            error.code = 'ROOM_FULL';
            error.alternatives = this.findRoomAlternatives(targetRoom, allRooms);
          } else if (targetRoom.state !== 'LOBBY') {
            error.code = 'INVALID_ROOM_STATE';
          }
          
          error.roomId = roomId;
          throw error;
        }
      }
    }

    const result = await retryRoomOperation(async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const error = new Error('Timeout joining room') as RoomJoinError;
          error.code = 'CONNECTION_FAILED';
          error.roomId = roomId;
          reject(error);
        }, 10000);

        const successHandler = (data: any) => {
          if (data.roomId === roomId) {
            clearTimeout(timeout);
            this.off('room_joined', successHandler);
            this.off('error', errorHandler);
            this.off('room_alternatives', alternativesHandler);
            resolve();
          }
        };

        const errorHandler = (error: ConnectionError) => {
          if (error.code.includes('ROOM_') || error.code.includes('JOIN_')) {
            clearTimeout(timeout);
            this.off('room_joined', successHandler);
            this.off('error', errorHandler);
            this.off('room_alternatives', alternativesHandler);
            
            const joinError = new Error(error.message) as RoomJoinError;
            joinError.roomId = roomId;
            
            // Map server error codes to our error types
            if (error.code.includes('ROOM_FULL')) {
              joinError.code = 'ROOM_FULL';
            } else if (error.code.includes('ROOM_NOT_FOUND')) {
              joinError.code = 'ROOM_NOT_FOUND';
            } else if (error.code.includes('ROOM_CLOSED')) {
              joinError.code = 'ROOM_CLOSED';
            } else if (error.code.includes('PERMISSION')) {
              joinError.code = 'PERMISSION_DENIED';
            } else {
              joinError.code = 'CONNECTION_FAILED';
            }
            
            reject(joinError);
          }
        };

        const alternativesHandler = (data: any) => {
          if (data.requestedRoomId === roomId) {
            clearTimeout(timeout);
            this.off('room_joined', successHandler);
            this.off('error', errorHandler);
            this.off('room_alternatives', alternativesHandler);
            
            const error = new Error(data.message || 'Room is full') as RoomJoinError;
            error.code = 'ROOM_FULL';
            error.roomId = roomId;
            error.alternatives = data.alternatives || [];
            
            reject(error);
          }
        };

        this.on('room_joined', successHandler);
        this.on('error', errorHandler);
        this.on('room_alternatives', alternativesHandler);

        this.lobbyConnection!.send('join_room', { roomId });
      });
    });

    if (!result.success) {
      throw result.error;
    }
  }

  public async joinByCode(roomCode: string): Promise<void> {
    if (!this.lobbyConnection) {
      throw new Error('Not connected to lobby');
    }

    // Validate room code format
    if (!roomCode || typeof roomCode !== 'string') {
      throw new Error('Invalid room code provided');
    }

    const cleanCode = roomCode.trim().toUpperCase();
    
    if (cleanCode.length !== 6) {
      throw new Error('Room code must be exactly 6 characters');
    }

    if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
      throw new Error('Room code can only contain letters and numbers');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const error = new Error('Timeout joining room by code') as RoomJoinError;
        error.code = 'CONNECTION_FAILED';
        reject(error);
      }, 10000);

      const successHandler = (data: any) => {
        clearTimeout(timeout);
        this.off('room_joined', successHandler);
        this.off('error', errorHandler);
        resolve();
      };

      const errorHandler = (error: ConnectionError) => {
        if (error.code.includes('ROOM_') || error.code.includes('JOIN_') || 
            error.code.includes('INVALID_ROOM_CODE')) {
          clearTimeout(timeout);
          this.off('room_joined', successHandler);
          this.off('error', errorHandler);
          
          const joinError = new Error(error.message) as RoomJoinError;
          
          // Map server error codes to our error types
          if (error.code.includes('INVALID_ROOM_CODE') || error.code.includes('ROOM_NOT_FOUND')) {
            joinError.code = 'ROOM_NOT_FOUND';
            joinError.message = 'Invalid room code. Please check the code and try again.';
          } else if (error.code.includes('ROOM_FULL')) {
            joinError.code = 'ROOM_FULL';
            joinError.message = 'Room is full. Try joining another room.';
          } else if (error.code.includes('ROOM_CLOSED')) {
            joinError.code = 'ROOM_CLOSED';
            joinError.message = 'Room has been closed by the host.';
          } else if (error.code.includes('PERMISSION')) {
            joinError.code = 'PERMISSION_DENIED';
            joinError.message = 'You do not have permission to join this room.';
          } else {
            joinError.code = 'CONNECTION_FAILED';
            joinError.message = 'Failed to join room. Please try again.';
          }
          
          reject(joinError);
        }
      };

      this.on('room_joined', successHandler);
      this.on('error', errorHandler);

      this.lobbyConnection.send('join_private_room', { 
        roomCode: cleanCode 
      });
    });
  }

  public async quickMatch(gameId: string): Promise<void> {
    if (!this.lobbyConnection) {
      throw new Error('Not connected to lobby');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout during quick match'));
      }, 15000);

      const successHandler = (data: any) => {
        if (data.isQuickMatch) {
          clearTimeout(timeout);
          this.off('room_joined', successHandler);
          this.off('error', errorHandler);
          resolve();
        }
      };

      const errorHandler = (error: ConnectionError) => {
        if (error.code.includes('QUICK_MATCH') || error.code === 'INVALID_GAME_TYPE') {
          clearTimeout(timeout);
          this.off('room_joined', successHandler);
          this.off('error', errorHandler);
          reject(new Error(error.message));
        }
      };

      this.on('room_joined', successHandler);
      this.on('error', errorHandler);

      this.lobbyConnection.send('quick_match', { gameId });
    });
  }

  // Utility methods
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.lobbyConnection !== null;
  }

  private calculateStatistics(rooms: ActiveRoom[]): RoomStatistics {
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
  }

  // Offline detection methods
  public isOffline(): boolean {
    return this.offlineHandler ? this.offlineHandler.isOffline() : false;
  }

  public getOfflineState() {
    return this.offlineHandler ? this.offlineHandler.getState() : null;
  }

  public async forceReconnect(): Promise<void> {
    if (this.offlineHandler) {
      await this.offlineHandler.forceReconnect();
    }
    
    // Also attempt to reconnect to lobby
    if (this.connectionStatus !== 'connected') {
      await this.connectToLobby();
    }
  }

  // Cleanup
  public async dispose(): Promise<void> {
    this.clearReconnectTimer();
    await this.disconnectFromLobby();
    this.eventHandlers.clear();
    
    if (this.offlineHandler) {
      this.offlineHandler.dispose();
      this.offlineHandler = null;
    }
  }
}

// Singleton instance for global use
let roomServiceInstance: RoomService | null = null;

export function getRoomService(serverUrl?: string): RoomService {
  if (!roomServiceInstance) {
    const url = serverUrl || 
      (typeof window !== 'undefined' ? 
        process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:3002' : 
        'ws://localhost:3002');
    roomServiceInstance = new RoomService(url);
  }
  return roomServiceInstance;
}

export function resetRoomService(): void {
  if (roomServiceInstance) {
    roomServiceInstance.dispose();
    roomServiceInstance = null;
  }
}