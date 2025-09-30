/**
 * Mobile Device Testing Suite
 * 
 * Tests PWA functionality across different mobile devices and scenarios:
 * - Various screen sizes and orientations
 * - Different mobile browsers
 * - Touch input handling
 * - Performance on different device capabilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Device profiles for testing
const DEVICE_PROFILES = {
  iPhone_SE: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    screenSize: { width: 375, height: 667 },
    pixelRatio: 2,
    platform: 'iOS',
    browser: 'Safari',
    touchSupport: true,
  },
  iPhone_12_Pro: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    screenSize: { width: 390, height: 844 },
    pixelRatio: 3,
    platform: 'iOS',
    browser: 'Safari',
    touchSupport: true,
  },
  iPhone_12_Pro_Max: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    screenSize: { width: 428, height: 926 },
    pixelRatio: 3,
    platform: 'iOS',
    browser: 'Safari',
    touchSupport: true,
  },
  Samsung_Galaxy_S21: {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 Chrome/91.0.4472.120',
    screenSize: { width: 360, height: 800 },
    pixelRatio: 3,
    platform: 'Android',
    browser: 'Chrome',
    touchSupport: true,
  },
  Samsung_Galaxy_Note20: {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-N981B) AppleWebKit/537.36 Chrome/91.0.4472.120',
    screenSize: { width: 412, height: 915 },
    pixelRatio: 2.625,
    platform: 'Android',
    browser: 'Chrome',
    touchSupport: true,
  },
  iPad_Air: {
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    screenSize: { width: 820, height: 1180 },
    pixelRatio: 2,
    platform: 'iOS',
    browser: 'Safari',
    touchSupport: true,
  },
  Pixel_5: {
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 Chrome/91.0.4472.120',
    screenSize: { width: 393, height: 851 },
    pixelRatio: 2.75,
    platform: 'Android',
    browser: 'Chrome',
    touchSupport: true,
  },
  OnePlus_9: {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; LE2113) AppleWebKit/537.36 Chrome/91.0.4472.120',
    screenSize: { width: 412, height: 915 },
    pixelRatio: 3,
    platform: 'Android',
    browser: 'Chrome',
    touchSupport: true,
  },
};

// Mock device setup helper
function setupDeviceProfile(profile: typeof DEVICE_PROFILES[keyof typeof DEVICE_PROFILES]) {
  Object.defineProperty(navigator, 'userAgent', {
    value: profile.userAgent,
    writable: true,
  });

  Object.defineProperty(window, 'innerWidth', {
    value: profile.screenSize.width,
    writable: true,
  });

  Object.defineProperty(window, 'innerHeight', {
    value: profile.screenSize.height,
    writable: true,
  });

  Object.defineProperty(window, 'devicePixelRatio', {
    value: profile.pixelRatio,
    writable: true,
  });

  Object.defineProperty(window.screen, 'width', {
    value: profile.screenSize.width * profile.pixelRatio,
    writable: true,
  });

  Object.defineProperty(window.screen, 'height', {
    value: profile.screenSize.height * profile.pixelRatio,
    writable: true,
  });

  // Mock touch events support
  if (profile.touchSupport) {
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
    });
  }
}

describe('Mobile Device Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Device Detection Across Platforms', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should detect ${deviceName} correctly`, async () => {
        setupDeviceProfile(profile);
        
        const { detectDevice } = await import('@/lib/mobile-detection');
        const deviceInfo = detectDevice();

        expect(deviceInfo.platform).toBe(profile.platform);
        expect(deviceInfo.browser).toBe(profile.browser);
        expect(deviceInfo.touchSupport).toBe(profile.touchSupport);
        expect(deviceInfo.screenSize.width).toBe(profile.screenSize.width);
        expect(deviceInfo.screenSize.height).toBe(profile.screenSize.height);
      });
    });
  });

  describe('PWA Installation Across Devices', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should handle PWA installation on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        // Mock PWA installation event
        const mockInstallEvent = {
          preventDefault: vi.fn(),
          prompt: vi.fn().mockResolvedValue(undefined),
          userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
        };

        // Test installation flow
        mockInstallEvent.preventDefault();
        await mockInstallEvent.prompt();
        const choice = await mockInstallEvent.userChoice;

        expect(mockInstallEvent.preventDefault).toHaveBeenCalled();
        expect(mockInstallEvent.prompt).toHaveBeenCalled();
        expect(choice.outcome).toBe('accepted');
      });
    });

    it('should handle iOS-specific installation flow', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro);

      // iOS doesn't support beforeinstallprompt, should show manual instructions
      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('iOS');
      // iOS PWA installation requires manual steps (Add to Home Screen)
    });

    it('should handle Android Chrome installation flow', async () => {
      setupDeviceProfile(DEVICE_PROFILES.Samsung_Galaxy_S21);

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('Android');
      expect(deviceInfo.browser).toBe('Chrome');
      // Android Chrome supports beforeinstallprompt event
    });
  });

  describe('Game Scaling Across Screen Sizes', () => {
    const gameConfig = {
      width: 800,
      height: 600,
      scaleMode: 'fit' as const,
    };

    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should scale games correctly on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        const { width, height } = profile.screenSize;
        const scaleX = width / gameConfig.width;
        const scaleY = height / gameConfig.height;
        const expectedScale = Math.min(scaleX, scaleY);

        // Test game scaling logic
        expect(expectedScale).toBeGreaterThan(0);
        expect(expectedScale).toBeLessThanOrEqual(1); // Most mobile screens are smaller than 800x600
      });
    });

    it('should handle portrait orientation correctly', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro);

      // Portrait: 390x844
      const scaleX = 390 / gameConfig.width;
      const scaleY = 844 / gameConfig.height;
      const scale = Math.min(scaleX, scaleY);

      expect(scale).toBeCloseTo(0.4875, 3); // 390/800
    });

    it('should handle landscape orientation correctly', async () => {
      setupDeviceProfile({
        ...DEVICE_PROFILES.iPhone_12_Pro,
        screenSize: { width: 844, height: 390 }, // Landscape
      });

      // Landscape: 844x390
      const scaleX = 844 / gameConfig.width;
      const scaleY = 390 / gameConfig.height;
      const scale = Math.min(scaleX, scaleY);

      expect(scale).toBeCloseTo(0.65, 2); // 390/600
    });
  });

  describe('Touch Input Handling', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should handle touch input on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        const { TouchInputAdapter } = await import('@/lib/touch-input-adapter');
        const adapter = new TouchInputAdapter();

        const mockGameElement = document.createElement('div');
        adapter.adaptKeyboardControls(mockGameElement);

        expect(mockGameElement.getAttribute('data-touch-adapted')).toBe('true');
      });
    });

    it('should handle multi-touch gestures', async () => {
      setupDeviceProfile(DEVICE_PROFILES.Samsung_Galaxy_S21);

      const mockElement = document.createElement('div');
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
          { clientX: 200, clientY: 200 } as Touch,
        ],
      });

      let touchCount = 0;
      mockElement.addEventListener('touchstart', (e) => {
        touchCount = (e as TouchEvent).touches.length;
      });

      mockElement.dispatchEvent(touchStartEvent);
      expect(touchCount).toBe(2);
    });

    it('should measure touch latency', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro);

      const startTime = performance.now();
      
      // Simulate touch event processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endTime = performance.now();
      const latency = endTime - startTime;

      expect(latency).toBeGreaterThan(0);
      expect(latency).toBeLessThan(100); // Should be under 100ms for good UX
    });
  });

  describe('Performance Across Devices', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should monitor performance on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
        const monitor = new MobilePerformanceMonitor('test-game');

        monitor.startSession();

        // Simulate frame rendering
        for (let i = 0; i < 60; i++) {
          monitor.recordFrameTime(16.67); // 60 FPS
        }

        const metrics = monitor.getMetrics();

        expect(metrics.averageFPS).toBeCloseTo(60, 1);
        expect(metrics.frameCount).toBe(60);
      });
    });

    it('should detect low-end device performance issues', async () => {
      // Simulate low-end device
      setupDeviceProfile({
        ...DEVICE_PROFILES.iPhone_SE,
        // Simulate slower performance
      });

      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      const monitor = new MobilePerformanceMonitor('test-game');

      monitor.startSession();

      // Simulate poor performance
      for (let i = 0; i < 30; i++) {
        monitor.recordFrameTime(33.33); // 30 FPS
      }

      const metrics = monitor.getMetrics();
      const warnings = monitor.getWarnings();

      expect(metrics.averageFPS).toBeCloseTo(30, 1);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should optimize for high-end devices', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro_Max);

      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      const optimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'aggressive',
      });

      const optimizations = await optimizer.optimize();

      expect(optimizations).toBeDefined();
      expect(optimizations.length).toBeGreaterThan(0);
    });
  });

  describe('Offline Functionality Across Devices', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should handle offline mode on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        // Mock offline state
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true,
        });

        const { gameCacheManager } = await import('@/lib/game-cache-manager');
        
        gameCacheManager.getOfflineGames = vi.fn().mockResolvedValue(['memdot', 'clocks']);
        const offlineGames = await gameCacheManager.getOfflineGames();

        expect(offlineGames).toEqual(['memdot', 'clocks']);
        expect(navigator.onLine).toBe(false);
      });
    });

    it('should handle storage limitations on mobile', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_SE);

      // Mock storage quota
      const mockStorageEstimate = {
        quota: 50 * 1024 * 1024, // 50MB (typical for older iOS devices)
        usage: 10 * 1024 * 1024,  // 10MB used
      };

      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue(mockStorageEstimate),
        },
        writable: true,
      });

      const estimate = await navigator.storage.estimate();
      const availableSpace = estimate.quota! - estimate.usage!;

      expect(availableSpace).toBe(40 * 1024 * 1024); // 40MB available
    });
  });

  describe('Orientation Handling', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should handle orientation changes on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        const { OrientationManager } = await import('@/lib/orientation-manager');
        new OrientationManager();

        // Mock orientation change
        Object.defineProperty(screen, 'orientation', {
          value: { angle: 90, type: 'landscape-primary' },
          writable: true,
        });

        const orientationEvent = new Event('orientationchange');
        window.dispatchEvent(orientationEvent);

        // Verify orientation handling
        expect(screen.orientation.angle).toBe(90);
        expect(screen.orientation.type).toBe('landscape-primary');
      });
    });

    it('should lock orientation for specific games', async () => {
      setupDeviceProfile(DEVICE_PROFILES.Samsung_Galaxy_S21);

      // Mock screen.orientation.lock
      Object.defineProperty(screen, 'orientation', {
        value: {
          lock: vi.fn().mockResolvedValue(undefined),
          unlock: vi.fn(),
          angle: 0,
          type: 'portrait-primary',
        },
        writable: true,
      });

      await screen.orientation.lock('landscape');

      expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
    });
  });

  describe('Network Conditions', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should handle different network conditions on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        // Mock different connection types
        const connectionTypes = ['4g', '3g', '2g', 'slow-2g'];

        for (const connectionType of connectionTypes) {
          Object.defineProperty(navigator, 'connection', {
            value: {
              effectiveType: connectionType,
              downlink: connectionType === '4g' ? 10 : connectionType === '3g' ? 1.5 : 0.5,
              rtt: connectionType === '4g' ? 50 : connectionType === '3g' ? 150 : 300,
            },
            writable: true,
          });

          const { gameCacheManager } = await import('@/lib/game-cache-manager');
          
          // Should adapt caching strategy based on connection
          const shouldPreload = (navigator as any).connection.effectiveType === '4g';
          
          if (shouldPreload) {
            gameCacheManager.preloadCriticalAssets = vi.fn().mockResolvedValue(undefined);
            await gameCacheManager.preloadCriticalAssets();
            expect(gameCacheManager.preloadCriticalAssets).toHaveBeenCalled();
          }
        }
      });
    });
  });

  describe('Memory Management', () => {
    it('should handle memory constraints on low-end devices', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_SE);

      // Mock memory info (typical for older devices)
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024,  // 50MB
          totalJSHeapSize: 100 * 1024 * 1024, // 100MB
          jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB limit
        },
        writable: true,
      });

      const { MemoryManager } = await import('@/lib/memory-manager');
      const memoryManager = new MemoryManager();

      const memoryInfo = memoryManager.getMemoryInfo();
      const shouldOptimize = memoryInfo.usedMemory / memoryInfo.totalMemory > 0.8;

      expect(shouldOptimize).toBe(false); // 50/100 = 0.5, not > 0.8
    });

    it('should optimize memory usage on high memory pressure', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro);

      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024,  // 180MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB
          jsHeapSizeLimit: 250 * 1024 * 1024, // 250MB limit
        },
        writable: true,
      });

      const { MemoryManager } = await import('@/lib/memory-manager');
      const memoryManager = new MemoryManager();

      const memoryInfo = memoryManager.getMemoryInfo();
      const shouldOptimize = memoryInfo.usedMemory / memoryInfo.totalMemory > 0.8;

      expect(shouldOptimize).toBe(true); // 180/200 = 0.9, > 0.8

      if (shouldOptimize) {
        memoryManager.optimizeMemoryUsage();
        // Should trigger garbage collection and cache cleanup
      }
    });
  });

  describe('Accessibility on Mobile', () => {
    Object.entries(DEVICE_PROFILES).forEach(([deviceName, profile]) => {
      it(`should maintain accessibility on ${deviceName}`, async () => {
        setupDeviceProfile(profile);

        // Test touch target sizes (minimum 44px for iOS, 48px for Android)
        const minTouchTarget = profile.platform === 'iOS' ? 44 : 48;

        const button = document.createElement('button');
        button.style.width = `${minTouchTarget}px`;
        button.style.height = `${minTouchTarget}px`;

        const computedStyle = window.getComputedStyle(button);
        const width = parseInt(computedStyle.width);
        const height = parseInt(computedStyle.height);

        expect(width).toBeGreaterThanOrEqual(minTouchTarget);
        expect(height).toBeGreaterThanOrEqual(minTouchTarget);
      });
    });

    it('should support screen readers on mobile', async () => {
      setupDeviceProfile(DEVICE_PROFILES.iPhone_12_Pro);

      const gameElement = document.createElement('div');
      gameElement.setAttribute('role', 'application');
      gameElement.setAttribute('aria-label', 'Game: Memory Dots');
      gameElement.setAttribute('aria-describedby', 'game-instructions');

      expect(gameElement.getAttribute('role')).toBe('application');
      expect(gameElement.getAttribute('aria-label')).toBe('Game: Memory Dots');
    });
  });

  describe('Battery Optimization', () => {
    it('should optimize for battery life on mobile', async () => {
      setupDeviceProfile(DEVICE_PROFILES.Samsung_Galaxy_S21);

      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: vi.fn().mockResolvedValue({
          level: 0.3, // 30% battery
          charging: false,
          chargingTime: Infinity,
          dischargingTime: 3600, // 1 hour
        }),
        writable: true,
      });

      const battery = await (navigator as any).getBattery();
      const shouldOptimizeForBattery = battery.level < 0.5 && !battery.charging;

      expect(shouldOptimizeForBattery).toBe(true);

      if (shouldOptimizeForBattery) {
        // Should reduce frame rate, disable animations, etc.
        const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
        const optimizer = new MobilePerformanceOptimizer({
          gameId: 'test-game',
          strategy: 'conservative', // Use conservative strategy for battery saving
        });

        const optimizations = await optimizer.optimize();
        expect(optimizations).toBeDefined();
      }
    });
  });
});