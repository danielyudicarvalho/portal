import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TouchInputErrorRecovery } from '../TouchInputErrorRecovery';

describe('TouchInputErrorRecovery', () => {
  const mockGameElement = document.createElement('div');
  const mockOnRecoveryComplete = jest.fn();
  const mockOnFallbackMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.appendChild(mockGameElement);
  });

  afterEach(() => {
    document.body.removeChild(mockGameElement);
  });

  it('does not render recovery UI initially', () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    expect(screen.queryByText('Touch Input Issue Detected')).not.toBeInTheDocument();
  });

  it('shows recovery UI when touch input errors are detected', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Simulate touch input error
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });

    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Touch Input Issue Detected')).toBeInTheDocument();
    });
  });

  it('shows recovery UI after multiple responsiveness errors', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Simulate multiple touch events with short duration
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    });

    mockGameElement.dispatchEvent(touchStartEvent);

    // Immediately dispatch touchend to simulate unresponsive touch
    setTimeout(() => {
      const touchEndEvent = new TouchEvent('touchend', { touches: [] });
      mockGameElement.dispatchEvent(touchEndEvent);
    }, 10);

    // Repeat to trigger error threshold
    setTimeout(() => {
      mockGameElement.dispatchEvent(touchStartEvent);
      setTimeout(() => {
        const touchEndEvent = new TouchEvent('touchend', { touches: [] });
        mockGameElement.dispatchEvent(touchEndEvent);
      }, 10);
    }, 100);

    await waitFor(() => {
      expect(screen.getByText('Touch Input Issue Detected')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows recovery UI after orientation change breaks layout', async () => {
    // Mock getBoundingClientRect to return zero dimensions
    mockGameElement.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    });

    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Simulate orientation change
    const orientationEvent = new Event('orientationchange');
    window.dispatchEvent(orientationEvent);

    await waitFor(() => {
      expect(screen.getByText('Touch Input Issue Detected')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles fix touch controls button click', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error to show UI
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Fix Touch Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fix Touch Controls'));

    expect(screen.getByText('Preparing recovery...')).toBeInTheDocument();
  });

  it('shows recovery progress steps', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error and start recovery
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Fix Touch Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fix Touch Controls'));

    // Check for different recovery steps
    await waitFor(() => {
      expect(screen.getByText('Clearing touch event listeners...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Calibrating touch input...')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles simplified controls button click', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error to show UI
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Use Simplified Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Use Simplified Controls'));

    expect(mockOnFallbackMode).toHaveBeenCalled();
    expect(mockGameElement.classList.contains('touch-fallback-mode')).toBe(true);
  });

  it('handles dismiss button click', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error to show UI
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));

    expect(screen.queryByText('Touch Input Issue Detected')).not.toBeInTheDocument();
  });

  it('shows calibration instructions during calibration step', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error and start recovery
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Fix Touch Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fix Touch Controls'));

    await waitFor(() => {
      expect(screen.getByText('Calibrating touch input...')).toBeInTheDocument();
    }, { timeout: 1000 });

    await waitFor(() => {
      expect(screen.getByText('Tap 4 more points to calibrate')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('completes recovery and calls onRecoveryComplete', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error and start recovery
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Fix Touch Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fix Touch Controls'));

    // Wait for recovery to complete
    await waitFor(() => {
      expect(mockOnRecoveryComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('shows error count when multiple errors occur', async () => {
    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger multiple errors
    const errorEvent1 = new CustomEvent('touchinputerror', {
      detail: {
        type: 'responsiveness',
        message: 'Touch unresponsive',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });

    const errorEvent2 = new CustomEvent('touchinputerror', {
      detail: {
        type: 'gesture',
        message: 'Gesture not recognized',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });

    mockGameElement.dispatchEvent(errorEvent1);
    mockGameElement.dispatchEvent(errorEvent2);

    await waitFor(() => {
      expect(screen.getByText('2 touch input issues detected')).toBeInTheDocument();
    });
  });

  it('dispatches custom events during recovery', async () => {
    const eventListener = jest.fn();
    mockGameElement.addEventListener('reinitialize-touch-controls', eventListener);
    mockGameElement.addEventListener('enable-fallback-controls', eventListener);

    render(
      <TouchInputErrorRecovery
        gameElement={mockGameElement}
        gameId="test-game"
        onRecoveryComplete={mockOnRecoveryComplete}
        onFallbackMode={mockOnFallbackMode}
      />
    );

    // Trigger error and start recovery
    const errorEvent = new CustomEvent('touchinputerror', {
      detail: {
        type: 'calibration',
        message: 'Touch calibration failed',
        timestamp: Date.now(),
        gameId: 'test-game',
      },
    });
    mockGameElement.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Fix Touch Controls')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fix Touch Controls'));

    // Wait for recovery to complete and check if events were dispatched
    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});