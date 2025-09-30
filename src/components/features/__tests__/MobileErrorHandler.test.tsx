import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileErrorHandler } from '../MobileErrorHandler';
import { usePWAOfflineState } from '@/hooks/usePWAOfflineState';

// Mock hooks
jest.mock('@/hooks/usePWAOfflineState');
jest.mock('@/hooks/useOfflineGames');

const mockUsePWAOfflineState = usePWAOfflineState as jest.MockedFunction<typeof usePWAOfflineState>;

// Mock child components
jest.mock('../MobileErrorBoundary', () => ({
  MobileErrorBoundary: ({ children, onError, fallback }: any) => {
    // Simulate error boundary behavior
    const [hasError, setHasError] = React.useState(false);
    
    React.useEffect(() => {
      const handleError = () => {
        setHasError(true);
        onError?.(new Error('Test error'), { componentStack: 'test' });
      };
      
      // Listen for test error trigger
      window.addEventListener('trigger-error', handleError);
      return () => window.removeEventListener('trigger-error', handleError);
    }, [onError]);
    
    if (hasError && fallback) {
      return fallback;
    }
    
    if (hasError) {
      return <div>Error Boundary Fallback</div>;
    }
    
    return children;
  },
}));

jest.mock('../OfflineErrorHandler', () => ({
  OfflineErrorHandler: ({ error, onRetry, onOfflineGameSelect }: any) => (
    <div>
      <div>Offline Error Handler</div>
      <div>{error.message}</div>
      <button onClick={onRetry}>Retry</button>
      <button onClick={() => onOfflineGameSelect('test-game')}>Select Game</button>
    </div>
  ),
}));

jest.mock('../TouchInputErrorRecovery', () => ({
  TouchInputErrorRecovery: ({ onRecoveryComplete, onFallbackMode }: any) => (
    <div>
      <div>Touch Input Error Recovery</div>
      <button onClick={onRecoveryComplete}>Recovery Complete</button>
      <button onClick={onFallbackMode}>Fallback Mode</button>
    </div>
  ),
}));

// Component that can trigger errors
const TestComponent = ({ shouldError }: { shouldError: boolean }) => {
  React.useEffect(() => {
    if (shouldError) {
      window.dispatchEvent(new Event('trigger-error'));
    }
  }, [shouldError]);
  
  return <div>Test Content</div>;
};

describe('MobileErrorHandler', () => {
  const mockGameElement = document.createElement('div');
  const mockOnError = jest.fn();
  const mockOnRecovery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: true,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children normally when no errors occur', () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Touch Input Error Recovery')).toBeInTheDocument();
  });

  it('handles boundary errors and shows offline error handler', async () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={true} />
      </MobileErrorHandler>
    );

    await waitFor(() => {
      expect(screen.getByText('Offline Error Handler')).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      'boundary'
    );
  });

  it('handles offline fetch errors', async () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    // Trigger a fetch that will fail
    try {
      await fetch('/api/test');
    } catch {
      // Expected to fail
    }

    await waitFor(() => {
      expect(screen.getByText('Offline Error Handler')).toBeInTheDocument();
    });
  });

  it('handles retry from offline error handler', async () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={true} />
      </MobileErrorHandler>
    );

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    expect(mockOnRecovery).toHaveBeenCalled();
  });

  it('handles offline game selection', async () => {
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={true} />
      </MobileErrorHandler>
    );

    await waitFor(() => {
      expect(screen.getByText('Select Game')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select Game'));

    expect(window.location.href).toBe('/games/test-game');
  });

  it('handles touch input recovery completion', () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    fireEvent.click(screen.getByText('Recovery Complete'));

    expect(mockOnRecovery).toHaveBeenCalled();
  });

  it('handles touch input fallback mode', () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    fireEvent.click(screen.getByText('Fallback Mode'));

    expect(mockOnRecovery).toHaveBeenCalled();
  });

  it('intercepts fetch calls and handles offline errors', async () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    const originalFetch = global.fetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    global.fetch = mockFetch;

    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    // Trigger a fetch that will fail when offline
    try {
      await fetch('/api/test');
    } catch {
      // Expected to fail and show offline error handler
    }

    await waitFor(() => {
      expect(screen.getByText('Offline Error Handler')).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('passes correct props to child components', () => {
    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    // Verify that TouchInputErrorRecovery is rendered with correct props
    expect(screen.getByText('Touch Input Error Recovery')).toBeInTheDocument();
  });

  it('restores original fetch on unmount', () => {
    const originalFetch = global.fetch;
    
    const { unmount } = render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    // Fetch should be modified
    expect(global.fetch).not.toBe(originalFetch);

    unmount();

    // Fetch should be restored
    expect(global.fetch).toBe(originalFetch);
  });

  it('handles successful fetch calls when online', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;

    render(
      <MobileErrorHandler
        gameId="test-game"
        gameElement={mockGameElement}
        onError={mockOnError}
        onRecovery={mockOnRecovery}
      >
        <TestComponent shouldError={false} />
      </MobileErrorHandler>
    );

    const response = await fetch('/api/test');
    expect(response.ok).toBe(true);
    expect(mockOnError).not.toHaveBeenCalled();
  });
});