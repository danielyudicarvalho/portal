import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinByCodeModal from '../JoinByCodeModal';

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
  Input: React.forwardRef(({ value, onChange, onKeyPress, disabled, ...props }: any, ref: any) => (
    <input 
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      disabled={disabled}
      data-testid={props['data-testid'] || 'input'}
      {...props}
    />
  ))
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  HashtagIcon: () => <div data-testid="hashtag-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  ArrowRightIcon: () => <div data-testid="arrow-right-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="error-icon" />
}));

describe('JoinByCodeModal', () => {
  const mockOnJoinByCode = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Join Room by Code');
  });

  it('does not render when closed', () => {
    render(
      <JoinByCodeModal
        isOpen={false}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('initializes with empty room code', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    expect(input).toHaveValue('');
  });

  it('formats room code input correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    
    // Type lowercase letters and numbers
    await user.type(input, 'abc123');
    
    // Should be converted to uppercase
    expect(input).toHaveValue('ABC123');
  });

  it('removes invalid characters from input', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    
    // Type invalid characters
    await user.type(input, 'abc-123!@#');
    
    // Should only keep alphanumeric characters
    expect(input).toHaveValue('ABC123');
  });

  it('limits input to 6 characters', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    
    // Type more than 6 characters
    await user.type(input, 'abcdefghij');
    
    // Should be limited to 6 characters
    expect(input).toHaveValue('ABCDEF');
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC');
    
    expect(screen.getByText('3/6')).toBeInTheDocument();
  });

  it('displays formatted code for readability', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC123');
    
    // Should show formatted code with space
    expect(screen.getByText('ABC 123')).toBeInTheDocument();
  });

  it('validates empty room code', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    expect(screen.getByText('Please enter a room code')).toBeInTheDocument();
    expect(mockOnJoinByCode).not.toHaveBeenCalled();
  });

  it('validates room code length', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC12'); // Only 5 characters

    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    expect(screen.getByText('Room code must be exactly 6 characters')).toBeInTheDocument();
    expect(mockOnJoinByCode).not.toHaveBeenCalled();
  });

  it('validates room code format', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    
    // Manually set invalid value (bypassing input formatting)
    fireEvent.change(input, { target: { value: 'ABC-12' } });

    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    expect(screen.getByText('Room code can only contain letters and numbers')).toBeInTheDocument();
    expect(mockOnJoinByCode).not.toHaveBeenCalled();
  });

  it('submits valid room code', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC123');

    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    expect(mockOnJoinByCode).toHaveBeenCalledWith('ABC123');
  });

  it('disables join button when code is incomplete', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const joinButton = screen.getByText('Join Room');
    expect(joinButton).toBeDisabled();

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC12'); // Only 5 characters

    expect(joinButton).toBeDisabled();

    await user.type(input, '3'); // Complete to 6 characters

    expect(joinButton).not.toBeDisabled();
  });

  it('shows loading state when joining', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
        isJoining={true}
      />
    );

    expect(screen.getByText('Joining...')).toBeInTheDocument();
    
    const joinButton = screen.getByText('Joining...');
    expect(joinButton).toBeDisabled();
  });

  it('displays server error', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
        error="Invalid room code"
      />
    );

    expect(screen.getByText('Invalid room code')).toBeInTheDocument();
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents closing when joining', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
        isJoining={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();

    // Try to close via modal close button
    const modalCloseButton = screen.getByTestId('modal-close');
    await user.click(modalCloseButton);

    // onClose should not be called when joining
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('resets form when modal opens', () => {
    const { rerender } = render(
      <JoinByCodeModal
        isOpen={false}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    // Open modal and fill form
    rerender(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    fireEvent.change(input, { target: { value: 'ABC123' } });

    // Close and reopen modal
    rerender(
      <JoinByCodeModal
        isOpen={false}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    rerender(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    // Form should be reset
    const resetInput = screen.getByLabelText('Room Code');
    expect(resetInput).toHaveValue('');
  });

  it('clears validation error when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    // Trigger validation error
    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    expect(screen.getByText('Please enter a room code')).toBeInTheDocument();

    // Start typing
    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'A');

    // Error should be cleared
    expect(screen.queryByText('Please enter a room code')).not.toBeInTheDocument();
  });

  it('focuses input when modal opens', async () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    // Wait for focus to be set (after animation delay)
    await waitFor(() => {
      const input = screen.getByLabelText('Room Code');
      expect(input).toHaveFocus();
    }, { timeout: 200 });
  });

  it('prevents non-alphanumeric key presses', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    
    // Test invalid characters
    const invalidKeys = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '='];
    
    invalidKeys.forEach(key => {
      const event = new KeyboardEvent('keypress', { key });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      fireEvent.keyPress(input, event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    // Test valid characters
    const validKeys = ['A', 'a', '1', 'Backspace', 'Delete', 'Tab', 'Enter'];
    
    validKeys.forEach(key => {
      const event = new KeyboardEvent('keypress', { key });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      fireEvent.keyPress(input, event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup();
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC123');
    await user.keyboard('{Enter}');

    expect(mockOnJoinByCode).toHaveBeenCalledWith('ABC123');
  });

  it('handles form submission error gracefully', async () => {
    const user = userEvent.setup();
    const mockOnJoinByCodeError = jest.fn().mockRejectedValue(new Error('Join failed'));
    
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCodeError}
      />
    );

    const input = screen.getByLabelText('Room Code');
    await user.type(input, 'ABC123');

    const joinButton = screen.getByText('Join Room');
    await user.click(joinButton);

    await waitFor(() => {
      expect(mockOnJoinByCodeError).toHaveBeenCalled();
    });

    // Should handle error gracefully (error handling is done by parent component)
  });

  it('shows help text', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    expect(screen.getByText('Room codes are case-insensitive and expire when the room closes.')).toBeInTheDocument();
    expect(screen.getByText('Ask your friend to share their room code from the room lobby.')).toBeInTheDocument();
  });

  it('shows instructions', () => {
    render(
      <JoinByCodeModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinByCode={mockOnJoinByCode}
      />
    );

    expect(screen.getByText('Enter the 6-character room code shared by your friend to join their private room.')).toBeInTheDocument();
  });
});