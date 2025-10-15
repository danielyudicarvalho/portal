import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateRoomModal from '../CreateRoomModal';
import { GameInfo, RoomCreationOptions } from '@/lib/room-service';

// Mock the UI components
jest.mock('@/components/ui', () => ({
  Modal: ({ children, isOpen, onClose, title }: any) => 
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, loading, type, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      type={type}
      data-variant={variant}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: ({ label, value, onChange, error, helperText, disabled, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input 
        value={value}
        onChange={onChange}
        disabled={disabled}
        data-testid={props['data-testid'] || 'input'}
        {...props}
      />
      {error && <span data-testid="input-error">{error}</span>}
      {helperText && <span data-testid="input-helper">{helperText}</span>}
    </div>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  PlusIcon: () => <div data-testid="plus-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  UserGroupIcon: () => <div data-testid="user-group-icon" />,
  LockClosedIcon: () => <div data-testid="lock-closed-icon" />,
  LockOpenIcon: () => <div data-testid="lock-open-icon" />,
  CogIcon: () => <div data-testid="cog-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="error-icon" />,
  InformationCircleIcon: () => <div data-testid="info-icon" />
}));

describe('CreateRoomModal', () => {
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
      },
      boardSize: {
        type: 'number',
        label: 'Board Size',
        default: 20,
        min: 10,
        max: 50
      },
      powerUps: {
        type: 'boolean',
        label: 'Enable Power-ups',
        default: true
      },
      customRule: {
        type: 'string',
        label: 'Custom Rule',
        default: ''
      }
    }
  };

  const mockOnCreateRoom = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create Snake Game Room');
  });

  it('does not render when closed', () => {
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={false}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('initializes form with default values', () => {
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Room name should be empty
    const roomNameInput = screen.getByPlaceholderText('Snake Game Room');
    expect(roomNameInput).toHaveValue('');

    // Should default to public
    const publicButton = screen.getByText('Public');
    expect(publicButton).toHaveClass('border-gaming-accent');

    // Max players should be game max
    const maxPlayersSlider = screen.getByDisplayValue('8');
    expect(maxPlayersSlider).toBeInTheDocument();

    // Game settings should have defaults
    expect(screen.getByDisplayValue('normal')).toBeInTheDocument(); // Game speed
    expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // Board size
    expect(screen.getByRole('checkbox')).toBeChecked(); // Power-ups enabled
  });

  it('allows changing room privacy', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const privateButton = screen.getByText('Private');
    await user.click(privateButton);

    expect(privateButton).toHaveClass('border-gaming-accent');
    expect(screen.getByText('Invite only')).toBeInTheDocument();
  });

  it('allows changing max players', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const slider = screen.getByDisplayValue('8');
    await user.clear(slider);
    await user.type(slider, '6');

    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
  });

  it('allows changing game settings', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Change game speed
    const speedSelect = screen.getByDisplayValue('normal');
    await user.selectOptions(speedSelect, 'fast');
    expect(screen.getByDisplayValue('fast')).toBeInTheDocument();

    // Change board size
    const boardSizeInput = screen.getByDisplayValue('20');
    await user.clear(boardSizeInput);
    await user.type(boardSizeInput, '30');
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();

    // Toggle power-ups
    const powerUpsCheckbox = screen.getByRole('checkbox');
    await user.click(powerUpsCheckbox);
    expect(powerUpsCheckbox).not.toBeChecked();

    // Change custom rule
    const customRuleInputs = screen.getAllByTestId('input');
    const customRuleInput = customRuleInputs.find(input => input.getAttribute('type') === 'text' && input.getAttribute('value') === '');
    if (customRuleInput) {
      await user.type(customRuleInput, 'No walls');
      expect(customRuleInput).toHaveValue('No walls');
    }
  });

  it('validates room name length', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const roomNameInput = screen.getByPlaceholderText('Snake Game Room');
    
    // Test too short name
    await user.type(roomNameInput, 'AB');
    
    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(screen.getByText('Room name must be at least 3 characters')).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();
  });

  it('validates max players within bounds', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const slider = screen.getByDisplayValue('8');
    
    // Try to set below minimum
    fireEvent.change(slider, { target: { value: '1' } });
    
    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(screen.getByText('Minimum 2 players required')).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();
  });

  it('validates game settings', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Set board size below minimum
    const boardSizeInput = screen.getByDisplayValue('20');
    await user.clear(boardSizeInput);
    await user.type(boardSizeInput, '5');

    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(screen.getByText('Board Size must be at least 10')).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Fill form
    const roomNameInput = screen.getByPlaceholderText('Snake Game Room');
    await user.type(roomNameInput, 'My Snake Room');

    const privateButton = screen.getByText('Private');
    await user.click(privateButton);

    const slider = screen.getByDisplayValue('8');
    fireEvent.change(slider, { target: { value: '6' } });

    const speedSelect = screen.getByDisplayValue('normal');
    await user.selectOptions(speedSelect, 'fast');

    // Submit form
    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(mockOnCreateRoom).toHaveBeenCalledWith({
      isPrivate: true,
      maxPlayers: 6,
      gameSettings: {
        gameSpeed: 'fast',
        boardSize: 20,
        powerUps: true,
        customRule: ''
      },
      roomName: 'My Snake Room'
    });
  });

  it('shows loading state when creating', () => {
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
        isCreating={true}
      />
    );

    expect(screen.getByText('Creating Room...')).toBeInTheDocument();
    
    const createButton = screen.getByText('Creating Room...');
    expect(createButton).toBeDisabled();
  });

  it('displays server error', () => {
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
        error="Server connection failed"
      />
    );

    expect(screen.getByText('Server connection failed')).toBeInTheDocument();
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents closing when creating', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
        isCreating={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();

    // Try to close via modal close button
    const modalCloseButton = screen.getByTestId('modal-close');
    await user.click(modalCloseButton);

    // onClose should not be called when creating
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('resets form when modal opens', () => {
    const { rerender } = render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={false}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Open modal and fill form
    rerender(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const roomNameInput = screen.getByLabelText('Room Name (Optional)');
    fireEvent.change(roomNameInput, { target: { value: 'Test Room' } });

    // Close and reopen modal
    rerender(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={false}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    rerender(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Form should be reset
    const resetRoomNameInput = screen.getByPlaceholderText('Snake Game Room');
    expect(resetRoomNameInput).toHaveValue('');
  });

  it('shows appropriate info text for privacy settings', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Should show public room info by default
    expect(screen.getByText(/Public rooms are visible to all players/)).toBeInTheDocument();

    // Switch to private
    const privateButton = screen.getByText('Private');
    await user.click(privateButton);

    // Should show private room info
    expect(screen.getByText(/Private rooms require a room code to join/)).toBeInTheDocument();
  });

  it('handles game without settings', () => {
    const gameWithoutSettings: GameInfo = {
      ...mockGameInfo,
      settings: undefined
    };

    render(
      <CreateRoomModal
        gameInfo={gameWithoutSettings}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    // Should not show game settings section
    expect(screen.queryByText('Game Settings')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cog-icon')).not.toBeInTheDocument();
  });

  it('clears validation errors when user corrects input', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoom}
      />
    );

    const roomNameInput = screen.getByPlaceholderText('Snake Game Room');
    
    // Enter invalid name
    await user.type(roomNameInput, 'AB');
    
    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    expect(screen.getByText('Room name must be at least 3 characters')).toBeInTheDocument();

    // Correct the name
    await user.clear(roomNameInput);
    await user.type(roomNameInput, 'Valid Name');

    // Error should be cleared
    expect(screen.queryByText('Room name must be at least 3 characters')).not.toBeInTheDocument();
  });

  it('handles form submission error gracefully', async () => {
    const user = userEvent.setup();
    const mockOnCreateRoomError = jest.fn().mockRejectedValue(new Error('Creation failed'));
    
    render(
      <CreateRoomModal
        gameInfo={mockGameInfo}
        isOpen={true}
        onClose={mockOnClose}
        onCreateRoom={mockOnCreateRoomError}
      />
    );

    const createButton = screen.getByText('Create Room');
    await user.click(createButton);

    await waitFor(() => {
      expect(mockOnCreateRoomError).toHaveBeenCalled();
    });

    // Should handle error gracefully (error handling is done by parent component)
  });
});