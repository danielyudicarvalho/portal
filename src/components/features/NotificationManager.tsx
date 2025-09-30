'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export interface NotificationManagerProps {
  vapidPublicKey?: string;
  showStats?: boolean;
  className?: string;
}

/**
 * NotificationManager Component
 * Provides UI for managing push notification permissions and subscriptions
 */
export function NotificationManager({ 
  vapidPublicKey, 
  showStats = false, 
  className = '' 
}: NotificationManagerProps) {
  const {
    state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
    clearError,
  } = useNotifications();

  const handleTestNotification = async () => {
    await sendNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the Game Portal!',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification',
    });
  };

  const getPermissionStatusText = () => {
    switch (state.permission) {
      case 'granted':
        return 'Notifications are enabled';
      case 'denied':
        return 'Notifications are blocked';
      default:
        return 'Notification permission not requested';
    }
  };

  const getPermissionStatusColor = () => {
    switch (state.permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (!state.isSupported) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Notifications Not Supported</h3>
          <p className="text-gray-600">
            Your browser doesn&apos;t support push notifications.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
          <p className={`text-sm ${getPermissionStatusColor()}`}>
            {getPermissionStatusText()}
          </p>
        </div>

        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex justify-between items-start">
              <p className="text-red-700 text-sm">{state.error}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 ml-2"
                aria-label="Clear error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          {state.permission === 'default' && (
            <Button
              onClick={requestPermission}
              disabled={state.isLoading}
              className="w-full"
            >
              {state.isLoading ? 'Requesting...' : 'Enable Notifications'}
            </Button>
          )}

          {state.permission === 'granted' && !state.isSubscribed && (
            <Button
              onClick={() => subscribe(vapidPublicKey)}
              disabled={state.isLoading}
              className="w-full"
            >
              {state.isLoading ? 'Subscribing...' : 'Subscribe to Notifications'}
            </Button>
          )}

          {state.permission === 'granted' && state.isSubscribed && (
            <>
              <Button
                onClick={unsubscribe}
                disabled={state.isLoading}
                variant="outline"
                className="w-full"
              >
                {state.isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
              </Button>
              
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                Send Test Notification
              </Button>
            </>
          )}

          {state.permission === 'denied' && (
            <div className="text-center p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                Notifications are blocked. To enable them:
              </p>
              <ol className="text-xs text-gray-500 text-left space-y-1">
                <li>1. Click the lock icon in your browser&apos;s address bar</li>
                <li>2. Change notifications to &quot;Allow&quot;</li>
                <li>3. Refresh this page</li>
              </ol>
            </div>
          )}
        </div>

        {showStats && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-2">Notification Status</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Supported:</span>
                <span className={state.isSupported ? 'text-green-600' : 'text-red-600'}>
                  {state.isSupported ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Permission:</span>
                <span className={getPermissionStatusColor()}>
                  {state.permission}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subscribed:</span>
                <span className={state.isSubscribed ? 'text-green-600' : 'text-gray-600'}>
                  {state.isSubscribed ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={state.isLoading ? 'text-blue-600' : 'text-gray-600'}>
                  {state.isLoading ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default NotificationManager;