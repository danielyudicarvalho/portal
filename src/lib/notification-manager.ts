/**
 * NotificationManager - Handles push notification functionality for PWA
 * Manages permission requests, subscription handling, and notification display
 */

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize the notification manager with service worker registration
   */
  async initialize(registration?: ServiceWorkerRegistration): Promise<void> {
    if (registration) {
      this.registration = registration;
    } else if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.ready;
    }

    // Load existing subscription if available
    if (this.registration) {
      this.subscription = await this.registration.pushManager.getSubscription();
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  /**
   * Check if notifications are supported and permitted
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToNotifications(vapidPublicKey?: string): Promise<PushSubscription> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const subscribeOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
    };

    if (vapidPublicKey) {
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      (subscribeOptions as any).applicationServerKey = applicationServerKey;
    }

    this.subscription = await this.registration.pushManager.subscribe(subscribeOptions);
    
    // Store subscription in localStorage for persistence
    localStorage.setItem('pushSubscription', JSON.stringify(this.subscription.toJSON()));

    return this.subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromNotifications(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    const result = await this.subscription.unsubscribe();
    if (result) {
      this.subscription = null;
      localStorage.removeItem('pushSubscription');
    }

    return result;
  }

  /**
   * Get current push subscription
   */
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  /**
   * Get subscription data in a serializable format
   */
  getSubscriptionData(): PushSubscriptionData | null {
    if (!this.subscription) {
      return null;
    }

    const subscriptionJson = this.subscription.toJSON();
    return {
      endpoint: subscriptionJson.endpoint!,
      keys: {
        p256dh: subscriptionJson.keys!.p256dh!,
        auth: subscriptionJson.keys!.auth!,
      },
    };
  }

  /**
   * Send a local notification (not push notification)
   */
  async sendLocalNotification(config: NotificationConfig): Promise<void> {
    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.registration) {
      // Fallback to regular notification if no service worker
      new Notification(config.title, {
        body: config.body,
        icon: config.icon,
        badge: config.badge,
        tag: config.tag,
        data: config.data,
        requireInteraction: config.requireInteraction,
      });
      return;
    }

    // Use service worker to show notification
    const notificationOptions: NotificationOptions = {
      body: config.body,
      icon: config.icon || '/icons/icon-192x192.png',
      badge: config.badge || '/icons/icon-72x72.png',
      tag: config.tag,
      data: config.data,
      requireInteraction: config.requireInteraction,
    };

    // Add actions if supported (only in service worker context)
    if (config.actions && config.actions.length > 0) {
      (notificationOptions as any).actions = config.actions;
    }

    await this.registration.showNotification(config.title, notificationOptions);
  }

  /**
   * Handle notification click events (to be used in service worker context)
   */
  handleNotificationClick(event: any): void {
    if (typeof self === 'undefined' || !('clients' in self)) {
      // Not in service worker context, skip
      return;
    }

    event.notification.close();

    const data = event.notification.data;
    const action = event.action;

    // Handle different notification actions
    if (action === 'play-game' && data?.gameId) {
      // Navigate to specific game
      event.waitUntil(
        (self as any).clients.openWindow(`/games/${data.gameId}`)
      );
    } else if (action === 'view-games') {
      // Navigate to games page
      event.waitUntil(
        (self as any).clients.openWindow('/games')
      );
    } else if (data?.url) {
      // Navigate to custom URL
      event.waitUntil(
        (self as any).clients.openWindow(data.url)
      );
    } else {
      // Default: open the app
      event.waitUntil(
        (self as any).clients.openWindow('/')
      );
    }
  }

  /**
   * Send notification about new games
   */
  async notifyNewGame(gameTitle: string, gameId: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Game Available!',
      body: `Check out the new game: ${gameTitle}`,
      icon: '/icons/icon-192x192.png',
      tag: `new-game-${gameId}`,
      data: {
        gameId,
        url: `/games/${gameId}`,
      },
      actions: [
        {
          action: 'play-game',
          title: 'Play Now',
          icon: '/icons/icon-72x72.png',
        },
        {
          action: 'view-games',
          title: 'View All Games',
          icon: '/icons/icon-72x72.png',
        },
      ],
      requireInteraction: true,
    });
  }

  /**
   * Send notification about app updates
   */
  async notifyAppUpdate(): Promise<void> {
    await this.sendLocalNotification({
      title: 'App Updated!',
      body: 'New features and improvements are available',
      icon: '/icons/icon-192x192.png',
      tag: 'app-update',
      data: {
        url: '/',
      },
      requireInteraction: false,
    });
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if user is subscribed to notifications
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    hasServiceWorker: boolean;
  } {
    return {
      isSupported: this.isNotificationSupported(),
      permission: this.getPermissionStatus(),
      isSubscribed: this.isSubscribed(),
      hasServiceWorker: this.registration !== null,
    };
  }
}

export default NotificationManager;