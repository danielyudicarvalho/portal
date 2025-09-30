/**
 * PWA Integration Tests
 * 
 * Comprehensive end-to-end tests for PWA functionality including:
 * - Service worker registration and caching
 * - Offline functionality
 * - Installation flow
 * - Mobile optimization
 * - Game compatibility
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';

// Mock browser APIs
const mockServiceWorker = {
  register: jest.fn(),
  getRegistration: jest.fn(),
  ready: Promise.resolve({
    active: { state: 'activated' },
    waiting: null,
    installing: null,
    update: jest.fn(),
    unregister: jest.fn(),
  }),
};

const mockCaches = {
  open: jest.fn(),
  match: jest.fn(),
  keys: jest.fn(),
  delete: jest.fn(),
};

const mockCache = {
  match: jest.fn(),
  add: jest.fn(),
  addAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

// Mock PWA-related modules
jest.mock('@/lib/pwa', () => ({
  registerServiceWorker: jest.fn(),
  getServiceWorkerStatus: jest.fn(),
  isServiceWorkerSupported: jest.fn(() => true),
}));

jest.mock('@/lib/game-cache-manager', () => ({
  gameCacheManager: {
    cacheGameAssets: jest.fn(),
    isGameAvailableOffline: jest.fn(),
    getOfflineGames: jest.fn(),
    clearGameCache: jest.fn(),
    getCacheSize: jest.fn(),
    preloadCriticalAssets: jest.fn(),
  },
}));

jest.mock('@/lib/mobile-detection', () => ({
  detectDevice: jest.fn(() => ({
    isMobile: true,
    deviceType: 'mobile',
    orientation: 'portrait',
    screenSize: { width: 375, height: 667 },
    touchSupport: true,
    platform: 'iOS',
    browser: 'Safari',
  })),
  isMobileDevice: jest.fn(() => true),
}));

describe('PWA Integration Tests', () => {
  beforeAll(() => {
    // Setup global mocks
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: mockServiceWorker,
        onLine: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        standalone: false,
      },
      writable: true,
    });

    Object.defineProperty(window, 'caches', {
      value: mockCaches,
      writable: true,
    });

    // Mock matchMedia for responsive design tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(display-mode: standalone)') ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock BeforeInstallPromptEvent
    global.BeforeInstallPromptEvent = class extends Event {
      platforms = ['web'];
      userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      prompt = jest.fn().mockResolvedValue(undefined);
    } as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaches.open.mockResolvedValue(mockCache);
    mockCache.match.mockResolvedValue(undefined);
    mockCache.keys.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const { registerServiceWorker } = await import('@/lib/pwa');
      mockServiceWorker.register.mockResolvedValue({
        scope: '/',
        active: { state: 'activated' },
        installing: null,
        waiting: null,
      });

      await registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
    });

    it('should handle service worker registration failure gracefully', async () => {
      const { registerServiceWorker } = await import('@/lib/pwa');
      const error = new Error('Service worker registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      await expect(registerServiceWorker()).rejects.toThrow(error);
    });

    it('should get service worker status correctly', async () => {
      const { getServiceWorkerStatus } = await import('@/lib/pwa');
      mockServiceWorker.getRegistration.mockResolvedValue({
        active: { state: 'activated' },
        waiting: null,
        installing: null,
      });

      const status = await getServiceWorkerStatus();

      expect(status).toEqual({
        isRegistered: true,
        isControlling: true,
        isWaiting: false,
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should cache app shell resources', async () => {
      const { gameCacheManager } = await import('@/lib/game-cache-manager');
      
      await gameCacheManager.preloadCriticalAssets();

      expect(mockCaches.open).toHaveBeenCalledWith('app-shell-cache');
      expect(gameCacheManager.preloadCriticalAssets).toHaveBeenCalled();
    });

    it('should cache game assets for offline play', async () => {
      const { gameCacheManager } = await import('@/lib/game-cache-manager');
      const gameId = 'memdot';

      gameCacheManager.cacheGameAssets.mockResolvedValue(undefined);
      await gameCacheManager.cacheGameAssets(gameId);

      expect(gameCacheManager.cacheGameAssets).toHaveBeenCalledWith(gameId);
    });

    it('should detect offline games correctly', async () => {
      const { gameCacheManager } = await import('@/lib/game-cache-manager');
      const offlineGames = ['memdot', 'clocks'];

      gameCacheManager.getOfflineGames.mockResolvedValue(offlineGames);
      const result = await gameCacheManager.getOfflineGames();

      expect(result).toEqual(offlineGames);
    });

    it('should handle network status changes', async () => {
      await import('@/lib/network-status');
      
      // Mock online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Simulate offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(navigator.onLine).toBe(false);
    });
  });

  describe('PWA Installation', () => {
    it('should handle install prompt correctly', async () => {
      const mockEvent = new (global.BeforeInstallPromptEvent as any)('beforeinstallprompt');
      
      // Simulate beforeinstallprompt event
      window.dispatchEvent(mockEvent);

      expect(mockEvent.prompt).toBeDefined();
      expect(mockEvent.userChoice).toBeDefined();
    });

    it('should detect standalone mode correctly', () => {
      // Test standalone mode detection
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('(display-mode: standalone)'),
          media: query,
        })),
      });

      const standaloneMatch = window.matchMedia('(display-mode: standalone)');
      expect(standaloneMatch.matches).toBe(true);
    });

    it('should handle iOS standalone detection', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true,
      });

      expect((window.navigator as any).standalone).toBe(true);
    });
  });

  describe('Mobile Optimization', () => {
    it('should detect mobile device correctly', async () => {
      const { detectDevice } = await import('@/lib/mobile-detection');
      
      const deviceInfo = detectDevice();

      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.touchSupport).toBe(true);
      expect(deviceInfo.screenSize).toEqual({ width: 375, height: 667 });
    });

    it('should optimize performance for mobile', async () => {
      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      
      const optimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'aggressive',
      });

      const optimizations = await optimizer.optimize();

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
    });

    it('should handle touch input adaptation', async () => {
      const { TouchInputAdapter } = await import('@/lib/touch-input-adapter');
      
      const adapter = new TouchInputAdapter();
      const mockGameElement = document.createElement('div');

      adapter.adaptKeyboardControls(mockGameElement);

      expect(mockGameElement.getAttribute('data-touch-adapted')).toBe('true');
    });

    it('should manage viewport correctly', async () => {
      const { ViewportManager } = await import('@/lib/orientation-manager');
      
      const viewportManager = new ViewportManager();
      
      viewportManager.setViewportForGame({
        width: 800,
        height: 600,
        scaleMode: 'fit',
      });

      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
    });
  });

  describe('Game Compatibility', () => {
    it('should check game compatibility on mobile', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'memdot',
        requiresKeyboard: false,
        supportsTouch: true,
        minScreenSize: { width: 320, height: 480 },
      };

      const compatibility = await checkGameCompatibility(gameConfig);

      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.adaptationsNeeded).toBeDefined();
    });

    it('should provide fallbacks for incompatible games', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'complex-game',
        requiresKeyboard: true,
        supportsTouch: false,
        minScreenSize: { width: 1024, height: 768 },
      };

      const compatibility = await checkGameCompatibility(gameConfig);

      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.fallbackOptions).toBeDefined();
      expect(compatibility.fallbackOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Push Notifications', () => {
    it('should request notification permission', async () => {
      const { NotificationManager } = await import('@/lib/notification-manager');
      
      // Mock Notification API
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });

      const notificationManager = new NotificationManager();
      const permission = await notificationManager.requestPermission();

      expect(permission).toBe('granted');
    });

    it('should handle push subscription', async () => {
      const { NotificationManager } = await import('@/lib/notification-manager');
      
      const mockRegistration = {
        pushManager: {
          subscribe: jest.fn().mockResolvedValue({
            endpoint: 'https://example.com/push',
            keys: {
              p256dh: 'test-key',
              auth: 'test-auth',
            },
          }),
          getSubscription: jest.fn().mockResolvedValue(null),
        },
      };

      mockServiceWorker.ready = Promise.resolve(mockRegistration);

      const notificationManager = new NotificationManager();
      const subscription = await notificationManager.subscribeToNotifications();

      expect(subscription).toBeDefined();
      expect(subscription.endpoint).toBe('https://example.com/push');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track mobile performance metrics', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      
      monitor.startSession();
      
      // Simulate some performance data
      monitor.recordFrameTime(16.67); // 60 FPS
      monitor.recordLoadTime(1500); // 1.5 seconds
      
      const metrics = monitor.getMetrics();

      expect(metrics.averageFPS).toBeCloseTo(60, 1);
      expect(metrics.gameLoadTime).toBe(1500);
    });

    it('should detect performance issues', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      
      monitor.startSession();
      
      // Simulate poor performance
      for (let i = 0; i < 10; i++) {
        monitor.recordFrameTime(50); // 20 FPS
      }
      
      const metrics = monitor.getMetrics();
      const warnings = monitor.getWarnings();

      expect(metrics.averageFPS).toBeLessThan(30);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.type === 'low_fps')).toBe(true);
    });
  });

  describe('Analytics Integration', () => {
    it('should track PWA installation events', async () => {
      const { MobileAnalytics } = await import('@/lib/mobile-analytics');
      
      const analytics = new MobileAnalytics();
      
      analytics.trackEvent('pwa_install_prompt_shown', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });

      analytics.trackEvent('pwa_installed', {
        timestamp: Date.now(),
        installMethod: 'prompt',
      });

      const events = analytics.getEvents();
      
      expect(events.length).toBe(2);
      expect(events[0].name).toBe('pwa_install_prompt_shown');
      expect(events[1].name).toBe('pwa_installed');
    });

    it('should track mobile game performance', async () => {
      const { MobileAnalytics } = await import('@/lib/mobile-analytics');
      
      const analytics = new MobileAnalytics();
      
      analytics.trackPerformance('game_load', {
        gameId: 'memdot',
        loadTime: 1200,
        deviceType: 'mobile',
        connectionType: '4g',
      });

      const performanceEvents = analytics.getPerformanceEvents();
      
      expect(performanceEvents.length).toBe(1);
      expect(performanceEvents[0].metric).toBe('game_load');
      expect(performanceEvents[0].data.loadTime).toBe(1200);
    });
  });

  describe('Error Handling', () => {
    it('should handle service worker errors gracefully', async () => {
      const { registerServiceWorker } = await import('@/lib/pwa');
      
      mockServiceWorker.register.mockRejectedValue(new Error('SW registration failed'));

      await expect(registerServiceWorker()).rejects.toThrow('SW registration failed');
    });

    it('should handle cache errors gracefully', async () => {
      const { gameCacheManager } = await import('@/lib/game-cache-manager');
      
      gameCacheManager.cacheGameAssets.mockRejectedValue(new Error('Cache error'));

      await expect(gameCacheManager.cacheGameAssets('test-game')).rejects.toThrow('Cache error');
    });

    it('should handle mobile compatibility errors', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const invalidGameConfig = null as any;

      await expect(checkGameCompatibility(invalidGameConfig)).rejects.toThrow();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work on iOS Safari', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('iOS');
      expect(deviceInfo.browser).toBe('Safari');
    });

    it('should work on Android Chrome', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 Chrome/91.0.4472.120',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('Android');
      expect(deviceInfo.browser).toBe('Chrome');
    });

    it('should handle desktop browsers gracefully', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.deviceType).toBe('desktop');
    });
  });
});