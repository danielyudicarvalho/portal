import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { RoomProvider, useRoomContext, useRoomState, useRoomActions } from '../room-state';
import { RoomService, ActiveRoom, GameInfo, RoomStatistics } from '../room-service';

// Mock the room service
jest.mock('../room-service', () => {
  const mockRoomService = {
    connectToLobby: jest.fn(),
    disconnectFromLobby: jest.fn(),
    getActiveRooms: jest.fn(),
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    joinByCode: jest.fn(),
    quickMatch: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    dispose: jest.fn()
  };

  return {
    ...jest.requireActual('../room-service'),
    getRoomService: jest.fn(() => mockRoomService),
    resetRoomService: jest.fn()
  };
});

// Test component that uses the room context
const TestComponent: React.FC = () => {
  const { state, connectToLobby, createRoom, joinRoom } = useRoomContext();
  
  return (
    <div>
      <div data-testid="connection-status">{state.connectionStatus}</div>
      <div data-testid="is-connected">{state.isConnected.toString()}</div>
      <div data-testid="is-loading">{state.isLoading.toString()}</div>
      <div data-testid="error">{state.error || 'none'}</div>
      <div data-testid="rooms-count">{state.rooms.length}</div>
      <div data-testid="selected-game">{state.selectedGameId || 'none'}</div>
      
      <button onClick={connectToLobby} data-testid="connect-button">
        Connect
      </button>
      <button 
        onClick={() => createRoom('snake', { isPrivate: false, maxPlayers: 6 })} 
        data-testid="create-room-button"
      >
        Create Room
      </button>
      <button onClick={() => joinRoom('room-123')} data-testid="join-room-button">
        Join Room
      </button>
    </div>
  );
};

// Test component that uses individual hooks
const HooksTestComponent: React.FC = () => {
  const state = useRoomState();
  const actions = useRoomActions();
  
  return (
    <div>
      <div data-testid="hook-connection-status">{state.connectionStatus}</div>
      <button onClick={actions.connectToLobby} data-testid="hook-connect-button">
        Connect
      </button>
    </div>
  );
};

describe('RoomProvider and Context', () => {
  let mockRoomService: jest.Mocked<RoomService>;

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

  const mockStatistics: RoomStatistics = {
    totalRooms: 1,
    publicRooms: 1,
    privateRooms: 0,
    totalPlayers: 3,
    averagePlayersPerRoom: 3,
    roomsByState: {
      LOBBY: 1,
      COUNTDOWN: 0,
      PLAYING: 0,
      RESULTS: 0,
      RESET: 0
    }
  };

  beforeEach(() => {
    const { getRoomService } = require('../room-service');
    mockRoomService = getRoomService();
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('rooms-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-game')).toHaveTextContent('none');
  });

  it('connects to lobby successfully', async () => {
    mockRoomService.connectToLobby.mockResolvedValue();

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const connectButton = screen.getByTestId('connect-button');
    
    await act(async () => {
      connectButton.click();
    });

    expect(mockRoomService.connectToLobby).toHaveBeenCalled();
  });

  it('handles connection error', async () => {
    mockRoomService.connectToLobby.mockRejectedValue(new Error('Connection failed'));

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const connectButton = screen.getByTestId('connect-button');
    
    await act(async () => {
      connectButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to connect to multiplayer server');
    });
  });

  it('handles room creation', async () => {
    mockRoomService.createRoom.mockResolvedValue('room-123');

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const createButton = screen.getByTestId('create-room-button');
    
    await act(async () => {
      createButton.click();
    });

    expect(mockRoomService.createRoom).toHaveBeenCalledWith('snake', {
      isPrivate: false,
      maxPlayers: 6
    });
  });

  it('handles room joining', async () => {
    mockRoomService.joinRoom.mockResolvedValue();

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const joinButton = screen.getByTestId('join-room-button');
    
    await act(async () => {
      joinButton.click();
    });

    expect(mockRoomService.joinRoom).toHaveBeenCalledWith('room-123', []);
  });

  it('sets up event listeners on mount', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Verify that event listeners are registered
    expect(mockRoomService.on).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('rooms_updated', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('room_state_changed', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('room_created', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('room_joined', expect.any(Function));
    expect(mockRoomService.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    unmount();

    // Verify that event listeners are removed
    expect(mockRoomService.off).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mockRoomService.off).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mockRoomService.off).toHaveBeenCalledWith('rooms_updated', expect.any(Function));
  });

  it('handles connected event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Get the connected event handler
    const connectedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'connected'
    )?.[1];

    expect(connectedHandler).toBeDefined();

    // Simulate connected event
    act(() => {
      connectedHandler!();
    });

    expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
    expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
  });

  it('handles disconnected event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Get the disconnected event handler
    const disconnectedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'disconnected'
    )?.[1];

    expect(disconnectedHandler).toBeDefined();

    // Simulate disconnected event
    act(() => {
      disconnectedHandler!();
    });

    expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
    expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
  });

  it('handles rooms updated event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Get the rooms updated event handler
    const roomsUpdatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'rooms_updated'
    )?.[1];

    expect(roomsUpdatedHandler).toBeDefined();

    // Simulate rooms updated event
    act(() => {
      roomsUpdatedHandler!({
        rooms: [mockRoom],
        statistics: mockStatistics
      });
    });

    expect(screen.getByTestId('rooms-count')).toHaveTextContent('1');
  });

  it('handles room state changed event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // First, add a room to state
    const roomsUpdatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'rooms_updated'
    )?.[1];

    act(() => {
      roomsUpdatedHandler!({
        rooms: [mockRoom],
        statistics: mockStatistics
      });
    });

    // Get the room state changed event handler
    const stateChangedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'room_state_changed'
    )?.[1];

    expect(stateChangedHandler).toBeDefined();

    // Simulate room state change
    act(() => {
      stateChangedHandler!({
        roomId: 'room-123',
        newState: 'PLAYING'
      });
    });

    // The room state should be updated (this would be visible in a more detailed component)
    expect(screen.getByTestId('rooms-count')).toHaveTextContent('1');
  });

  it('handles room created event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Get the room created event handler
    const roomCreatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'room_created'
    )?.[1];

    expect(roomCreatedHandler).toBeDefined();

    // Simulate room created event
    act(() => {
      roomCreatedHandler!({
        roomId: 'room-123',
        roomCode: 'ABC123'
      });
    });

    // This would trigger modal state changes in a real implementation
  });

  it('handles error event', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Get the error event handler
    const errorHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];

    expect(errorHandler).toBeDefined();

    // Simulate error event
    act(() => {
      errorHandler!({
        code: 'CONNECTION_FAILED',
        message: 'Connection failed'
      });
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useRoomContext must be used within a RoomProvider');

    consoleSpy.mockRestore();
  });

  it('provides individual hooks', () => {
    render(
      <RoomProvider>
        <HooksTestComponent />
      </RoomProvider>
    );

    expect(screen.getByTestId('hook-connection-status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('hook-connect-button')).toBeInTheDocument();
  });

  it('handles custom server URL', () => {
    const customUrl = 'ws://custom-server:3002';
    
    render(
      <RoomProvider serverUrl={customUrl}>
        <TestComponent />
      </RoomProvider>
    );

    const { getRoomService } = require('../room-service');
    expect(getRoomService).toHaveBeenCalledWith(customUrl);
  });
});

describe('Room State Reducer', () => {
  // We'll test the reducer indirectly through the provider
  it('handles SET_LOADING action', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Initially not loading
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');

    // Trigger an action that sets loading to true
    const connectButton = screen.getByTestId('connect-button');
    
    act(() => {
      connectButton.click();
    });

    // Should show loading state briefly
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('handles SET_ERROR action', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // Simulate error through event handler
    const errorHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];

    act(() => {
      errorHandler!({
        code: 'TEST_ERROR',
        message: 'Test error message'
      });
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Test error message');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
  });

  it('handles SET_ROOMS action', () => {
    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const roomsUpdatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'rooms_updated'
    )?.[1];

    act(() => {
      roomsUpdatedHandler!({
        rooms: [mockRoom, { ...mockRoom, roomId: 'room-456' }],
        statistics: { ...mockStatistics, totalRooms: 2 }
      });
    });

    expect(screen.getByTestId('rooms-count')).toHaveTextContent('2');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
});

describe('Performance Optimizations', () => {
  it('debounces room updates', async () => {
    jest.useFakeTimers();

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    const roomsUpdatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'rooms_updated'
    )?.[1];

    // Simulate rapid updates
    act(() => {
      roomsUpdatedHandler!({ rooms: [mockRoom], statistics: mockStatistics });
      roomsUpdatedHandler!({ rooms: [mockRoom], statistics: mockStatistics });
      roomsUpdatedHandler!({ rooms: [mockRoom], statistics: mockStatistics });
    });

    // Should still show loading initially due to debouncing
    expect(screen.getByTestId('rooms-count')).toHaveTextContent('0');

    // Fast-forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Now should show the updated rooms
    expect(screen.getByTestId('rooms-count')).toHaveTextContent('1');

    jest.useRealTimers();
  });

  it('batches state changes', async () => {
    jest.useFakeTimers();

    render(
      <RoomProvider>
        <TestComponent />
      </RoomProvider>
    );

    // First add rooms
    const roomsUpdatedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'rooms_updated'
    )?.[1];

    act(() => {
      roomsUpdatedHandler!({
        rooms: [mockRoom, { ...mockRoom, roomId: 'room-456' }],
        statistics: mockStatistics
      });
    });

    // Fast-forward to apply debounced update
    act(() => {
      jest.advanceTimersByTime(150);
    });

    const stateChangedHandler = mockRoomService.on.mock.calls.find(
      call => call[0] === 'room_state_changed'
    )?.[1];

    // Simulate rapid state changes
    act(() => {
      stateChangedHandler!({ roomId: 'room-123', newState: 'COUNTDOWN' });
      stateChangedHandler!({ roomId: 'room-456', newState: 'PLAYING' });
      stateChangedHandler!({ roomId: 'room-123', newState: 'PLAYING' });
    });

    // Fast-forward past batch delay
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // State changes should be applied
    expect(screen.getByTestId('rooms-count')).toHaveTextContent('2');

    jest.useRealTimers();
  });
});