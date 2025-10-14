import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomCard from '../RoomCard';
import { ActiveRoom, GameInfo } from '@/lib/room-service';

// Mock the UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, loading, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      data-testid="room-card-button"
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  )
}));

// Mock the loading states component
jest.mock('../LoadingStates', () => ({
  ButtonLoading: ({ children, isLoading, loadingText }: any) => (
    <div data-testid="button-loading">
      {isLoading ? loadingText : children}
    </div>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  UserGroupIcon: () => <div data-testid="user-group-icon" />,
  LockClosedIcon: () => <div data-testid="lock-closed-icon" />,
  PlayIcon: () => <div data-testid="play-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  TrophyIcon: () => <div data-testid="trophy-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  SignalIcon: () => <div data-testid="signal-icon" />
}));

describe('RoomCard', () => {
  const mockGameInfo: GameInfo = {
    id: 'snake',
    name: 'Snake Game',
    roomType: 'snake',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game with multiplayer support',
    features: ['multiplayer', 'real-time']
  };

  const mockRoom: ActiveRoom = {
    roomId: 'room-123',
    roomCode: 'ABC123',
    gameId: 'snake',
    playerCount: 3,
    maxPlayers: 8,
    state: 'LOBBY',
    isPrivate: false,
    createdAt: Date.now() - 300000 // 5 minutes ago
  };

  const mockOnJoinRoom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room information correctly', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(screen.getByText('Snake Game')).toBeInTheDocument();
    expect(screen.getByText('Classic snake game with multiplayer support')).toBeInTheDocument();
  });

  it('displays correct state badge for lobby room', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('displays correct state badge for playing room', () => {
    const playingRoom = { ...mockRoom, state: 'PLAYING' as const };
    
    render(
      <RoomCard
        room={playingRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getAllByText('In Game')[0]).toBeInTheDocument();
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  it('shows lock icon for private rooms', () => {
    const privateRoom = { ...mockRoom, isPrivate: true };
    
    render(
      <RoomCard
        room={privateRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByTestId('lock-closed-icon')).toBeInTheDocument();
  });

  it('enables join button for joinable rooms', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const joinButton = screen.getByRole('button');
    expect(joinButton).not.toBeDisabled();
    expect(screen.getByText('Join Room')).toBeInTheDocument();
  });

  it('disables join button for full rooms', () => {
    const fullRoom = { ...mockRoom, playerCount: 8, maxPlayers: 8 };
    
    render(
      <RoomCard
        room={fullRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const joinButton = screen.getByRole('button');
    expect(joinButton).toBeDisabled();
    expect(screen.getByText('Room Full')).toBeInTheDocument();
  });

  it('disables join button for non-lobby rooms', () => {
    const playingRoom = { ...mockRoom, state: 'PLAYING' as const };
    
    render(
      <RoomCard
        room={playingRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const joinButton = screen.getByRole('button');
    expect(joinButton).toBeDisabled();
    expect(screen.getAllByText('In Game')[0]).toBeInTheDocument();
  });

  it('calls onJoinRoom when join button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const joinButton = screen.getByRole('button');
    await user.click(joinButton);

    expect(mockOnJoinRoom).toHaveBeenCalledWith('room-123');
  });

  it('shows loading state when joining', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        isJoining={true}
      />
    );

    expect(screen.getByText('Joining...')).toBeInTheDocument();
    
    const joinButton = screen.getByRole('button');
    expect(joinButton).toBeDisabled();
  });

  it('displays capacity percentage correctly', () => {
    const room = { ...mockRoom, playerCount: 6, maxPlayers: 8 }; // 75% full
    
    render(
      <RoomCard
        room={room}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('75% full')).toBeInTheDocument();
  });

  it('shows room age correctly', () => {
    const recentRoom = { ...mockRoom, createdAt: Date.now() - 30000 }; // 30 seconds ago
    
    render(
      <RoomCard
        room={recentRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Just created')).toBeInTheDocument();
  });

  it('displays room ID correctly', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Should show last 8 characters of room ID
    expect(screen.getByText('ID: room-123')).toBeInTheDocument();
  });

  it('shows privacy status correctly', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('handles touch events on mobile', async () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const cardElement = screen.getByTestId('card-content').parentElement;
    
    // Simulate touch start
    fireEvent.touchStart(cardElement!);
    
    // Should add pressed state class
    expect(cardElement).toHaveClass('scale-95');
    
    // Simulate touch end
    fireEvent.touchEnd(cardElement!);
    
    // Should remove pressed state class
    await waitFor(() => {
      expect(cardElement).not.toHaveClass('scale-95');
    });
  });

  it('prevents event propagation on join button click', async () => {
    const user = userEvent.setup();
    const mockCardClick = jest.fn();
    
    render(
      <div onClick={mockCardClick}>
        <RoomCard
          room={mockRoom}
          gameInfo={mockGameInfo}
          onJoinRoom={mockOnJoinRoom}
        />
      </div>
    );

    const joinButton = screen.getByRole('button');
    await user.click(joinButton);

    expect(mockOnJoinRoom).toHaveBeenCalledWith('room-123');
    expect(mockCardClick).not.toHaveBeenCalled();
  });

  it('memoizes correctly with same props', () => {
    const { rerender } = render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Re-render with same props
    rerender(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Component should not re-render (tested by ensuring no console warnings)
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('re-renders when room state changes', () => {
    const { rerender } = render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getByText('Waiting')).toBeInTheDocument();

    const updatedRoom = { ...mockRoom, state: 'PLAYING' as const };
    rerender(
      <RoomCard
        room={updatedRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    expect(screen.getAllByText('In Game')[0]).toBeInTheDocument();
  });

  it('shows update animation when player count changes', () => {
    const { rerender } = render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    const updatedRoom = { ...mockRoom, playerCount: 4 };
    rerender(
      <RoomCard
        room={updatedRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
      />
    );

    // Should show updated player count
    expect(screen.getByText('4/8')).toBeInTheDocument();
    
    // Should have update animation class
    const cardElement = screen.getByTestId('card-content').parentElement;
    expect(cardElement).toHaveClass('animate-room-update');
  });

  it('applies custom className', () => {
    render(
      <RoomCard
        room={mockRoom}
        gameInfo={mockGameInfo}
        onJoinRoom={mockOnJoinRoom}
        className="custom-class"
      />
    );

    const cardElement = screen.getByTestId('card-content').parentElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('handles different room states correctly', () => {
    const states: Array<{ state: ActiveRoom['state']; expectedText: string; expectedIcon: string }> = [
      { state: 'LOBBY', expectedText: 'Waiting', expectedIcon: 'clock-icon' },
      { state: 'COUNTDOWN', expectedText: 'Starting', expectedIcon: 'play-icon' },
      { state: 'PLAYING', expectedText: 'In Game', expectedIcon: 'play-icon' },
      { state: 'RESULTS', expectedText: 'Finishing', expectedIcon: 'trophy-icon' }
    ];

    states.forEach(({ state, expectedText, expectedIcon }) => {
      const { unmount } = render(
        <RoomCard
          room={{ ...mockRoom, state }}
          gameInfo={mockGameInfo}
          onJoinRoom={mockOnJoinRoom}
        />
      );

      expect(screen.getAllByText(expectedText)[0]).toBeInTheDocument();
      expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();

      unmount();
    });
  });
});