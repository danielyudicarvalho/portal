'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { MobileErrorBoundary } from './MobileErrorBoundary';
import { OfflineErrorHandler } from './OfflineErrorHandler';
import { TouchInputErrorRecovery } from './TouchInputErrorRecovery';
import { usePWAOfflineState } from '@/hooks/usePWAOfflineState';

interface MobileErrorHandlerProps {
  children: ReactNode;
  gameId?: string;
  gameElement?: HTMLElement | null;
  onError?: (error: Error, context: string) => void;
  onRecovery?: () => void;
}

interface ErrorState {
  type: 'boundary' | 'offline' | 'touch' | null;
  error: Error | null;
  context: string;
}

export const MobileErrorHandler: React.FC<MobileErrorHandlerProps> = ({
  children,
  gameId,
  gameElement,
  onError,
  onRecovery,
}) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    type: null,
    error: null,
    context: '',
  });
  const { offlineStatus } = usePWAOfflineState();
  const isOnline = offlineStatus.isOnline;

  // Handle offline errors
  useEffect(() => {
    const handleOfflineError = (error: Error) => {
      setErrorState({
        type: 'offline',
        error,
        context: 'Network connectivity issue',
      });
      onError?.(error, 'offline');
    };

    // Listen for fetch errors that might indicate offline issues
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && !isOnline) {
          throw new Error(`Network error: ${response.status}`);
        }
        return response;
      } catch (error) {
        if (!isOnline && error instanceof Error) {
          handleOfflineError(error);
          throw error;
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isOnline, onError]);

  const handleBoundaryError = (error: Error) => {
    setErrorState({
      type: 'boundary',
      error,
      context: 'Component error boundary',
    });
    onError?.(error, 'boundary');
  };

  const handleRetry = async () => {
    setErrorState({ type: null, error: null, context: '' });
    onRecovery?.();
  };

  const handleOfflineGameSelect = (selectedGameId: string) => {
    // Navigate to the selected offline game
    window.location.href = `/games/${selectedGameId}`;
  };

  const handleTouchRecoveryComplete = () => {
    setErrorState({ type: null, error: null, context: '' });
    onRecovery?.();
  };

  const handleFallbackMode = () => {
    // Enable fallback mode and clear error state
    setErrorState({ type: null, error: null, context: '' });
    onRecovery?.();
  };

  // Render error UI based on error type
  if (errorState.type === 'offline' && errorState.error) {
    return (
      <OfflineErrorHandler
        error={errorState.error}
        gameId={gameId}
        onRetry={handleRetry}
        onOfflineGameSelect={handleOfflineGameSelect}
      />
    );
  }

  return (
    <>
      <MobileErrorBoundary
        gameId={gameId}
        onError={handleBoundaryError}
        fallback={
          errorState.type === 'boundary' && errorState.error ? (
            <OfflineErrorHandler
              error={errorState.error}
              gameId={gameId}
              onRetry={handleRetry}
              onOfflineGameSelect={handleOfflineGameSelect}
            />
          ) : undefined
        }
      >
        {children}
      </MobileErrorBoundary>

      {/* Touch input error recovery overlay */}
      <TouchInputErrorRecovery
        gameElement={gameElement}
        gameId={gameId}
        onRecoveryComplete={handleTouchRecoveryComplete}
        onFallbackMode={handleFallbackMode}
      />
    </>
  );
};

export default MobileErrorHandler;