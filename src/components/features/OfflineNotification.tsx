'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useOfflineHandler } from '@/lib/offline-handler';
import { LoadingSpinner } from './LoadingStates';

interface OfflineNotificationProps {
  onReconnect?: () => void;
  className?: string;
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  onReconnect,
  className = '',
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);

  const offlineState = useOfflineHandler({
    onOffline: () => {
      setShowNotification(true);
    },
    onOnline: () => {
      setIsReconnecting(false);
      // Keep notification visible for a moment to show success
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    },
    onReconnectAttempt: (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    },
    onReconnectSuccess: () => {
      setIsReconnecting(false);
      onReconnect?.();
    },
    onReconnectFailed: (error) => {
      setIsReconnecting(false);
      console.error('Reconnection failed:', error);
    },
  });

  // Update offline duration
  useEffect(() => {
    if (!offlineState.isOnline && offlineState.offlineSince) {
      const interval = setInterval(() => {
        setOfflineDuration(Date.now() - offlineState.offlineSince!);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setOfflineDuration(0);
    }
  }, [offlineState.isOnline, offlineState.offlineSince]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await offlineState.forceReconnect();
      onReconnect?.();
    } catch (error) {
      console.error('Manual reconnection failed:', error);
      setIsReconnecting(false);
    }
  };

  const handleDismiss = () => {
    if (offlineState.isOnline) {
      setShowNotification(false);
      offlineState.clearOfflineState();
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!showNotification) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className={`max-w-sm mx-auto rounded-lg shadow-lg border transition-all duration-300 ${
        offlineState.isOnline 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {offlineState.isOnline ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium">
                {offlineState.isOnline ? 'Connection Restored' : 'Connection Lost'}
              </h3>
              <div className="mt-1 text-sm">
                {offlineState.isOnline ? (
                  <p>You're back online! Room data will be refreshed automatically.</p>
                ) : (
                  <div>
                    <p>You're currently offline. Some features may not work properly.</p>
                    {offlineDuration > 0 && (
                      <p className="mt-1 text-xs opacity-75">
                        Offline for: {formatDuration(offlineDuration)}
                      </p>
                    )}
                    {offlineState.reconnectAttempts > 0 && (
                      <p className="mt-1 text-xs opacity-75">
                        Reconnection attempts: {offlineState.reconnectAttempts}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 flex space-x-2">
                {!offlineState.isOnline && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="text-xs"
                  >
                    {isReconnecting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        Reconnecting...
                      </>
                    ) : (
                      'Try Reconnect'
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-xs"
                >
                  {offlineState.isOnline ? 'Dismiss' : 'Hide'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineNotification;