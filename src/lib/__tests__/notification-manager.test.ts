import { NotificationManager } from '../notification-manager';

// Mock global objects
const mockServiceWorkerRegistration = {
  pushManager: {
    getSubscription: jest.fn(),
    subscribe: jest.fn(),
  },
  showNotification: jest.fn(),
} as any;

const mockPushSubscription = {
  unsubscribe: jest.fn(),
  toJSON: jest.fn(() => ({
    endpoint: 'https://example.com/push',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  })),
} as any;

// Setup global mocks
const setupGlobalMocks = () => {
  (global as any).Notification = {
    permission: 'default',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  };

  (global as any).navigator = {
    serviceWorker: {
      ready: Promise.resolve(mockServiceWorkerRegistration),
    },
  };

  (global as any).localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  (global as any).window = {
    atob: jest.fn((str) => str),
  };

  (global as any).PushManager = class PushManager {};
  
  // Ensure all required APIs are present for isNotificationSupported
  (global as any).serviceWorker = {};
};

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;

  beforeEach(() => {
    // Reset singleton instance
    (NotificationManager as any).instance = undefined;
    
    // Setup global mocks
    setupGlobalMocks();
    
    notificationManager = NotificationManager.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
    mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockPushSubscription);
    mockPushSubscription.unsubscribe.mockResolvedValue(true);
    ((global as any).Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = NotificationManager.getInstance();
      const instance2 = NotificationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize with provided service worker registration', async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
      expect(mockServiceWorkerRegistration.pushManager.getSubscription).toHaveBeenCalled();
    });

    it('should initialize without service worker registration', async () => {
      await notificationManager.initialize();
      expect(mockServiceWorkerRegistration.pushManager.getSubscription).toHaveBeenCalled();
    });
  });

  describe('isNotificationSupported', () => {
    it('should return true when all APIs are supported', () => {
      expect(notificationManager.isNotificationSupported()).toBe(true);
    });

    it('should return false when Notification API is not supported', () => {
      delete (global as any).Notification;
      const manager = NotificationManager.getInstance();
      expect(manager.isNotificationSupported()).toBe(false);
    });
  });

  describe('getPermissionStatus', () => {
    it('should return current notification permission', () => {
      global.Notification.permission = 'granted';
      expect(notificationManager.getPermissionStatus()).toBe('granted');
    });

    it('should return denied when Notification API is not supported', () => {
      delete (global as any).Notification;
      const manager = NotificationManager.getInstance();
      expect(manager.getPermissionStatus()).toBe('denied');
    });
  });

  describe('requestPermission', () => {
    it('should request permission when default', async () => {
      global.Notification.permission = 'default';
      const permission = await notificationManager.requestPermission();
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should return current permission when already set', async () => {
      global.Notification.permission = 'granted';
      const permission = await notificationManager.requestPermission();
      
      expect(global.Notification.requestPermission).not.toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should throw error when Notification API is not supported', async () => {
      delete (global as any).Notification;
      const manager = NotificationManager.getInstance();
      
      await expect(manager.requestPermission()).rejects.toThrow(
        'This browser does not support notifications'
      );
    });
  });

  describe('subscribeToNotifications', () => {
    beforeEach(async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
    });

    it('should subscribe to push notifications', async () => {
      global.Notification.permission = 'granted';
      
      const subscription = await notificationManager.subscribeToNotifications();
      
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
      });
      expect(subscription).toBe(mockPushSubscription);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'pushSubscription',
        JSON.stringify(mockPushSubscription.toJSON())
      );
    });

    it('should subscribe with VAPID key', async () => {
      global.Notification.permission = 'granted';
      const vapidKey = 'test-vapid-key';
      
      await notificationManager.subscribeToNotifications(vapidKey);
      
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
    });

    it('should throw error when permission is denied', async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
      ((global as any).Notification.requestPermission as jest.Mock).mockResolvedValue('denied');
      
      await expect(notificationManager.subscribeToNotifications()).rejects.toThrow(
        'Notification permission denied'
      );
    });

    it('should throw error when service worker is not registered', async () => {
      // Reset singleton to get a fresh instance
      (NotificationManager as any).instance = undefined;
      const manager = NotificationManager.getInstance();
      
      await expect(manager.subscribeToNotifications()).rejects.toThrow(
        'Service worker not registered'
      );
    });
  });

  describe('unsubscribeFromNotifications', () => {
    beforeEach(async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
      global.Notification.permission = 'granted';
      await notificationManager.subscribeToNotifications();
    });

    it('should unsubscribe from push notifications', async () => {
      const result = await notificationManager.unsubscribeFromNotifications();
      
      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('pushSubscription');
    });

    it('should return true when no subscription exists', async () => {
      const manager = NotificationManager.getInstance();
      const result = await manager.unsubscribeFromNotifications();
      
      expect(result).toBe(true);
    });
  });

  describe('getSubscriptionData', () => {
    beforeEach(async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
      global.Notification.permission = 'granted';
    });

    it('should return subscription data when subscribed', async () => {
      await notificationManager.subscribeToNotifications();
      
      const data = notificationManager.getSubscriptionData();
      
      expect(data).toEqual({
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      });
    });

    it('should return null when not subscribed', () => {
      const data = notificationManager.getSubscriptionData();
      expect(data).toBeNull();
    });
  });

  describe('sendLocalNotification', () => {
    beforeEach(async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
    });

    it('should send notification via service worker when available', async () => {
      global.Notification.permission = 'granted';
      
      const config = {
        title: 'Test Notification',
        body: 'Test body',
        icon: '/test-icon.png',
      };
      
      await notificationManager.sendLocalNotification(config);
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Notification',
        expect.objectContaining({
          body: 'Test body',
          icon: '/test-icon.png',
        })
      );
    });

    it('should throw error when permission is not granted', async () => {
      global.Notification.permission = 'denied';
      
      const config = {
        title: 'Test Notification',
        body: 'Test body',
      };
      
      await expect(notificationManager.sendLocalNotification(config)).rejects.toThrow(
        'Notification permission not granted'
      );
    });
  });

  describe('notifyNewGame', () => {
    beforeEach(async () => {
      await notificationManager.initialize(mockServiceWorkerRegistration);
      global.Notification.permission = 'granted';
    });

    it('should send new game notification', async () => {
      await notificationManager.notifyNewGame('Test Game', 'test-game');
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'New Game Available!',
        expect.objectContaining({
          body: 'Check out the new game: Test Game',
          tag: 'new-game-test-game',
          data: {
            gameId: 'test-game',
            url: '/games/test-game',
          },
        })
      );
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', () => {
      const stats = notificationManager.getNotificationStats();
      
      expect(stats).toEqual({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        hasServiceWorker: false,
      });
    });
  });
});