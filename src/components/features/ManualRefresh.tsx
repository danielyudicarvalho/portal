'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LoadingSpinner } from './LoadingStates';

interface ManualRefreshProps {
  onRefresh: () => Promise<void>;
  isVisible: boolean;
  title?: string;
  description?: string;
  lastRefresh?: number;
  className?: string;
}

export const ManualRefresh: React.FC<ManualRefreshProps> = ({
  onRefresh,
  isVisible,
  title = 'Connection Issues',
  description = 'Unable to automatically refresh data. You can try refreshing manually.',
  lastRefresh,
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(lastRefresh || 0);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastRefresh = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return new Date(timestamp).toLocaleString();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      <Card className="max-w-sm bg-yellow-50 border-yellow-200">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {title}
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>{description}</p>
                {lastRefreshTime > 0 && (
                  <p className="mt-1 text-xs opacity-75">
                    Last refresh: {formatLastRefresh(lastRefreshTime)}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                  {isRefreshing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface ConnectionIssuesBannerProps {
  isVisible: boolean;
  onRefresh: () => Promise<void>;
  onDismiss?: () => void;
  reconnectAttempts?: number;
  className?: string;
}

export const ConnectionIssuesBanner: React.FC<ConnectionIssuesBannerProps> = ({
  isVisible,
  onRefresh,
  onDismiss,
  reconnectAttempts = 0,
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Connection refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Connection Issues Detected</strong>
            {reconnectAttempts > 0 && (
              <span className="ml-2 text-xs opacity-75">
                ({reconnectAttempts} reconnection attempts)
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-yellow-600">
            Room data may be outdated. Try refreshing to get the latest information.
          </p>
          <div className="mt-3 flex space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              {isRefreshing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh Now'
              )}
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-yellow-700 hover:text-yellow-800"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualRefresh;