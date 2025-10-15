'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConnectionError, RoomJoinError, RoomAlternative } from '@/lib/room-service';

export interface RoomErrorState {
  type: 'connection' | 'room' | 'validation' | 'timeout' | null;
  error: Error | null;
  code?: string;
  alternatives?: RoomAlternative[];
  retryCount: number;
  canRetry: boolean;
  timestamp: number;
}

interface RoomErrorHandlerProps {
  children: ReactNode;
  gameId?: string;
  onError?: (error: Error, errorType: string) => void;
  onRetry?: () => void;
  onAlternativeSelected?: (alternative: RoomAlternative) => void;
  onGoBack?: () => void;
  maxRetries?: number;
}

export const RoomErrorHandler: React.FC<RoomErrorHandlerProps> = ({
  children,
  gameId,
  onError,
  onRetry,
  onAlternativeSelected,
  onGoBack,
  maxRetries = 3,
}) => {
  const [errorState, setErrorState] = useState<RoomErrorState>({
    type: null,
    error: null,
    retryCount: 0,
    canRetry: true,
    timestamp: 0,
  });

  const [isRetrying, setIsRetrying] = useState(false);

  // Handle different types of errors
  const handleError = (error: Error, context: string = 'unknown') => {
    let errorType: RoomErrorState['type'] = null;
    let code: string | undefined;
    let alternatives: RoomAlternative[] | undefined;

    // Determine error type and extract additional info
    if ('code' in error) {
      const typedError = error as RoomJoinError | ConnectionError;
      code = typedError.code;

      if (code.includes('CONNECTION') || code.includes('NETWORK') || code.includes('TIMEOUT')) {
        errorType = 'connection';
      } else if (code.includes('ROOM')) {
        errorType = 'room';
        if ('alternatives' in typedError) {
          alternatives = (typedError as RoomJoinError).alternatives;
        }
      } else if (code.includes('VALIDATION') || code.includes('INVALID')) {
        errorType = 'validation';
      }
    } else if (error.message.toLowerCase().includes('timeout')) {
      errorType = 'timeout';
    } else if (error.message.toLowerCase().includes('network')) {
      errorType = 'connection';
    }

    const newErrorState: RoomErrorState = {
      type: errorType,
      error,
      code,
      alternatives,
      retryCount: errorState.retryCount,
      canRetry: errorState.retryCount < maxRetries,
      timestamp: Date.now(),
    };

    setErrorState(newErrorState);
    onError?.(error, context);

    // Log error for debugging
    console.error('Room Error Handler:', {
      error: error.message,
      type: errorType,
      code,
      context,
      retryCount: newErrorState.retryCount,
    });
  };

  const handleRetry = async () => {
    if (!errorState.canRetry || isRetrying) return;

    setIsRetrying(true);
    
    try {
      // Increment retry count
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        canRetry: prev.retryCount + 1 < maxRetries,
      }));

      // Call custom retry handler
      if (onRetry) {
        await onRetry();
      }

      // Clear error state on successful retry
      setErrorState({
        type: null,
        error: null,
        retryCount: 0,
        canRetry: true,
        timestamp: 0,
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // The error will be handled by the next error boundary
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAlternativeSelect = (alternative: RoomAlternative) => {
    onAlternativeSelected?.(alternative);
    // Clear error state when alternative is selected
    setErrorState({
      type: null,
      error: null,
      retryCount: 0,
      canRetry: true,
      timestamp: 0,
    });
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/games';
      }
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const getErrorMessage = (): { title: string; description: string; actionText?: string } => {
    const { error, type, code } = errorState;

    if (!error) return { title: '', description: '' };

    // Handle specific error codes
    if (code) {
      switch (code) {
        case 'ROOM_FULL':
          return {
            title: 'Room is Full',
            description: 'This room has reached its maximum capacity.',
            actionText: 'Try another room'
          };
        case 'ROOM_NOT_FOUND':
          return {
            title: 'Room Not Found',
            description: 'The room code you entered is invalid or the room has been closed.',
            actionText: 'Check the code'
          };
        case 'ROOM_CLOSED':
          return {
            title: 'Room Closed',
            description: 'This room has been closed by the host.',
            actionText: 'Find another room'
          };
        case 'INVALID_ROOM_STATE':
          return {
            title: 'Room Unavailable',
            description: 'This room is currently in a game and not accepting new players.',
            actionText: 'Wait or try another room'
          };
        case 'CONNECTION_FAILED':
          return {
            title: 'Connection Failed',
            description: 'Unable to connect to the multiplayer server.',
            actionText: 'Check your connection'
          };
        case 'PERMISSION_DENIED':
          return {
            title: 'Access Denied',
            description: 'You don\'t have permission to join this room.',
            actionText: 'Contact the host'
          };
        case 'INVALID_ROOM_CODE':
          return {
            title: 'Invalid Room Code',
            description: 'The room code must be exactly 6 characters with letters and numbers only.',
            actionText: 'Check the format'
          };
      }
    }

    // Handle error types
    switch (type) {
      case 'connection':
        return {
          title: 'Connection Problem',
          description: 'Unable to connect to the multiplayer server. Please check your internet connection.',
          actionText: 'Check connection'
        };
      case 'room':
        return {
          title: 'Room Error',
          description: 'There was a problem with the room operation.',
          actionText: 'Try again'
        };
      case 'validation':
        return {
          title: 'Invalid Input',
          description: 'Please check your input and try again.',
          actionText: 'Correct input'
        };
      case 'timeout':
        return {
          title: 'Request Timeout',
          description: 'The operation took too long to complete.',
          actionText: 'Try again'
        };
      default:
        return {
          title: 'Something went wrong',
          description: error.message || 'An unexpected error occurred.',
          actionText: 'Try again'
        };
    }
  };

  // Auto-clear errors after a certain time for non-critical errors
  useEffect(() => {
    if (errorState.error && errorState.type === 'validation') {
      const timer = setTimeout(() => {
        setErrorState(prev => ({
          ...prev,
          type: null,
          error: null,
        }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorState.error, errorState.type]);

  // Provide error handling context to children
  const errorContext = {
    handleError,
    clearError: () => setErrorState({
      type: null,
      error: null,
      retryCount: 0,
      canRetry: true,
      timestamp: 0,
    }),
    errorState,
  };

  // Render error UI if there's an error
  if (errorState.error && errorState.type !== 'validation') {
    const errorInfo = getErrorMessage();
    const hasAlternatives = errorState.alternatives && errorState.alternatives.length > 0;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto text-center">
          <div className="p-6">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {errorInfo.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {errorInfo.description}
              </p>
            </div>

            {/* Show alternatives for room full errors */}
            {hasAlternatives && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-3 font-medium">
                  Try these similar rooms instead:
                </p>
                <div className="space-y-2">
                  {errorState.alternatives!.slice(0, 3).map((alt) => (
                    <button
                      key={alt.roomId}
                      onClick={() => handleAlternativeSelect(alt)}
                      className="w-full p-2 text-left bg-white rounded border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">
                          Room {alt.roomCode}
                        </span>
                        <span className="text-xs text-blue-700">
                          {alt.playerCount}/{alt.maxPlayers} players
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {errorState.canRetry && (
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full"
                  variant="primary"
                >
                  {isRetrying ? 'Retrying...' : `${errorInfo.actionText || 'Try Again'} (${maxRetries - errorState.retryCount} left)`}
                </Button>
              )}

              {gameId && (
                <Button
                  onClick={handleGoBack}
                  className="w-full"
                  variant="secondary"
                >
                  Back to Games
                </Button>
              )}

              <Button
                onClick={handleReload}
                className="w-full"
                variant="outline"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Debug Info
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  Error: {errorState.error.message}
                  {'\n'}Type: {errorState.type}
                  {'\n'}Code: {errorState.code}
                  {'\n'}Retry Count: {errorState.retryCount}
                  {'\n'}Timestamp: {new Date(errorState.timestamp).toISOString()}
                </pre>
              </details>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Render children with error context
  return (
    <ErrorContext.Provider value={errorContext}>
      {children}
    </ErrorContext.Provider>
  );
};

// Error context for child components
export const ErrorContext = React.createContext<{
  handleError: (error: Error, context?: string) => void;
  clearError: () => void;
  errorState: RoomErrorState;
} | null>(null);

// Hook to use error context
export const useRoomError = () => {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useRoomError must be used within a RoomErrorHandler');
  }
  return context;
};

export default RoomErrorHandler;