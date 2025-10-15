import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomProvider } from '@/lib/room-state';
import RoomsList from '@/components/features/RoomsList';
import CreateRoomModal from '@/components/features/CreateRoomModal';
import JoinByCodeModal from '@/components/features/JoinByCodeModal';
import { RoomService, ActiveRoom, GameInfo, RoomStatistics } from '@/lib/room-service';

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

// Mock UI components
jest.mock('@/components/ui', () => ({
  Modal: ({ children, isOpen, onClose, title }: any) => 
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, loading, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: React.forwardRef(({ label, value, onChange, error, ...props }: any, ref: any) => (
    <div>
      {label && <label>{label}</label>}
      <input 
        ref={ref}
        value={value}
        onChange={onChange}
        data-testid={props['data-testid'] || 'input'}
        {...props}
      />
      {error && <span data-testid="input-error">{error}</span>}
    </div>
  ))
}));

// Mock child components
jest.mock('@/components/features/RoomCard', () => {
  return function MockRoomCard({ room, onJoinRoom, isJoining }: any) {
    return (
      <div data-testid={`room-card-${room.roomId}`}>
        <span>{room.roomCode}</span>
        <span>{room.playerCount}/{room.maxPlayers}</span>
        <button 
          onClick={() => onJoinRoom(room.roomId)}
          disabled={isJoining}
          data-testid={`join-button-${room.roomId}`}
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    );
  };
});

jest.mock('@/components/features/RoomCardSkeleton', () => ({
  RoomListSkeleton: ({ count }: { count: number }) => (
    <div data-testid="room-list-skeleton">Loading {count} rooms...</div>
  )
}));

jest.mock('@/components/features/LoadingStates', () => ({
  InlineLoading: () => <div data-testid="inline-loading">Loading...</div>,
  EmptyState: ({ children }: any) => <div data-testid="empty-state">{children}</div>
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => {
  const icons = [
    'MagnifyingGlassIcon', 'AdjustmentsHorizontalIcon', 'UserGroupIcon',
    'ExclamationTriangleIcon', 'PlusIcon', 'ArrowPathIcon', 'SignalIcon',
    'WifiIcon', 'HashtagIcon', 'XMarkIcon', 'ArrowRightIcon', 'LockClosedIcon',
    'LockOpenIcon', 'CogIcon', 'InformationCircleIcon'
  ];
  
  const mockIcons = {};
  icons.forEach(icon => {
    mockIcons[icon] = () => <div data-testid={icon.toLowerCase().replace('icon', '-icon')} />;
  });
  
  return mockIcons;
});

describe('Room Operations Integration Tests', () => {
  const mockGameInfo: GameInfo = {
    id: 'snake',
    name: 'Snake Game',
    roomType: 'snake',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game',
    features: ['multiplayer'],
    settings: {
      gameSpeed: {
        type: 'select',
        label: 'Game Speed',
        default: 'normal',
        options: ['slow', 'normal', 'fast']
      }
    }
  };

  const mockRooms: ActiveRoom[] = [
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
      playerCount: 6,
      maxPlayers: 8,
      state: 'PLAYING',
      isPrivate: true,
      createdAt: Date.now() - 600000
    }
  ];

  const mockStatistics: RoomStatistics = {
    totalRooms: 2,
    publicRooms: 1,
    privateRooms: 1,
    totalPlayers: 9,
    averagePlayersPerRoom: 4.5,
    roomsByState: {
      LOBBY: 1,
      COUNTDOWN: 0,
      PLAYING: 1,
      RESULTS: 0
    }
  };

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

    mockRoomService.off.mockImplementation((event: string, handler: Function) => {
      if (eventHandlers.has(event)) {
        const handlers = eventHandlers.get(event)!;
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    });

    // Helper to emit events
    (global as any).emitRoomEvent = (event: string, data: any) => {
      const handlers = eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(data));
    };
  });

  afterEach(() => {
    delete (global as any).emitRoomEvent;
  });

  describe('Complete Room Creation Workflow', () => {
    it('creates room and shows sharing modal', async () => {
      const user = userEvent.setup();
      mockRoomService.createRoom.mockResolvedValue('room-123');

      const TestComponent = () => {
        const [showCreateModal, setShowCreateModal] = React.useState(false);
        const [showSharingModal, setShowSharingModal] = React.useState(false);
        const [createdRoomData, setCreatedRoomData] = React.useState(null);

        const handleCreateRoom = async (options: any) => {
          const roomId = await mockRoomService.createRoom('snake', options);
          setCreatedRoomData({
            roomId,
            roomCode: 'ABC123',
            isPrivate: options.isPrivate,
            maxPlayers: options.maxPlayers
          });
          setShowCreateModal(false);
          setShowSharingModal(true);
        };

        return (
          <RoomProvider>
            <div>
              <button onClick={() => setShowCreateModal(true)} data-testid="open-create-modal">
                Create Room
              </button>
              
              <CreateRoomModal
                gameInfo={mockGameInfo}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
              />

              {showSharingModal && createdRoomData && (
                <div data-testid="sharing-modal">
                  <p>Room created: {(createdRoomData as any).roomCode}</p>
                  <button onClick={() => setShowSharingModal(false)}>Close</button>
                </div>
              )}
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Open create room modal
      await user.click(screen.getByTestId('open-create-modal'));
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Fill form and submit
      const gameSpeedSelect = screen.getByDisplayValue('normal');
      await user.selectOptions(gameSpeedSelect, 'fast');

      const createButton = screen.getByText('Create Room');
      await user.click(createButton);

      // Wait for room creation
      await waitFor(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith('snake', {
          isPrivate: false,
          maxPlayers: 8,
          gameSettings: {
            gameSpeed: 'fast'
          }
        });
      });

      // Should show sharing modal
      await waitFor(() => {
        expect(screen.getByTestId('sharing-modal')).toBeInTheDocument();
        expect(screen.getByText('Room created: ABC123')).toBeInTheDocument();
      });
    });

    it('handles room creation errors', async () => {
      const user = userEvent.setup();
      const createError = new Error('Server error');
      mockRoomService.createRoom.mockRejectedValue(createError);

      const TestComponent = () => {
        const [showCreateModal, setShowCreateModal] = React.useState(true);
        const [error, setError] = React.useState<string | null>(null);

        const handleCreateRoom = async (options: any) => {
          try {
            await mockRoomService.createRoom('snake', options);
          } catch (err) {
            setError((err as Error).message);
            throw err;
          }
        };

        return (
          <RoomProvider>
            <CreateRoomModal
              gameInfo={mockGameInfo}
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateRoom={handleCreateRoom}
              error={error}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      const createButton = screen.getByText('Create Room');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Room Joining Workflow', () => {
    it('joins room from rooms list', async () => {
      const user = userEvent.setup();
      mockRoomService.joinRoom.mockResolvedValue();

      const TestComponent = () => {
        const [joiningRoomId, setJoiningRoomId] = React.useState<string | null>(null);

        const handleJoinRoom = async (roomId: string) => {
          setJoiningRoomId(roomId);
          try {
            await mockRoomService.joinRoom(roomId);
            // Simulate navigation to game
            setJoiningRoomId(null);
          } catch (error) {
            setJoiningRoomId(null);
            throw error;
          }
        };

        return (
          <RoomProvider>
            <RoomsList
              rooms={mockRooms}
              gameInfo={mockGameInfo}
              statistics={mockStatistics}
              onJoinRoom={handleJoinRoom}
              joiningRoomId={joiningRoomId}
              isConnected={true}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Should show rooms
      expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
      expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();

      // Join first room
      const joinButton = screen.getByTestId('join-button-room-1');
      await user.click(joinButton);

      // Should show joining state
      expect(screen.getByText('Joining...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalledWith('room-1');
      });
    });

    it('joins room by code', async () => {
      const user = userEvent.setup();
      mockRoomService.joinByCode.mockResolvedValue();

      const TestComponent = () => {
        const [showJoinModal, setShowJoinModal] = React.useState(true);
        const [isJoining, setIsJoining] = React.useState(false);

        const handleJoinByCode = async (code: string) => {
          setIsJoining(true);
          try {
            await mockRoomService.joinByCode(code);
            setShowJoinModal(false);
          } catch (error) {
            throw error;
          } finally {
            setIsJoining(false);
          }
        };

        return (
          <RoomProvider>
            <JoinByCodeModal
              isOpen={showJoinModal}
              onClose={() => setShowJoinModal(false)}
              onJoinByCode={handleJoinByCode}
              isJoining={isJoining}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Enter room code
      const codeInput = screen.getByLabelText('Room Code');
      await user.type(codeInput, 'ABC123');

      // Submit
      const joinButton = screen.getByText('Join Room');
      await user.click(joinButton);

      // Should show joining state
      expect(screen.getByText('Joining...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockRoomService.joinByCode).toHaveBeenCalledWith('ABC123');
      });
    });

    it('handles room join errors with alternatives', async () => {
      const user = userEvent.setup();
      const joinError = new Error('Room is full') as any;
      joinError.code = 'ROOM_FULL';
      joinError.alternatives = [
        {
          roomId: 'alt-room-1',
          roomCode: 'XYZ789',
          playerCount: 2,
          maxPlayers: 8,
          state: 'LOBBY',
          similarity: 0.8
        }
      ];
      mockRoomService.joinRoom.mockRejectedValue(joinError);

      const TestComponent = () => {
        const [error, setError] = React.useState<any>(null);
        const [alternatives, setAlternatives] = React.useState<any[]>([]);

        const handleJoinRoom = async (roomId: string) => {
          try {
            await mockRoomService.joinRoom(roomId);
          } catch (err: any) {
            setError(err.message);
            if (err.alternatives) {
              setAlternatives(err.alternatives);
            }
            throw err;
          }
        };

        return (
          <RoomProvider>
            <div>
              <RoomsList
                rooms={mockRooms}
                gameInfo={mockGameInfo}
                onJoinRoom={handleJoinRoom}
              />
              
              {error && (
                <div data-testid="error-message">{error}</div>
              )}
              
              {alternatives.length > 0 && (
                <div data-testid="alternatives">
                  <p>Alternative rooms:</p>
                  {alternatives.map(alt => (
                    <div key={alt.roomId} data-testid={`alternative-${alt.roomId}`}>
                      {alt.roomCode} ({alt.playerCount}/{alt.maxPlayers})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Try to join full room
      const joinButton = screen.getByTestId('join-button-room-1');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Room is full');
        expect(screen.getByTestId('alternatives')).toBeInTheDocument();
        expect(screen.getByTestId('alternative-alt-room-1')).toHaveTextContent('XYZ789 (2/8)');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('updates room list when rooms change', async () => {
      const TestComponent = () => {
        const [rooms, setRooms] = React.useState(mockRooms);

        React.useEffect(() => {
          // Simulate real-time update after 100ms
          const timer = setTimeout(() => {
            const updatedRooms = [
              ...mockRooms,
              {
                roomId: 'room-3',
                roomCode: 'GHI789',
                gameId: 'snake',
                playerCount: 1,
                maxPlayers: 8,
                state: 'LOBBY' as const,
                isPrivate: false,
                createdAt: Date.now()
              }
            ];
            setRooms(updatedRooms);
          }, 100);

          return () => clearTimeout(timer);
        }, []);

        return (
          <RoomProvider>
            <RoomsList
              rooms={rooms}
              gameInfo={mockGameInfo}
              onJoinRoom={jest.fn()}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Initially should show 2 rooms
      expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
      expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();

      // Wait for real-time update
      await waitFor(() => {
        expect(screen.getByTestId('room-card-room-3')).toBeInTheDocument();
      });
    });

    it('updates room state in real-time', async () => {
      const TestComponent = () => {
        const [rooms, setRooms] = React.useState(mockRooms);

        React.useEffect(() => {
          // Simulate room state change after 100ms
          const timer = setTimeout(() => {
            const updatedRooms = rooms.map(room => 
              room.roomId === 'room-1' 
                ? { ...room, state: 'PLAYING' as const, playerCount: 4 }
                : room
            );
            setRooms(updatedRooms);
          }, 100);

          return () => clearTimeout(timer);
        }, [rooms]);

        return (
          <RoomProvider>
            <RoomsList
              rooms={rooms}
              gameInfo={mockGameInfo}
              onJoinRoom={jest.fn()}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Initially room-1 should be joinable
      const initialJoinButton = screen.getByTestId('join-button-room-1');
      expect(initialJoinButton).not.toBeDisabled();

      // Wait for state update
      await waitFor(() => {
        // Room should now show updated player count
        expect(screen.getByText('4/8')).toBeInTheDocument();
      });
    });

    it('handles WebSocket connection status changes', async () => {
      const TestComponent = () => {
        const [isConnected, setIsConnected] = React.useState(true);

        React.useEffect(() => {
          // Simulate connection loss after 100ms
          const timer = setTimeout(() => {
            setIsConnected(false);
          }, 100);

          return () => clearTimeout(timer);
        }, []);

        return (
          <RoomProvider>
            <RoomsList
              rooms={mockRooms}
              gameInfo={mockGameInfo}
              statistics={mockStatistics}
              onJoinRoom={jest.fn()}
              isConnected={isConnected}
            />
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Initially should show connected status
      expect(screen.getByText('Live')).toBeInTheDocument();

      // Wait for connection status change
      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('retries failed operations', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      mockRoomService.joinRoom
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        const [retryCount, setRetryCount] = React.useState(0);

        const handleJoinRoom = async (roomId: string) => {
          try {
            await mockRoomService.joinRoom(roomId);
            setError(null);
          } catch (err) {
            setError((err as Error).message);
            throw err;
          }
        };

        const handleRetry = () => {
          setRetryCount(prev => prev + 1);
          setError(null);
          handleJoinRoom('room-1');
        };

        return (
          <RoomProvider>
            <div>
              <RoomsList
                rooms={mockRooms}
                gameInfo={mockGameInfo}
                onJoinRoom={handleJoinRoom}
              />
              
              {error && (
                <div data-testid="error-section">
                  <p data-testid="error-message">{error}</p>
                  <button onClick={handleRetry} data-testid="retry-button">
                    Retry ({retryCount})
                  </button>
                </div>
              )}
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // First attempt should fail
      const joinButton = screen.getByTestId('join-button-room-1');
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });

      // Retry should succeed
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockRoomService.joinRoom).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('error-section')).not.toBeInTheDocument();
      });
    });

    it('handles timeout scenarios', async () => {
      jest.useFakeTimers();
      
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock a timeout scenario
      mockRoomService.createRoom.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 15000);
        })
      );

      const TestComponent = () => {
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

        return (
          <RoomProvider>
            <div>
              <CreateRoomModal
                gameInfo={mockGameInfo}
                isOpen={true}
                onClose={jest.fn()}
                onCreateRoom={handleCreateRoom}
                isCreating={isCreating}
                error={error}
              />
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Start room creation
      const createButton = screen.getByText('Create Room');
      await user.click(createButton);

      // Should show creating state
      expect(screen.getByText('Creating Room...')).toBeInTheDocument();

      // Fast-forward to timeout
      act(() => {
        jest.advanceTimersByTime(16000);
      });

      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
        expect(screen.queryByText('Creating Room...')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Performance Under Load', () => {
    it('handles rapid room updates efficiently', async () => {
      const TestComponent = () => {
        const [rooms, setRooms] = React.useState(mockRooms);
        const [updateCount, setUpdateCount] = React.useState(0);

        React.useEffect(() => {
          // Simulate rapid updates
          const interval = setInterval(() => {
            setUpdateCount(prev => {
              const newCount = prev + 1;
              if (newCount <= 10) {
                setRooms(prevRooms => 
                  prevRooms.map(room => ({
                    ...room,
                    playerCount: Math.min(room.playerCount + 1, room.maxPlayers)
                  }))
                );
              }
              return newCount;
            });
          }, 50);

          return () => clearInterval(interval);
        }, []);

        return (
          <RoomProvider>
            <div>
              <div data-testid="update-count">Updates: {updateCount}</div>
              <RoomsList
                rooms={rooms}
                gameInfo={mockGameInfo}
                onJoinRoom={jest.fn()}
              />
            </div>
          </RoomProvider>
        );
      };

      render(<TestComponent />);

      // Wait for updates to complete
      await waitFor(() => {
        expect(screen.getByTestId('update-count')).toHaveTextContent('Updates: 10');
      }, { timeout: 2000 });

      // Should still render correctly
      expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
      expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
    });

    it('maintains performance with large room lists', () => {
      // Generate large room list
      const largeRoomList: ActiveRoom[] = Array.from({ length: 100 }, (_, i) => ({
        roomId: `room-${i}`,
        roomCode: `CODE${i.toString().padStart(2, '0')}`,
        gameId: 'snake',
        playerCount: Math.floor(Math.random() * 8) + 1,
        maxPlayers: 8,
        state: ['LOBBY', 'PLAYING', 'COUNTDOWN', 'RESULTS'][Math.floor(Math.random() * 4)] as any,
        isPrivate: Math.random() > 0.5,
        createdAt: Date.now() - Math.random() * 3600000
      }));

      const startTime = performance.now();

      render(
        <RoomProvider>
          <RoomsList
            rooms={largeRoomList}
            gameInfo={mockGameInfo}
            onJoinRoom={jest.fn()}
          />
        </RoomProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);

      // Should show all rooms
      expect(screen.getAllByTestId(/^room-card-/).length).toBe(100);
    });
  });
});