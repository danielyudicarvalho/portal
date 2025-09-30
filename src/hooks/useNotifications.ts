import { useState, useEffect, useCallback } from 'react';
import { NotificationManager, NotificationConfig } from '@/lib/notification-manager';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseNotificationsReturn {
  state: NotificationState;
  requestPermission: () => Promise<void>;
  subscribe: (vapidKey?: string) => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendNotification: (config: NotificationConfig) => Promise<void>;
  notifyNewGame: (gameTitle: string, gameId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing push notifications in React components
 */
export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  const notificationManager = NotificationManager.getInstance();

  // Initialize notification manager and state
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationManager.initialize();
        
        setState(prev => ({
          ...prev,
          isSupported: notificationManager.isNotificationSupported(),
          permission: notificationManager.getPermissionStatus(),
          isSubscribed: notificationManager.isSubscribed(),
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize notifications',
        }));
      }
    };

    initializeNotifications();
  }, []);

  // Listen for permission changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setState(prev => ({
          ...prev,
          permission: notificationManager.getPermissionStatus(),
          isSubscribed: notificationManager.isSubscribed(),
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [notificationManager]);

  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await notificationManager.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request permission',
        isLoading: false,
      }));
    }
  }, [notificationManager]);

  const subscribe = useCallback(async (vapidKey?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await notificationManager.subscribeToNotifications(vapidKey);
      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to subscribe to notifications',
        isLoading: false,
      }));
    }
  }, [notificationManager]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await notificationManager.unsubscribeFromNotifications();
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from notifications',
        isLoading: false,
      }));
    }
  }, [notificationManager]);

  const sendNotification = useCallback(async (config: NotificationConfig) => {
    try {
      await notificationManager.sendLocalNotification(config);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      }));
    }
  }, [notificationManager]);

  const notifyNewGame = useCallback(async (gameTitle: string, gameId: string) => {
    try {
      await notificationManager.notifyNewGame(gameTitle, gameId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send game notification',
      }));
    }
  }, [notificationManager]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
    notifyNewGame,
    clearError,
  };
}

export default useNotifications;