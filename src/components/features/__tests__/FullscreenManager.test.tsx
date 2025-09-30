import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullscreenManager } from '../FullscreenManager';

// Mock fullscreen API
const mockRequestFullscreen = jest.fn();
const mockExitFullscreen = jest.fn();

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: mockRequestFullscreen,
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: mockExitFullscreen,
});

// Mock addEventListener and removeEventListener
const originalAddEventListener = document.addEventListener;
const originalRemoveEventListener = document.removeEventListener;

describe('FullscreenManager', () => {
  const defaultProps = {
    gameId: 'test-game',
    gameTitle: 'Test Game',
    children: <div data-testid="game-content">Game Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestFullscreen.mockResolvedValue(undefined);
    mockExitFullscreen.mockResolvedValue(undefined);
    
    // Reset fullscreen state
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
  });

  afterEach(() => {
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  });

  it('renders children content', () => {
    render(<FullscreenManager {...defaultProps} />);
    
    expect(screen.getByTestId('game-content')).toBeInTheDocument();
  });

  it('shows fullscreen button by default', () => {
    render(<FullscreenManager {...defaultProps} />);
    
    expect(screen.getByTitle(/Enter fullscreen/)).toBeInTheDocument();
  });

  it('hides fullscreen button when showFullscreenButton is false', () => {
    render(<FullscreenManager {...defaultProps} showFullscreenButton={false} />);
    
    expect(screen.queryByTitle(/Enter fullscreen/)).not.toBeInTheDocument();
  });

  it('toggles fullscreen on button click', async () => {
    render(<FullscreenManager {...defaultProps} />);
    
    const fullscreenButton = screen.getByTitle(/Enter fullscreen/);
    fireEvent.click(fullscreenButton);
    
    await waitFor(() => {
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });
  });

  it('calls onFullscreenChange when fullscreen state changes', async () => {
    const onFullscreenChange = jest.fn();
    
    render(
      <FullscreenManager 
        {...defaultProps} 
        onFullscreenChange={onFullscreenChange}
      />
    );
    
    // Simulate fullscreen change event
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: document.body,
    });
    
    fireEvent(document, new Event('fullscreenchange'));
    
    await waitFor(() => {
      expect(onFullscreenChange).toHaveBeenCalledWith(true);
    });
  });

  it('handles fullscreen errors gracefully', async () => {
    mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen failed'));
    
    render(<FullscreenManager {...defaultProps} />);
    
    const fullscreenButton = screen.getByTitle(/Enter fullscreen/);
    fireEvent.click(fullscreenButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to enter fullscreen mode')).toBeInTheDocument();
    });
  });

  it('dismisses error message when clicked', async () => {
    mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen failed'));
    
    render(<FullscreenManager {...defaultProps} />);
    
    const fullscreenButton = screen.getByTitle(/Enter fullscreen/);
    fireEvent.click(fullscreenButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to enter fullscreen mode')).toBeInTheDocument();
    });
    
    const dismissButton = screen.getByText('×');
    fireEvent.click(dismissButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Failed to enter fullscreen mode')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard shortcuts', async () => {
    render(<FullscreenManager {...defaultProps} />);
    
    // Test F11 key
    fireEvent.keyDown(document, { key: 'F11' });
    
    await waitFor(() => {
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });
  });

  it('handles Ctrl+F keyboard shortcut', async () => {
    render(<FullscreenManager {...defaultProps} />);
    
    // Test Ctrl+F key
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });
  });

  it('exits fullscreen on Escape key when in fullscreen', async () => {
    render(<FullscreenManager {...defaultProps} />);
    
    // Simulate being in fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: document.body,
    });
    
    fireEvent(document, new Event('fullscreenchange'));
    
    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockExitFullscreen).toHaveBeenCalled();
    });
  });

  it('shows fullscreen instructions when in fullscreen', async () => {
    render(<FullscreenManager {...defaultProps} />);
    
    // Simulate entering fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: document.body,
    });
    
    fireEvent(document, new Event('fullscreenchange'));
    
    await waitFor(() => {
      expect(screen.getByText(/Press.*Esc.*to exit fullscreen/)).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<FullscreenManager {...defaultProps} className="custom-class" />);
    
    const manager = container.querySelector('.fullscreen-manager');
    expect(manager).toHaveClass('custom-class');
    expect(manager).toHaveAttribute('data-game-id', 'test-game');
  });

  it('applies fullscreen-active class when in fullscreen', async () => {
    const { container } = render(<FullscreenManager {...defaultProps} />);
    
    // Simulate entering fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: document.body,
    });
    
    fireEvent(document, new Event('fullscreenchange'));
    
    await waitFor(() => {
      const manager = container.querySelector('.fullscreen-manager');
      expect(manager).toHaveClass('fullscreen-active');
    });
  });

  it('handles webkit fullscreen API', async () => {
    // Mock webkit API
    const mockWebkitRequestFullscreen = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', {
      writable: true,
      value: mockWebkitRequestFullscreen,
    });
    
    // Remove standard API to force webkit usage
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      writable: true,
      value: undefined,
    });
    
    render(<FullscreenManager {...defaultProps} />);
    
    const fullscreenButton = screen.getByTitle(/Enter fullscreen/);
    fireEvent.click(fullscreenButton);
    
    await waitFor(() => {
      expect(mockWebkitRequestFullscreen).toHaveBeenCalled();
    });
  });

  it('handles fullscreen API not supported', () => {
    // Remove all fullscreen APIs
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      writable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', {
      writable: true,
      value: undefined,
    });
    
    render(<FullscreenManager {...defaultProps} />);
    
    // Button should not be shown when API is not supported
    expect(screen.queryByTitle(/Enter fullscreen/)).not.toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const mockRemoveEventListener = jest.fn();
    document.removeEventListener = mockRemoveEventListener;
    
    const { unmount } = render(<FullscreenManager {...defaultProps} />);
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});