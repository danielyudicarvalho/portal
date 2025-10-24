import { RoomService, ActiveRoom, GameInfo, RoomCreationOptions, ConnectionError, RoomJoinError } from '../room-service';
import { Client, Room } from 'colyseus.js';

// Mock Colyseus client
jest.mock('colyseus.js', () => ({
  Client: jest.fn(),
  Room: jest.fn()
}));

// Mock retry mechanism
jest.mock('../retry-mechanism', () => ({
  retryConnection: jest.fn((fn) => fn().then(() => ({ success: true })).catch(error => ({ success: false, error }))),
  retryRoomOperation: jest.fn((fn) => fn().then(result => ({ success: true, result })).catch(error => ({ success: false, error })))
}));

// Mock offline handler
jest.mock('../offline-handler', () => ({
  OfflineHandler: jest.fn().mockImplementation(() => ({
    isOffline: jest.fn(() => false),
    getState: jest.fn(() => ({ isOffline: false })),
    forceReconnect: jest.fn(),
    dispose: jest.fn()
  }))
}));

describe('RoomService', () => {
  let roomService: RoomService;
  let mockClient: jest.Mocked<Client>;
  let mockLobbyConnection: jest.Mocked<Room>;

  const mockGameInfo: GameInfo = {
    id: 'snake',
    name: 'Snake Game',
    roomType: 'snake',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game',
    features: ['multiplayer']
  };

  const mockRoom: ActiveRoom = {
    roomId: 'room-123',
    roomCode: 'ABC123',
    gameId: 'snake',
    playerCount: 3,
    maxPlayers: 8,
    state: 'LOBBY',
    isPrivate: false,
    createdAt: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock lobby connection
    mockLobbyConnection = {
      onMessage: jest.fn(),
      onLeave: jest.fn(),
      onError: jest.fn(),
      send: jest.fn(),
      leave: jest.fn()
    } as any;

    // Setup mock client
    mockClient = {
      joinOrCreate: jest.fn().mockResolvedValue(mockLobbyConnection)
    } as any;

    (Client as jest.Mock).mockImplementation(() => mockClient);

    roomService = new RoomService('ws://localhost:3002');
  });

  afterEach(async () => {
    await roomService.dispose();
  });

  describe('Connection Management', () => {
    it('connects to lobby successfully', async () => {
      await roomService.connectToLobby();

      expect(Client).toHaveBeenCalledWith('ws://localhost:3002');
      expect(mockClient.joinOrCreate).toHaveBeenCalledWith('lobby');
      expect(roomService.isConnected()).toBe(true);
      expect(roomService.getConnectionStatus()).toBe('connected');
    });

    it('handles connection failure', async () => {
      const connectionError = new Error('Connection failed');
      mockClient.joinOrCreate.mockRejectedValue(connectionError);

      await expect(roomService.connectToLobby()).rejects.toThrow('Connection failed');
      expect(roomService.isConnected()).toBe(false);
      expect(roomService.getConnectionStatus()).toBe('error');
    });

    it('disconnects from lobby', async () => {
      await roomService.connectToLobby();
      await roomService.disconnectFromLobby();

      expect(mockLobbyConnection.leave).toHaveBeenCalled();
      expect(roomService.isConnected()).toBe(false);
      expect(roomService.getConnectionStatus()).toBe('disconnected');
    });

    it('prevents multiple simultaneous connections', async () => {
      const connection1 = roomService.connectToLobby();
      const connection2 = roomService.connectToLobby();

      await Promise.all([connection1, connection2]);

      // Should only create one client connection
      expect(mockClient.joinOrCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event System', () => {
    it('registers and calls event handlers', () => {
      const handler = jest.fn();
      roomService.on('connected', handler);

      // Simulate connection
      (roomService as any).emit('connected', { test: 'data' });

      expect(handler).toHaveBeenCalledWith({ test: 'data' });
    });

    it('removes event handlers', () => {
      const handler = jest.fn();
      roomService.on('connected', handler);
      roomService.off('connected', handler);

      // Simulate connection
      (roomService as any).emit('connected', { test: 'data' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      roomService.on('connected', handler1);
      roomService.on('connected', handler2);

      (roomService as any).emit('connected', { test: 'data' });

      expect(handler1).toHaveBeenCalledWith({ test: 'data' });
      expect(handler2).toHaveBeenCalledWith({ test: 'data' });
    });

    it('handles errors in event handlers gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      const normalHandler = jest.fn();
      
      roomService.on('connected', errorHandler);
      roomService.on('connected', normalHandler);

      // Should not throw and should call other handlers
      expect(() => {
        (roomService as any).emit('connected', { test: 'data' });
      }).not.toThrow();

      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('Room Operations', () => {
    beforeEach(async () => {
      await roomService.connectToLobby();
    });

    it('gets active rooms', async () => {
      const mockRooms = [mockRoom];
      
      // Setup mock response
      const roomsPromise = roomService.getActiveRooms('snake');
      
      // Simulate server response immediately
      setTimeout(() => {
        const handler = mockLobbyConnection.onMessage.mock.calls.find(
          call => call[0] === 'rooms_updated'
        )?.[1];
        
        if (handler) {
          handler({ rooms: mockRooms });
        }
      }, 10);

      const rooms = await roomsPromise;
      expect(rooms).toEqual(mockRooms);
      expect(mockLobbyConnection.send).toHaveBeenCalledWith('refresh_rooms');
    });

    it('creates room successfully', async () => {
      const options: RoomCreationOptions = {
        isPrivate: false,
        maxPlayers: 6,
        gameSettings: { speed: 'fast' }
      };

      const createPromise = roomService.createRoom('snake', options);

      // Simulate server response immediately
      setTimeout(() => {
        const handler = mockLobbyConnection.onMessage.mock.calls.find(
          call => call[0] === 'room_created'
        )?.[1];
        
        if (handler) {
          handler({ roomId: 'room-123' });
        }
      }, 10);

      const roomId = await createPromise;
      expect(roomId).toBe('room-123');
      expect(mockLobbyConnection.send).toHaveBeenCalledWith('create_room', {
        gameId: 'snake',
        isPrivate: false,
        settings: { speed: 'fast' }
      });
    });

    it('joins room by ID', async () => {
      const joinPromise = roomService.joinRoom('room-123');

      // Simulate server response immediately
      setTimeout(() => {
        const handler = mockLobbyConnection.onMessage.mock.calls.find(
          call => call[0] === 'room_joined'
        )?.[1];
        
        if (handler) {
          handler({ roomId: 'room-123' });
        }
      }, 10);

      await joinPromise;
      expect(mockLobbyConnection.send).toHaveBeenCalledWith('join_room', { roomId: 'room-123' });
    });

    it('joins room by code', async () => {
      const joinPromise = roomService.joinByCode('ABC123');

      // Simulate server response immediately
      setTimeout(() => {
        const handler = mockLobbyConnection.onMessage.mock.calls.find(
          call => call[0] === 'room_joined'
        )?.[1];
        
        if (handler) {
          handler({});
        }
      }, 10);

      await joinPromise;
      expect(mockLobbyConnection.send).toHaveBeenCalledWith('join_private_room', { 
        roomCode: 'ABC123' 
      });
    });

    it('validates room code format', async () => {
      // Test invalid codes
      await expect(roomService.joinByCode('')).rejects.toThrow('Invalid room code provided');
      await expect(roomService.joinByCode('ABC12')).rejects.toThrow('Room code must be exactly 6 characters');
      await expect(roomService.joinByCode('ABC-12')).rejects.toThrow('Room code can only contain letters and numbers');
    });

    it('performs quick match', async () => {
      const quickMatchPromise = roomService.quickMatch('snake');

      // Simulate server response immediately
      setTimeout(() => {
        const handler = mockLobbyConnection.onMessage.mock.calls.find(
          call => call[0] === 'room_joined'
        )?.[1];
        
        if (handler) {
          handler({ isQuickMatch: true });
        }
      }, 10);

      await quickMatchPromise;
      expect(mockLobbyConnection.send).toHaveBeenCalledWith('quick_match', { gameId: 'snake' });
    });

    it('handles room operation timeouts', async () => {
      jest.useFakeTimers();

      const createPromise = roomService.createRoom('snake', {
        isPrivate: false,
        maxPlayers: 6
      });

      // Fast-forward past timeout
      jest.advanceTimersByTime(16000);

      await expect(createPromise).rejects.toThrow('Timeout creating room');

      jest.useRealTimers();
    });

    it('throws error when not connected', async () => {
      await roomService.disconnectFromLobby();

      await expect(roomService.getActiveRooms('snake')).rejects.toThrow('Not connected to lobby');
      await expect(roomService.createRoom('snake', { isPrivate: false, maxPlayers: 6 })).rejects.toThrow('Not connected to lobby');
      await expect(roomService.joinRoom('room-123')).rejects.toThrow('Not connected to lobby');
    });
  });

  describe('Room Validation', () => {
    it('validates room joinability', () => {
      // Joinable room
      const joinableRoom = { ...mockRoom, state: 'LOBBY' as const, playerCount: 3, maxPlayers: 8 };
      const result1 = roomService.validateRoomJoinability(joinableRoom);
      expect(result1.canJoin).toBe(true);

      // Full room
      const fullRoom = { ...mockRoom, playerCount: 8, maxPlayers: 8 };
      const result2 = roomService.validateRoomJoinability(fullRoom);
      expect(result2.canJoin).toBe(false);
      expect(result2.reason).toBe('Room is at maximum capacity');

      // Playing room
      const playingRoom = { ...mockRoom, state: 'PLAYING' as const };
      const result3 = roomService.validateRoomJoinability(playingRoom);
      expect(result3.canJoin).toBe(false);
      expect(result3.reason).toBe('Room is currently playing');
    });

    it('finds room alternatives', () => {
      const targetRoom = { ...mockRoom, roomId: 'target-room', playerCount: 8, maxPlayers: 8 };
      const allRooms = [
        targetRoom,
        { ...mockRoom, roomId: 'alt-1', playerCount: 6, maxPlayers: 8, state: 'LOBBY' as const, isPrivate: false },
        { ...mockRoom, roomId: 'alt-2', playerCount: 2, maxPlayers: 8, state: 'LOBBY' as const, isPrivate: false },
        { ...mockRoom, roomId: 'alt-3', playerCount: 4, maxPlayers: 8, state: 'PLAYING' as const, isPrivate: false },
        { ...mockRoom, roomId: 'alt-4', playerCount: 3, maxPlayers: 8, state: 'LOBBY' as const, isPrivate: true }
      ];

      const alternatives = roomService.findRoomAlternatives(targetRoom, allRooms);

      // Should only include public, lobby rooms that aren't full
      expect(alternatives).toHaveLength(2);
      expect(alternatives[0].roomId).toBe('alt-1'); // Higher similarity (6/8 vs target 8/8)
      expect(alternatives[1].roomId).toBe('alt-2'); // Lower similarity (2/8 vs target 8/8)
      
      // Should not include playing or private rooms
      expect(alternatives.find(alt => alt.roomId === 'alt-3')).toBeUndefined();
      expect(alternatives.find(alt => alt.roomId === 'alt-4')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await roomService.connectToLobby();
    });

    it('handles room join errors with alternatives', async () => {
      const fullRoom = { ...mockRoom, playerCount: 8, maxPlayers: 8 };
      const allRooms = [
        fullRoom,
        { ...mockRoom, roomId: 'alt-1', playerCount: 3, maxPlayers: 8, state: 'LOBBY' as const, isPrivate: false }
      ];

      try {
        await roomService.joinRoom('room-123', allRooms);
      } catch (error) {
        const joinError = error as RoomJoinError;
        expect(joinError.code).toBe('ROOM_FULL');
        expect(joinError.alternatives).toHaveLength(1);
        expect(joinError.alternatives![0].roomId).toBe('alt-1');
      }
    });

    it('handles server error responses', async () => {
      const createPromise = roomService.createRoom('snake', { isPrivate: false, maxPlayers: 6 });

      // Simulate server error
      const errorHandler = mockLobbyConnection.onMessage.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler({
          code: 'ROOM_CREATION_FAILED',
          message: 'Failed to create room'
        });
      }

      await expect(createPromise).rejects.toThrow('Failed to create room');
    });

    it('maps server error codes correctly', async () => {
      const joinPromise = roomService.joinByCode('ABC123');

      // Simulate server error
      const errorHandler = mockLobbyConnection.onMessage.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler({
          code: 'INVALID_ROOM_CODE',
          message: 'Room not found'
        });
      }

      try {
        await joinPromise;
      } catch (error) {
        const joinError = error as RoomJoinError;
        expect(joinError.code).toBe('ROOM_NOT_FOUND');
        expect(joinError.message).toBe('Invalid room code. Please check the code and try again.');
      }
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      await roomService.connectToLobby();
    });

    it('handles room state changes', () => {
      const handler = jest.fn();
      roomService.on('room_state_changed', handler);

      // Simulate server message
      const messageHandler = mockLobbyConnection.onMessage.mock.calls.find(
        call => call[0] === 'room_state_changed'
      )?.[1];
      
      if (messageHandler) {
        messageHandler({
          roomCode: 'ABC123',
          oldState: 'LOBBY',
          newState: 'PLAYING'
        });
      }

      expect(handler).toHaveBeenCalledWith({
        roomCode: 'ABC123',
        oldState: 'LOBBY',
        newState: 'PLAYING'
      });
    });

    it('handles room disposal notifications', () => {
      const handler = jest.fn();
      roomService.on('room_disposed', handler);

      // Simulate server message
      const messageHandler = mockLobbyConnection.onMessage.mock.calls.find(
        call => call[0] === 'room_disposed'
      )?.[1];
      
      if (messageHandler) {
        messageHandler({
          roomCode: 'ABC123',
          reason: 'Host disconnected'
        });
      }

      expect(handler).toHaveBeenCalledWith({
        roomCode: 'ABC123',
        reason: 'Host disconnected'
      });
    });

    it('handles connection loss and reconnection', () => {
      const disconnectHandler = jest.fn();
      roomService.on('disconnected', disconnectHandler);

      // Simulate connection loss
      const leaveHandler = mockLobbyConnection.onLeave.mock.calls[0]?.[0];
      if (leaveHandler) {
        leaveHandler(1006); // Abnormal closure
      }

      expect(disconnectHandler).toHaveBeenCalledWith({ code: 1006 });
      expect(roomService.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('Statistics Calculation', () => {
    it('calculates room statistics correctly', () => {
      const rooms: ActiveRoom[] = [
        { ...mockRoom, roomId: '1', playerCount: 3, isPrivate: false, state: 'LOBBY' },
        { ...mockRoom, roomId: '2', playerCount: 6, isPrivate: true, state: 'PLAYING' },
        { ...mockRoom, roomId: '3', playerCount: 2, isPrivate: false, state: 'LOBBY' },
        { ...mockRoom, roomId: '4', playerCount: 8, isPrivate: false, state: 'RESULTS' }
      ];

      const stats = (roomService as any).calculateStatistics(rooms);

      expect(stats).toEqual({
        totalRooms: 4,
        publicRooms: 3,
        privateRooms: 1,
        totalPlayers: 19,
        averagePlayersPerRoom: 4.8,
        roomsByState: {
          LOBBY: 2,
          COUNTDOWN: 0,
          PLAYING: 1,
          RESULTS: 1,
          RESET: 0
        }
      });
    });

    it('handles empty rooms array', () => {
      const stats = (roomService as any).calculateStatistics([]);

      expect(stats).toEqual({
        totalRooms: 0,
        publicRooms: 0,
        privateRooms: 0,
        totalPlayers: 0,
        averagePlayersPerRoom: 0,
        roomsByState: {
          LOBBY: 0,
          COUNTDOWN: 0,
          PLAYING: 0,
          RESULTS: 0,
          RESET: 0
        }
      });
    });
  });

  describe('Offline Handling', () => {
    it('reports offline status', () => {
      const mockOfflineHandler = (roomService as any).offlineHandler;
      mockOfflineHandler.isOffline.mockReturnValue(true);

      expect(roomService.isOffline()).toBe(true);
    });

    it('forces reconnection', async () => {
      const mockOfflineHandler = (roomService as any).offlineHandler;
      
      await roomService.forceReconnect();

      expect(mockOfflineHandler.forceReconnect).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('disposes resources properly', async () => {
      await roomService.connectToLobby();
      await roomService.dispose();

      expect(mockLobbyConnection.leave).toHaveBeenCalled();
      expect(roomService.isConnected()).toBe(false);
    });

    it('clears event handlers on dispose', async () => {
      const handler = jest.fn();
      roomService.on('connected', handler);

      await roomService.dispose();

      // Event handlers should be cleared
      (roomService as any).emit('connected', {});
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('returns same instance from getRoomService', () => {
      const { getRoomService, resetRoomService } = require('../room-service');
      
      resetRoomService(); // Clear any existing instance
      
      const instance1 = getRoomService();
      const instance2 = getRoomService();
      
      expect(instance1).toBe(instance2);
    });

    it('resets singleton instance', () => {
      const { getRoomService, resetRoomService } = require('../room-service');
      
      const instance1 = getRoomService();
      resetRoomService();
      const instance2 = getRoomService();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});