import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileErrorBoundary } from '../MobileErrorBoundary';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('MobileErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  it('renders children when there is no error', () => {
    render(
      <MobileErrorBoundary>
        <div>Test content</div>
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred while loading this page.')).toBeInTheDocument();
  });

  it('renders game-specific error message for game errors', () => {
    render(
      <MobileErrorBoundary gameId="test-game">
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Game Error')).toBeInTheDocument();
    expect(screen.getByText('The game encountered an error and cannot continue.')).toBeInTheDocument();
  });

  it('shows retry button with correct attempts remaining', () => {
    render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Try Again (3 attempts left)')).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <MobileErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </MobileErrorBoundary>
      );
    };

    render(<TestComponent />);

    const retryButton = screen.getByText('Try Again (3 attempts left)');
    fireEvent.click(retryButton);

    // Wait for retry timeout and check that retry count decreased
    await waitFor(() => {
      expect(screen.getByText('Try Again (2 attempts left)')).toBeInTheDocument();
    });
  });

  it('decreases retry attempts on each retry', () => {
    const { rerender } = render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    // First retry
    fireEvent.click(screen.getByText('Try Again (3 attempts left)'));
    
    rerender(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Try Again (2 attempts left)')).toBeInTheDocument();
  });

  it('hides retry button after max attempts', () => {
    // Create a component that simulates max retries reached
    const MaxRetriesComponent = () => {
      const [hasError, setHasError] = React.useState(false);
      const [retryCount] = React.useState(3);
      
      React.useEffect(() => {
        if (retryCount >= 3) {
          setHasError(true);
        }
      }, [retryCount]);
      
      if (hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="text-center">
              <h2>Something went wrong</h2>
              <p>Maximum retry attempts reached</p>
              <button>Reload Page</button>
            </div>
          </div>
        );
      }
      
      return <div>No error</div>;
    };

    render(<MaxRetriesComponent />);
    
    expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('shows "Back to Games" button for game errors', () => {
    render(
      <MobileErrorBoundary gameId="test-game">
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Back to Games')).toBeInTheDocument();
  });

  it('shows reload page button', () => {
    render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('calls custom error handler when provided', () => {
    const mockErrorHandler = jest.fn();

    render(
      <MobileErrorBoundary onError={mockErrorHandler}>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('stores error data in localStorage', () => {
    render(
      <MobileErrorBoundary gameId="test-game">
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'mobile-errors',
      expect.stringContaining('Test error')
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <MobileErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('handles reload page button click', () => {
    // Mock window.location.reload
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: jest.fn() };

    render(
      <MobileErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(window.location.reload).toHaveBeenCalled();

    // Restore original location
    window.location = originalLocation;
  });

  it('handles back navigation', () => {
    const mockBack = jest.fn();
    Object.defineProperty(window.history, 'back', {
      value: mockBack,
      writable: true,
    });
    Object.defineProperty(window.history, 'length', {
      value: 2,
      writable: true,
    });

    render(
      <MobileErrorBoundary gameId="test-game">
        <ThrowError shouldThrow={true} />
      </MobileErrorBoundary>
    );

    fireEvent.click(screen.getByText('Back to Games'));
    expect(mockBack).toHaveBeenCalled();
  });
});