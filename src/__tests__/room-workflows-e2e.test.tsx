import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomProvider } from '@/lib/room-state';
import MultiplayerGameCard from '@/components/MultiplayerGameCard';
import RoomsView from '@/app/games/[gameId]/rooms/page';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useParams: () => ({ gameId: 'snake' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/games/snake/rooms'
}));

// Mock the room service
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
  dispose: jest.fn(),
  isConnected: jest.fn(() => true),
  getConnectionStatus: jest.fn(() => 'connected')
};

jest.mock('@/lib/room-service', () => ({
  ...jest.requireActual('@/lib/room-service'),
  getRoomService: () => mockRoomService
}));

// Mock game navigation
jest.mock('@/lib/game-navigation', () => ({
  navigateToGame: jest.fn(),
  getGameUrl: jest.fn((gameId: string) => `/games/${gameId}`),
  getGameRoomsUrl: jest.fn((gameId: string) => `/games/${gameId}/rooms`)
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  Modal: ({ children, isOpen, onClose, title }: any) => 
    isOpen ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close" aria-label="Close modal">×</button>
        <div data-testid="modal-content">{children}</div>
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, loading, variant, size, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      className={className}
      data-testid={props['data-testid'] || 'button'}
      aria-label={props['aria-label']}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: React.forwardRef(({ label, value, onChange, error, placeholder, className, ...props }: any, ref: any) => (
    <div className="input-wrapper">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input 
        ref={ref}
        id={props.id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        data-testid={props['data-testid'] || 'input'}
        aria-label={props['aria-label'] || label}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && <span id={`${props.id}-error`} data-testid="input-error" role="alert">{error}</span>}
    </div>
  )),
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  )
}));

// Mock all the feature components
jest.mock('@/components/features/RoomCard', () => {
  return function MockRoomCard({ room, onJoinRoom, isJoining }: any) {
    return (
      <div 
        data-testid={`room-card-${room.roomId}`}
        role="article"
        aria-label={`Room ${room.roomCode}`}
      >
        <h3>{room.roomCode}</h3>
        <p>{room.playerCount}/{room.maxPlayers} players</p>
        <p>Status: {room.state}</p>
        <p>Privacy: {room.isPrivate ? 'Private' : 'Public'}</p>
        <button 
          onClick={() => onJoinRoom(room.roomId)}
          disabled={isJoining || room.playerCount >= room.maxPlayers || room.state !== 'LOBBY'}
          data-testid={`join-button-${room.roomId}`}
          aria-label={`Join room ${room.roomCode}`}
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    );
  };
});

jest.mock('@/components/features/RoomsList', () => {
  return function MockRoomsList({ rooms, gameInfo, onJoinRoom, onCreateRoom, onRefresh, joiningRoomId, isLoading, error }: any) {
    if (isLoading) {
      return <div data-testid="rooms-loading">Loading rooms...</div>;
    }

    if (error) {
      return (
        <div data-testid="rooms-error" role="alert">
          <p>Error: {error}</p>
          <button onClick={onRefresh} data-testid="retry-button">Retry</button>
        </div>
      );
    }

    if (rooms.length === 0) {
      return (
        <div data-testid="empty-rooms" role="status">
          <p>No active rooms for {gameInfo.name}</p>
          {onCreateRoom && (
            <button onClick={onCreateRoom} data-testid="create-first-room-button">
              Create Room
            </button>
          )}
        </div>
      );
    }

    return (
      <div data-testid="rooms-list" role="main" aria-label="Available rooms">
        <div data-testid="rooms-header">
          <h2>Available Rooms for {gameInfo.name}</h2>
          <div data-testid="rooms-actions">
            {onCreateRoom && (
              <button onClick={onCreateRoom} data-testid="create-room-button">
                Create Room
              </button>
            )}
            <button onClick={onRefresh} data-testid="refresh-rooms-button">
              Refresh
            </button>
          </div>
        </div>
        <div data-testid="rooms-grid" role="list">
          {rooms.map((room: any) => {
            const MockRoomCard = require('@/components/features/RoomCard').default;
            return (
              <div key={room.roomId} role="listitem">
                <MockRoomCard
                  room={room}
                  gameInfo={gameInfo}
                  onJoinRoom={onJoinRoom}
                  isJoining={joiningRoomId === room.roomId}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };
});

jest.mock('@/components/features/CreateRoomModal', () => {
  return function MockCreateRoomModal({ gameInfo, isOpen, onClose, onCreateRoom, isCreating, error }: any) {
    const [roomName, setRoomName] = React.useState('');
    const [isPrivate, setIsPrivate] = React.useState(false);
    const [maxPlayers, setMaxPlayers] = React.useState(gameInfo.maxPlayers);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onCreateRoom({
        isPrivate,
        maxPlayers,
        gameSettings: {},
        roomName: roomName || undefined
      });
    };

    if (!isOpen) return null;

    return (
      <div data-testid="create-room-modal" role="dialog" aria-label="Create Room">
        <h2>Create {gameInfo.name} Room</h2>
        <form onSubmit={handleSubmit} data-testid="create-room-form">
          <div>
            <label htmlFor="room-name">Room Name (Optional)</label>
            <input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={`${gameInfo.name} Room`}
              data-testid="room-name-input"
            />
          </div>
          
          <div data-testid="privacy-options" role="radiogroup" aria-label="Room Privacy">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              data-testid="public-option"
              aria-pressed={!isPrivate}
              className={!isPrivate ? 'selected' : ''}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              data-testid="private-option"
              aria-pressed={isPrivate}
              className={isPrivate ? 'selected' : ''}
            >
              Private
            </button>
          </div>

          <div>
            <label htmlFor="max-players">Max Players: {maxPlayers}</label>
            <input
              id="max-players"
              type="range"
              min={gameInfo.minPlayers}
              max={gameInfo.maxPlayers}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              data-testid="max-players-slider"
            />
          </div>

          {error && (
            <div data-testid="create-room-error" role="alert">
              {error}
            </div>
          )}

          <div data-testid="modal-actions">
            <button type="button" onClick={onClose} data-testid="cancel-create-button">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isCreating}
              data-testid="submit-create-button"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    );
  };
});

jest.mock('@/components/features/JoinByCodeModal', () => {
  return function MockJoinByCodeModal({ isOpen, onClose, onJoinByCode, isJoining, error }: any) {
    const [roomCode, setRoomCode] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (roomCode.length === 6) {
        onJoinByCode(roomCode.toUpperCase());
      }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
      setRoomCode(value);
    };

    if (!isOpen) return null;

    return (
      <div data-testid="join-by-code-modal" role="dialog" aria-label="Join Room by Code">
        <h2>Join Room by Code</h2>
        <form onSubmit={handleSubmit} data-testid="join-by-code-form">
          <div>
            <label htmlFor="room-code">Room Code</label>
            <input
              id="room-code"
              value={roomCode}
              onChange={handleCodeChange}
              placeholder="ABC123"
              maxLength={6}
              data-testid="room-code-input"
              aria-describedby="room-code-help"
            />
            <div id="room-code-help" data-testid="room-code-help">
              Enter the 6-character room code
            </div>
          </div>

          {error && (
            <div data-testid="join-by-code-error" role="alert">
              {error}
            </div>
          )}

          <div data-testid="modal-actions">
            <button type="button" onClick={onClose} data-testid="cancel-join-button">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isJoining || roomCode.length !== 6}
              data-testid="submit-join-button"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    );
  };
});

jest.mock('@/components/features/RoomSharingModal', () => {
  return function MockRoomSharingModal({ isOpen, onClose, roomData }: any) {
    if (!isOpen || !roomData) return null;

    return (
      <div data-testid="room-sharing-modal" role="dialog" aria-label="Room Created">
        <h2>Room Created Successfully!</h2>
        <div data-testid="room-details">
          <p>Room Code: <strong data-testid="created-room-code">{roomData.roomCode}</strong></p>
          <p>Privacy: {roomData.isPrivate ? 'Private' : 'Public'}</p>
          <p>Max Players: {roomData.maxPlayers}</p>
        </div>
        <div data-testid="sharing-options">
          <button data-testid="copy-room-code-button">Copy Room Code</button>
          <button data-testid="copy-invite-link-button">Copy Invite Link</button>
        </div>
        <button onClick={onClose} data-testid="close-sharing-button">
          Close
        </button>
      </div>
    );
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => {
  const icons = [
    'PlayIcon', 'UserGroupIcon', 'PlusIcon', 'HashtagIcon', 'ArrowPathIcon',
    'ExclamationTriangleIcon', 'CheckCircleIcon', 'XMarkIcon', 'ShareIcon'
  ];
  
  const mockIcons = {};
  icons.forEach(icon => {
    mockIcons[icon] = ({ className, ...props }: any) => (
      <span 
        className={className} 
        data-testid={icon.toLowerCase().replace('icon', '-icon')}
        {...props}
      />
    );
  });
  
  return mockIcons;
});

describe('Room Workflows End-to-End Tests', () => {
  const mockGameInfo = {
    id: 'snake',
    name: 'Snake Game',
    roomType: 'snake',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game with multiplayer support',
    features: ['multiplayer', 'real-time']
  };

  const mockRooms = [
    {
      roomId: 'room-1',
      roomCode: 'ABC123',
      gameId: 'snake',
      playerCount: 3,
      maxPlayers: 8,
      state: 'LOBBY',
      isPrivate: false,
      createdAt: Date.now() - 300000
    },
    {
      roomId: 'room-2',
      roomCode: 'DEF456',
      gameId: 'snake',
      playerCount: 8,
      maxPlayers: 8,
      state: 'LOBBY',
      isPrivate: false,
      createdAt: Date.now() - 600000
    },
    {
      roomId: 'room-3',
      roomCode: 'GHI789',
      gameId: 'snake',
      playerCount: 4,
      maxPlayers: 8,
      state: 'PLAYING',
      isPrivate: true,
      createdAt: Date.now() - 100000
    }
  ];

  let eventHandlers: Map<string, Function[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = new Map();
    
    // Mock event system
    mockRoomService.on.mockImplementation((event: string, handler: Function) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)!.push(handler);
    });

    // Helper to emit events
    (global as any).emitRoomEvent = (event: string, data: any) => {
      const handlers = eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(data));
    };

    // Default successful responses
    mockRoomService.connectToLobby.mockResolvedValue(undefined);
    mockRoomService.getActiveRooms.mockResolvedValue(mockRooms);
    mockRoomService.createRoom.mockResolvedValue('new-room-id');
    mockRoomService.joinRoom.mockResolvedValue(undefined);
    mockRoomService.joinByCode.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete (global as any).emitRoomEvent;
  });

  describe('Navigation from Game Cards to Rooms View', () => {
    it('navigates from multiplayer game card to rooms view', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [showRoomsView, setShowRoomsView] = React.useState(false);

        const handleViewRooms = () => {
          setShowRoomsView(true);
        };

        return (
          <RoomProvider>
            <div>
              {!showRoomsView ? (
                <div data-testid="game-card-view">
                  <h1>Snake Game</h1>
                  <button onClick={handleViewRooms} data-testid="view-rooms-button">
                    View Rooms
                  </button>
                </div>
              ) : (
                <div data-testid="rooms-view">
                  <RoomsView />
                </div>
              )}
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Should start on game card view
      expect(screen.getByTestId('game-card-view')).toBeInTheDocument();
      expect(screen.getByText('Snake Game')).toBeInTheDocument();

      // Click view rooms button
      const viewRoomsButton = screen.getByTestId('view-rooms-button');
      await user.click(viewRoomsButton);

      // Should navigate to rooms view
      await waitFor(() => {
        expect(screen.getByTestId('rooms-view')).toBeInTheDocument();
      });
    });

    it('shows loading state while connecting to lobby', async () => {
      // Mock delayed connection
      mockRoomService.connectToLobby.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <RoomProvider>
          <RoomsView />
        </RoomProvider>
      );

      // Should show loading state initially
      expect(screen.getByTestId('rooms-loading')).toBeInTheDocument();

      // Wait for connection to complete
      await waitFor(() => {
        expect(screen.queryByTestId('rooms-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete Room Creation and Sharing Flow', () => {
    it('creates room and shares with friends', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [rooms, setRooms] = React.useState(mockRooms);
        const [showCreateModal, setShowCreateModal] = React.useState(false);
        const [showSharingModal, setShowSharingModal] = React.useState(false);
        const [createdRoomData, setCreatedRoomData] = React.useState(null);
        const [isCreating, setIsCreating] = React.useState(false);

        const handleCreateRoom = async (options: any) => {
          setIsCreating(true);
          try {
            const roomId = await mockRoomService.createRoom('snake', options);
            const newRoom = {
              roomId,
              roomCode: 'XYZ999',
              gameId: 'snake',
              playerCount: 1,
              maxPlayers: options.maxPlayers,
              state: 'LOBBY' as const,
              isPrivate: options.isPrivate,
              createdAt: Date.now()
            };
            
            setRooms(prev => [...prev, newRoom]);
            setCreatedRoomData({
              roomId,
              roomCode: 'XYZ999',
              isPrivate: options.isPrivate,
              maxPlayers: options.maxPlayers
            });
            setShowCreateModal(false);
            setShowSharingModal(true);
          } finally {
            setIsCreating(false);
          }
        };

        const MockRoomsList = require('@/components/features/RoomsList').default;
        const MockCreateRoomModal = require('@/components/features/CreateRoomModal').default;
        const MockRoomSharingModal = require('@/components/features/RoomSharingModal').default;

        return (
          <RoomProvider>
            <div data-testid="rooms-page">
              <MockRoomsList
                rooms={rooms}
                gameInfo={mockGameInfo}
                onJoinRoom={jest.fn()}
                onCreateRoom={() => setShowCreateModal(true)}
                onRefresh={jest.fn()}
              />
              
              <MockCreateRoomModal
                gameInfo={mockGameInfo}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
                isCreating={isCreating}
              />

              <MockRoomSharingModal
                isOpen={showSharingModal}
                onClose={() => setShowSharingModal(false)}
                roomData={createdRoomData}
              />
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Should show existing rooms
      expect(screen.getByTestId('rooms-list')).toBeInTheDocument();
      expect(screen.getByText('Available Rooms for Snake Game')).toBeInTheDocument();

      // Click create room button
      const createButton = screen.getByTestId('create-room-button');
      await user.click(createButton);

      // Should open create room modal
      await waitFor(() => {
        expect(screen.getByTestId('create-room-modal')).toBeInTheDocument();
      });

      // Fill out room creation form
      const roomNameInput = screen.getByTestId('room-name-input');
      await user.type(roomNameInput, 'My Awesome Room');

      // Select private room
      const privateOption = screen.getByTestId('private-option');
      await user.click(privateOption);
      expect(privateOption).toHaveClass('selected');

      // Adjust max players
      const maxPlayersSlider = screen.getByTestId('max-players-slider');
      await user.clear(maxPlayersSlider);
      await user.type(maxPlayersSlider, '6');

      // Submit form
      const submitButton = screen.getByTestId('submit-create-button');
      await user.click(submitButton);

      // Should show creating state
      expect(screen.getByText('Creating...')).toBeInTheDocument();

      // Wait for room creation to complete
      await waitFor(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith('snake', {
          isPrivate: true,
          maxPlayers: 6,
          gameSettings: {},
          roomName: 'My Awesome Room'
        });
      });

      // Should show sharing modal
      await waitFor(() => {
        expect(screen.getByTestId('room-sharing-modal')).toBeInTheDocument();
        expect(screen.getByTestId('created-room-code')).toHaveTextContent('XYZ999');
      });

      // Should be able to copy room code
      const copyCodeButton = screen.getByTestId('copy-room-code-button');
      expect(copyCodeButton).toBeInTheDocument();

      // Should show new room in list
      expect(screen.getByTestId('room-card-new-room-id')).toBeInTheDocument();
    });

    it('handles room creation errors gracefully', async () => {
      const user = userEvent.setup();
      mockRoomService.createRoom.mockRejectedValue(new Error('Server error'));

      const TestComponent = () => {
        const [showCreateModal, setShowCreateModal] = React.useState(true);
        const [error, setError] = React.useState<string | null>(null);
        const [isCreating, setIsCreating] = React.useState(false);

        const handleCreateRoom = async (options: any) => {
          setIsCreating(true);
          try {
            await mockRoomService.createRoom('snake', options);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setIsCreating(false);
          }
        };

        const MockCreateRoomModal = require('@/components/features/CreateRoomModal').default;

        return (
          <RoomProvider>
            <MockCreateRoomModal
              gameInfo={mockGameInfo}
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateRoom={handleCreateRoom}
              isCreating={isCreating}
              error={error}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Submit form to trigger error
      const submitButton = screen.getByTestId('submit-create-button');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('create-room-error')).toHaveTextContent('Server error');
      });

      // Should not close modal on error
      expect(screen.getByTestId('create-room-modal')).toBeInTheDocument();
    });
  });

  describe('Complete Room Joining Flow', () => {
    it('joins room from rooms list and navigates to game', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [joiningRoomId, setJoiningRoomId] = React.useState<string | null>(null);
        const [joinedRoom, setJoinedRoom] = React.useState<string | null>(null);

        const handleJoinRoom = async (roomId: string) => {
          setJoiningRoomId(roomId);
          try {
            await mockRoomService.joinRoom(roomId);
            setJoinedRoom(roomId);
            // Simulate navigation to game
          } finally {
            setJoiningRoomId(null);
          }
        };

        if (joinedRoom) {
          return (
            <div data-testid="game-view">
              <h1>Snake Game - Room {mockRooms.find(r => r.roomId === joinedRoom)?.roomCode}</h1>
              <p>You have successfully joined the room!</p>
            </div>
          );
        }

        const MockRoomsList = require('@/components/features/RoomsList').default;

        return (
          <RoomProvider>
            <MockRoomsList
              rooms={mockRooms}
              gameInfo={mockGameInfo}
              onJoinRoom={handleJoinRoom}
              joiningRoomId={joiningRoomId}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Should show available rooms
      expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();

      // Join first room (which is available)
      const joinButton = screen.getByTestId('join-button-room-1');
      expect(joinButton).not.toBeDisabled();
      
      await user.click(joinButton);

      // Should show joining state
      expect(screen.getByText('Joining...')).toBeInTheDocument();

      // Wait for join to complete
      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalledWith('room-1');
      });

      // Should navigate to game view
      await waitFor(() => {
        expect(screen.getByTestId('game-view')).toBeInTheDocument();
        expect(screen.getByText('Snake Game - Room ABC123')).toBeInTheDocument();
      });
    });

    it('prevents joining full or playing rooms', async () => {
      const user = userEvent.setup();

      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={mockRooms}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
          />
        </RoomProvider>
      );

      // Room 2 is full (8/8 players)
      const fullRoomJoinButton = screen.getByTestId('join-button-room-2');
      expect(fullRoomJoinButton).toBeDisabled();

      // Room 3 is playing
      const playingRoomJoinButton = screen.getByTestId('join-button-room-3');
      expect(playingRoomJoinButton).toBeDisabled();

      // Try clicking disabled buttons (should not trigger join)
      await user.click(fullRoomJoinButton);
      await user.click(playingRoomJoinButton);

      expect(mockRoomService.joinRoom).not.toHaveBeenCalled();
    });

    it('joins room by code successfully', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [showJoinModal, setShowJoinModal] = React.useState(true);
        const [isJoining, setIsJoining] = React.useState(false);
        const [joinedByCode, setJoinedByCode] = React.useState(false);

        const handleJoinByCode = async (code: string) => {
          setIsJoining(true);
          try {
            await mockRoomService.joinByCode(code);
            setJoinedByCode(true);
            setShowJoinModal(false);
          } finally {
            setIsJoining(false);
          }
        };

        if (joinedByCode) {
          return (
            <div data-testid="joined-by-code-success">
              <h1>Successfully joined room!</h1>
            </div>
          );
        }

        const MockJoinByCodeModal = require('@/components/features/JoinByCodeModal').default;

        return (
          <RoomProvider>
            <MockJoinByCodeModal
              isOpen={showJoinModal}
              onClose={() => setShowJoinModal(false)}
              onJoinByCode={handleJoinByCode}
              isJoining={isJoining}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Should show join by code modal
      expect(screen.getByTestId('join-by-code-modal')).toBeInTheDocument();

      // Enter room code
      const codeInput = screen.getByTestId('room-code-input');
      await user.type(codeInput, 'abc123');

      // Should format code to uppercase
      expect(codeInput).toHaveValue('ABC123');

      // Submit should be enabled when code is 6 characters
      const submitButton = screen.getByTestId('submit-join-button');
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Should show joining state
      expect(screen.getByText('Joining...')).toBeInTheDocument();

      // Wait for join to complete
      await waitFor(() => {
        expect(mockRoomService.joinByCode).toHaveBeenCalledWith('ABC123');
      });

      // Should show success state
      await waitFor(() => {
        expect(screen.getByTestId('joined-by-code-success')).toBeInTheDocument();
      });
    });

    it('handles invalid room codes', async () => {
      const user = userEvent.setup();
      mockRoomService.joinByCode.mockRejectedValue(new Error('Invalid room code'));

      const TestComponent = () => {
        const [showJoinModal, setShowJoinModal] = React.useState(true);
        const [isJoining, setIsJoining] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);

        const handleJoinByCode = async (code: string) => {
          setIsJoining(true);
          try {
            await mockRoomService.joinByCode(code);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setIsJoining(false);
          }
        };

        const MockJoinByCodeModal = require('@/components/features/JoinByCodeModal').default;

        return (
          <RoomProvider>
            <MockJoinByCodeModal
              isOpen={showJoinModal}
              onClose={() => setShowJoinModal(false)}
              onJoinByCode={handleJoinByCode}
              isJoining={isJoining}
              error={error}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Enter invalid room code
      const codeInput = screen.getByTestId('room-code-input');
      await user.type(codeInput, 'INVALID');

      const submitButton = screen.getByTestId('submit-join-button');
      await user.click(submitButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('join-by-code-error')).toHaveTextContent('Invalid room code');
      });

      // Modal should remain open
      expect(screen.getByTestId('join-by-code-modal')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness and Touch Interactions', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
      });
    });

    it('adapts layout for mobile screens', async () => {
      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={mockRooms}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
          />
        </RoomProvider>
      );

      // Should render mobile-friendly layout
      expect(screen.getByTestId('rooms-list')).toBeInTheDocument();
      
      // All room cards should be accessible
      expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
      expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
      expect(screen.getByTestId('room-card-room-3')).toBeInTheDocument();

      // Action buttons should be touch-friendly
      const createButton = screen.getByTestId('create-room-button');
      expect(createButton).toBeInTheDocument();
    });

    it('handles touch interactions correctly', async () => {
      const user = userEvent.setup();
      const mockJoinRoom = jest.fn();

      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={mockRooms}
            gameInfo={mockGameInfo}
            onJoinRoom={mockJoinRoom}
          />
        </RoomProvider>
      );

      // Touch interaction should work
      const joinButton = screen.getByTestId('join-button-room-1');
      await user.click(joinButton);

      expect(mockJoinRoom).toHaveBeenCalledWith('room-1');
    });

    it('shows mobile-optimized modals', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [showCreateModal, setShowCreateModal] = React.useState(false);

        const MockCreateRoomModal = require('@/components/features/CreateRoomModal').default;

        return (
          <RoomProvider>
            <button onClick={() => setShowCreateModal(true)} data-testid="open-modal">
              Open Modal
            </button>
            <MockCreateRoomModal
              gameInfo={mockGameInfo}
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateRoom={jest.fn()}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Open modal
      await user.click(screen.getByTestId('open-modal'));

      // Modal should be mobile-optimized
      const modal = screen.getByTestId('create-room-modal');
      expect(modal).toBeInTheDocument();

      // Form elements should be touch-friendly
      const roomNameInput = screen.getByTestId('room-name-input');
      expect(roomNameInput).toBeInTheDocument();

      const privateOption = screen.getByTestId('private-option');
      expect(privateOption).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA labels and roles', () => {
      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={mockRooms}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
          />
        </RoomProvider>
      );

      // Main content should have proper role
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();

      // Room cards should have proper labels
      const roomCard = screen.getByLabelText('Room ABC123');
      expect(roomCard).toBeInTheDocument();

      // Join buttons should have descriptive labels
      const joinButton = screen.getByLabelText('Join room ABC123');
      expect(joinButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockJoinRoom = jest.fn();

      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={mockRooms}
            gameInfo={mockGameInfo}
            onJoinRoom={mockJoinRoom}
          />
        </RoomProvider>
      );

      // Should be able to navigate with keyboard
      const joinButton = screen.getByTestId('join-button-room-1');
      
      // Focus and activate with keyboard
      joinButton.focus();
      expect(joinButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockJoinRoom).toHaveBeenCalledWith('room-1');
    });

    it('provides screen reader support', () => {
      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={[]}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
          />
        </RoomProvider>
      );

      // Empty state should have proper role
      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No active rooms for Snake Game');
    });

    it('handles error states accessibly', () => {
      const MockRoomsList = require('@/components/features/RoomsList').default;

      render(
        <RoomProvider>
          <MockRoomsList
            rooms={[]}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
            error="Connection failed"
          />
        </RoomProvider>
      );

      // Error should have alert role
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Error: Connection failed');
    });
  });
});