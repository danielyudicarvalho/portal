'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useOfflineGames } from '@/hooks/useOfflineGames';
import { usePWAOfflineState } from '@/hooks/usePWAOfflineState';

interface OfflineErrorHandlerProps {
  error: Error;
  gameId?: string;
  onRetry?: () => void;
  onOfflineGameSelect?: (gameId: string) => void;
}

export const OfflineErrorHandler: React.FC<OfflineErrorHandlerProps> = ({
  error,
  gameId,
  onRetry,
  onOfflineGameSelect,
}) => {
  const { offlineStatus } = usePWAOfflineState();
  const isOnline = offlineStatus.isOnline;
  const { offlineGames, isGameOffline } = useOfflineGames();
  const [isGameOfflineAvailable, setIsGameOfflineAvailable] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (gameId) {
      setIsGameOfflineAvailable(isGameOffline(gameId));
    }
  }, [gameId, isGameOffline]);

  const handleRetry = async () => {
    if (onRetry && retryAttempts < 3) {
      setIsRetrying(true);
      setRetryAttempts(prev => prev + 1);

      try {
        await onRetry();
      } catch (error) {
        console.error('Retry failed:', error);
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleOfflineGameSelect = (selectedGameId: string) => {
    if (onOfflineGameSelect) {
      onOfflineGameSelect(selectedGameId);
    }
  };

  const getErrorMessage = () => {
    if (!isOnline) {
      if (gameId && isGameOfflineAvailable) {
        return 'You\'re offline, but this game is available offline. Try reloading the game.';
      }
      return 'You\'re offline and this content is not available offline.';
    }

    if (error.message.includes('fetch')) {
      return 'Failed to load content. Please check your internet connection.';
    }

    if (error.message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    return 'An error occurred while loading content.';
  };

  const getErrorIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Z" />
        </svg>
      );
    }

    return (
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              {getErrorIcon()}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {!isOnline ? 'You\'re Offline' : 'Connection Error'}
            </h2>

            <p className="text-gray-600 text-sm mb-4">
              {getErrorMessage()}
            </p>
          </div>

          <div className="space-y-3">
            {/* Retry button for online errors or offline games */}
            {(isOnline || (gameId && isGameOfflineAvailable)) && onRetry && retryAttempts < 3 && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
                variant="primary"
              >
                {isRetrying ? 'Retrying...' : `Try Again (${3 - retryAttempts} attempts left)`}
              </Button>
            )}

            {/* Show offline games when offline */}
            {!isOnline && offlineGames.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Available offline games:
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {offlineGames.slice(0, 5).map((offlineGameId) => (
                    <Button
                      key={offlineGameId}
                      onClick={() => handleOfflineGameSelect(offlineGameId)}
                      className="w-full text-sm"
                      variant="outline"
                    >
                      Play {offlineGameId.replace(/-/g, ' ')}
                    </Button>
                  ))}
                </div>
                {offlineGames.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{offlineGames.length - 5} more games available
                  </p>
                )}
              </div>
            )}

            {/* Go back button */}
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = '/games';
                  }
                }
              }}
              className="w-full"
              variant="secondary"
            >
              Back to Games
            </Button>

            {/* Reload button */}
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="w-full"
              variant="outline"
            >
              Reload Page
            </Button>
          </div>

          {/* Connection status indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OfflineErrorHandler;