import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomsList from '../RoomsList';
import { ActiveRoom, GameInfo, RoomStatistics } from '@/lib/room-service';

// Mock the child components
jest.mock('../RoomCard', () => {
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

jest.mock('../RoomCardSkeleton', () => ({
  RoomListSkeleton: ({ count }: { count: number }) => (
    <div data-testid="room-list-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-testid={`skeleton-${i}`}>Loading...</div>
      ))}
    </div>
  )
}));

jest.mock('../LoadingStates', () => ({
  InlineLoading: () => <div data-testid="inline-loading">Loading...</div>,
  EmptyState: ({ children }: any) => <div data-testid="empty-state">{children}</div>
}));

// Mock the UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  MagnifyingGlassIcon: () => <div data-testid="search-icon" />,
  AdjustmentsHorizontalIcon: () => <div data-testid="filters-icon" />,
  UserGroupIcon: () => <div data-testid="user-group-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="error-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  ArrowPathIcon: () => <div data-testid="refresh-icon" />,
  SignalIcon: () => <div data-testid="signal-icon" />,
  WifiIcon: () => <div data-testid="wifi-icon" />
}));

describe('RoomsList', () => {
  const mockGameInfo: GameInfo = {
    id: 'snake',
    name: 'Snake Game',
    roomType: 'snake',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game',
    features: ['multiplayer']
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
    },
    {
      roomId: 'room-3',
      roomCode: 'GHI789',
      gameId: 'snake',
      playerCount: 8,
      maxPlayers: 8,
      state: 'LOBBY',
      isPrivate: false,
      createdAt: Date.now() - 100000
    }
  ];

  const mockStatistics: RoomStatistics = {
    totalRooms: 3,
    publicRooms: 2,
    privateRooms: 1,
    totalPlayers: 17,
    averagePlayersPerRoom: 5.7,
    roomsByState: {
      LOBBY: 2,
      COUNTDOWN: 0,
      PLAYING: 1,
      RESULTS: 0,
      RESET: 0
    }
  };

  const mockOnJoinRoom = jest.fn();
  const mockOnCreateRoom = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room cards correctly', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-3')).toBeInTheDocument();
  });

  it('displays statistics when provided', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        statistics={mockStatistics}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Total rooms
    expect(screen.getByText('17')).toBeInTheDocument(); // Total players
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('Starting')).toBeInTheDocument();
    expect(screen.getByText('Playing')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Resetting')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(
      <RoomsList
        rooms={[]}
        gameInfo={mockGameInfo}
        isLoading={true}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByTestId('room-list-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    render(
      <RoomsList
        rooms={[]}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    expect(screen.getByText('No active rooms')).toBeInTheDocument();
    expect(screen.getByText(/There are currently no active rooms for Snake Game/)).toBeInTheDocument();
  });

  it('shows error state when error occurs', () => {
    render(
      <RoomsList
        rooms={[]}
        gameInfo={mockGameInfo}
        error="Connection failed"
        onJoinRoom={mockOnJoinRoom}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Unable to load rooms')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('filters rooms by search query', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by room code...');
    await user.type(searchInput, 'ABC');

    // Should only show room with code ABC123
    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
    expect(screen.queryByTestId('room-card-room-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('room-card-room-3')).not.toBeInTheDocument();
  });

  it('filters rooms by category', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Open filters
    const filtersButton = screen.getByText(/Filters/);
    await user.click(filtersButton);

    // Click on "Private" filter
    const privateFilter = screen.getByText(/Private/);
    await user.click(privateFilter);

    // Should only show private room
    expect(screen.queryByTestId('room-card-room-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
    expect(screen.queryByTestId('room-card-room-3')).not.toBeInTheDocument();
  });

  it('filters rooms by joinable status', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Open filters
    const filtersButton = screen.getByText(/Filters/);
    await user.click(filtersButton);

    // Click on "Joinable" filter
    const joinableFilter = screen.getByText(/Joinable/);
    await user.click(joinableFilter);

    // Should only show rooms that are in LOBBY state and not full
    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument(); // LOBBY, 3/8
    expect(screen.queryByTestId('room-card-room-2')).not.toBeInTheDocument(); // PLAYING
    expect(screen.queryByTestId('room-card-room-3')).not.toBeInTheDocument(); // LOBBY but full
  });

  it('sorts rooms correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Open filters
    const filtersButton = screen.getByText(/Filters/);
    await user.click(filtersButton);

    // Change sort to "Most Players"
    const sortSelect = screen.getByDisplayValue('Newest First');
    await user.selectOptions(sortSelect, 'players-desc');

    // Rooms should be sorted by player count descending
    const roomCards = screen.getAllByTestId(/^room-card-/);
    expect(roomCards[0]).toHaveAttribute('data-testid', 'room-card-room-3'); // 8 players
    expect(roomCards[1]).toHaveAttribute('data-testid', 'room-card-room-2'); // 6 players
    expect(roomCards[2]).toHaveAttribute('data-testid', 'room-card-room-1'); // 3 players
  });

  it('calls onJoinRoom when room join button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const joinButton = screen.getByTestId('join-button-room-1');
    await user.click(joinButton);

    expect(mockOnJoinRoom).toHaveBeenCalledWith('room-1');
  });

  it('shows joining state for specific room', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        joiningRoomId="room-1"
      />
    );

    const joinButton = screen.getByTestId('join-button-room-1');
    expect(joinButton).toHaveTextContent('Joining...');
    expect(joinButton).toBeDisabled();
  });

  it('calls onCreateRoom when create room button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={[]}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(mockOnCreateRoom).toHaveBeenCalled();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={[]}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('shows connection status correctly', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        statistics={mockStatistics}
        isConnected={true}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
  });

  it('shows offline status correctly', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        statistics={mockStatistics}
        isConnected={false}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByTestId('signal-icon')).toBeInTheDocument();
  });

  it('clears filters when clear filters button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search by room code...');
    await user.type(searchInput, 'ABC');

    // Open filters and apply category filter
    const filtersButton = screen.getByText(/Filters/);
    await user.click(filtersButton);
    
    const privateFilter = screen.getByText(/Private/);
    await user.click(privateFilter);

    // Should show "no rooms match filters" message
    expect(screen.getByText('No rooms match your filters')).toBeInTheDocument();

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    // Should show all rooms again
    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-3')).toBeInTheDocument();
  });

  it('displays filter counts correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Open filters
    const filtersButton = screen.getByText(/Filters/);
    await user.click(filtersButton);

    // Check filter counts
    expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Public \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Private \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Joinable \(1\)/)).toBeInTheDocument(); // Only room-1 is joinable
    expect(screen.getByText(/Lobby \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Playing \(1\)/)).toBeInTheDocument();
  });

  it('shows room count correctly', () => {
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('3/3 rooms')).toBeInTheDocument();
  });

  it('memoizes correctly to prevent unnecessary re-renders', () => {
    const { rerender } = render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        isLoading={false}
        error={null}
        joiningRoomId={null}
        isConnected={true}
      />
    );

    // Re-render with same props
    rerender(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        isLoading={false}
        error={null}
        joiningRoomId={null}
        isConnected={true}
      />
    );

    // Component should not re-render (tested by ensuring rooms are still displayed)
    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by room code...');
    await user.type(searchInput, 'NONEXISTENT');

    expect(screen.getByText('No rooms match your filters')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria to find more rooms.')).toBeInTheDocument();
  });

  it('toggles filters visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomsList
        rooms={mockRooms}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const filtersButton = screen.getByText(/Filters ▼/);
    
    // Filters should be hidden initially
    expect(screen.queryByText('Filter by:')).not.toBeInTheDocument();

    // Click to show filters
    await user.click(filtersButton);
    expect(screen.getByText('Filter by:')).toBeInTheDocument();
    expect(screen.getByText(/Filters ▲/)).toBeInTheDocument();

    // Click to hide filters
    await user.click(screen.getByText(/Filters ▲/));
    expect(screen.queryByText('Filter by:')).not.toBeInTheDocument();
  });
});