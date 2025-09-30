/**
 * Mobile Compatibility Tests
 * 
 * Tests for mobile device compatibility and adaptation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Mobile Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect iOS devices correctly', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('iOS');
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.touchSupport).toBe(true);
    });

    it('should detect Android devices correctly', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.platform).toBe('Android');
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.touchSupport).toBe(true);
    });

    it('should detect tablet devices', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.deviceType).toBe('tablet');
      expect(deviceInfo.platform).toBe('iOS');
      expect(deviceInfo.isMobile).toBe(true);
    });

    it('should handle desktop browsers', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.deviceType).toBe('desktop');
      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.touchSupport).toBe(false);
    });
  });

  describe('Screen Size Adaptation', () => {
    it('should adapt to small screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 320, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 568, writable: true });

      const { getOptimalGameSize } = await import('@/lib/mobile-game-compatibility');
      const gameSize = getOptimalGameSize({
        originalWidth: 800,
        originalHeight: 600,
        minWidth: 320,
        minHeight: 240,
      });

      expect(gameSize.width).toBeLessThanOrEqual(320);
      expect(gameSize.height).toBeLessThanOrEqual(568);
      expect(gameSize.scale).toBeLessThan(1);
    });

    it('should maintain aspect ratio when scaling', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const { getOptimalGameSize } = await import('@/lib/mobile-game-compatibility');
      const gameSize = getOptimalGameSize({
        originalWidth: 800,
        originalHeight: 600,
        maintainAspectRatio: true,
      });

      const originalRatio = 800 / 600;
      const scaledRatio = gameSize.width / gameSize.height;
      
      expect(Math.abs(originalRatio - scaledRatio)).toBeLessThan(0.01);
    });

    it('should handle orientation changes', async () => {
      const { OrientationManager } = await import('@/lib/orientation-manager');
      
      const orientationManager = new OrientationManager();
      
      // Portrait
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
      
      orientationManager.handleOrientationChange();
      expect(orientationManager.getCurrentOrientation()).toBe('portrait');

      // Landscape
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
      
      orientationManager.handleOrientationChange();
      expect(orientationManager.getCurrentOrientation()).toBe('landscape');
    });
  });

  describe('Touch Input Compatibility', () => {
    it('should detect touch support', async () => {
      Object.defineProperty(window, 'ontouchstart', { value: null, writable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, writable: true });

      const { detectDevice } = await import('@/lib/mobile-detection');
      const deviceInfo = detectDevice();

      expect(deviceInfo.touchSupport).toBe(true);
      expect(deviceInfo.maxTouchPoints).toBe(5);
    });

    it('should adapt keyboard controls to touch', async () => {
      const { TouchInputAdapter } = await import('@/lib/touch-input-adapter');
      
      const adapter = new TouchInputAdapter();
      const mockGameElement = document.createElement('div');
      
      const touchControls = adapter.adaptKeyboardControls(mockGameElement, {
        'Space': { label: 'Jump', position: { x: 50, y: 500 } },
        'ArrowLeft': { label: 'Left', position: { x: 100, y: 550 } },
        'ArrowRight': { label: 'Right', position: { x: 200, y: 550 } },
      });

      expect(touchControls.length).toBe(3);
      expect(touchControls[0].keyMapping).toContain('Space');
      expect(touchControls[0].label).toBe('Jump');
    });

    it('should handle multi-touch gestures', async () => {
      const { TouchInputAdapter } = await import('@/lib/touch-input-adapter');
      
      const adapter = new TouchInputAdapter();
      const mockElement = document.createElement('div');
      
      adapter.enableGestureRecognition(mockElement);

      // Simulate pinch gesture
      const touch1 = { identifier: 1, clientX: 100, clientY: 100 };
      const touch2 = { identifier: 2, clientX: 200, clientY: 200 };
      
      const gestureData = adapter.processMultiTouch([touch1, touch2]);
      
      expect(gestureData.type).toBe('pinch');
      expect(gestureData.distance).toBeGreaterThan(0);
    });
  });

  describe('Game Compatibility Checking', () => {
    it('should check basic game compatibility', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'simple-game',
        requiresKeyboard: false,
        supportsTouch: true,
        minScreenSize: { width: 320, height: 240 },
        maxScreenSize: { width: 1920, height: 1080 },
      };

      const compatibility = await checkGameCompatibility(gameConfig);

      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.adaptationsNeeded).toBeDefined();
      expect(compatibility.warnings).toBeDefined();
    });

    it('should identify incompatible games', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'complex-game',
        requiresKeyboard: true,
        supportsTouch: false,
        minScreenSize: { width: 1024, height: 768 },
        requiresMouseHover: true,
      };

      const compatibility = await checkGameCompatibility(gameConfig);

      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.issues.length).toBeGreaterThan(0);
      expect(compatibility.fallbackOptions).toBeDefined();
    });

    it('should suggest adaptations for partially compatible games', async () => {
      const { checkGameCompatibility } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'adaptable-game',
        requiresKeyboard: true,
        supportsTouch: true,
        minScreenSize: { width: 480, height: 320 },
      };

      const compatibility = await checkGameCompatibility(gameConfig);

      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.adaptationsNeeded.length).toBeGreaterThan(0);
      expect(compatibility.adaptationsNeeded.some(a => 
        a.includes('touch controls')
      )).toBe(true);
    });
  });

  describe('Performance Compatibility', () => {
    it('should check device performance capabilities', async () => {
      const { checkDeviceCapabilities } = await import('@/lib/mobile-game-compatibility');
      
      // Mock device capabilities
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4, writable: true });
      Object.defineProperty(performance, 'memory', {
        value: { jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 }, // 2GB
        writable: true,
      });

      const capabilities = await checkDeviceCapabilities();

      expect(capabilities.cpuCores).toBe(4);
      expect(capabilities.memoryLimit).toBe(2 * 1024 * 1024 * 1024);
      expect(capabilities.performanceClass).toBeDefined();
    });

    it('should recommend performance settings', async () => {
      const { getRecommendedSettings } = await import('@/lib/mobile-game-compatibility');
      
      const gameConfig = {
        id: 'performance-heavy-game',
        minCpuCores: 2,
        minMemory: 1024 * 1024 * 1024, // 1GB
        graphicsIntensive: true,
      };

      const settings = await getRecommendedSettings(gameConfig);

      expect(settings.quality).toBeDefined();
      expect(settings.frameRate).toBeDefined();
      expect(settings.effects).toBeDefined();
    });
  });

  describe('Browser Compatibility', () => {
    it('should check WebGL support', async () => {
      const { checkWebGLSupport } = await import('@/lib/mobile-game-compatibility');
      
      // Mock WebGL context
      const mockCanvas = document.createElement('canvas');
      const mockContext = {
        getParameter: vi.fn((param) => {
          if (param === 0x1F00) return 'Mock WebGL Renderer'; // GL_VENDOR
          if (param === 0x1F01) return 'Mock GPU'; // GL_RENDERER
          return null;
        }),
        getExtension: vi.fn(() => null),
      };

      mockCanvas.getContext = vi.fn(() => mockContext);
      document.createElement = vi.fn(() => mockCanvas);

      const webglSupport = await checkWebGLSupport();

      expect(webglSupport.supported).toBe(true);
      expect(webglSupport.version).toBeDefined();
      expect(webglSupport.renderer).toBe('Mock GPU');
    });

    it('should check audio support', async () => {
      const { checkAudioSupport } = await import('@/lib/mobile-game-compatibility');
      
      // Mock Audio API
      global.Audio = jest.fn().mockImplementation(() => ({
        canPlayType: jest.fn((type) => {
          if (type.includes('mp3')) return 'probably';
          if (type.includes('ogg')) return 'maybe';
          return '';
        }),
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
      }));

      const audioSupport = await checkAudioSupport();

      expect(audioSupport.supported).toBe(true);
      expect(audioSupport.formats.mp3).toBe('probably');
      expect(audioSupport.formats.ogg).toBe('maybe');
    });

    it('should check fullscreen API support', async () => {
      const { checkFullscreenSupport } = await import('@/lib/mobile-game-compatibility');
      
      // Mock fullscreen API
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: jest.fn(),
        writable: true,
      });

      const fullscreenSupport = await checkFullscreenSupport();

      expect(fullscreenSupport.supported).toBe(true);
      expect(fullscreenSupport.method).toBe('requestFullscreen');
    });
  });

  describe('Network Compatibility', () => {
    it('should adapt to slow network conditions', async () => {
      const { NetworkAwareLoader } = await import('@/lib/mobile-game-compatibility');
      
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
        },
        writable: true,
      });

      const loader = new NetworkAwareLoader();
      const loadingStrategy = loader.getOptimalLoadingStrategy();

      expect(loadingStrategy.preloadAssets).toBe(false);
      expect(loadingStrategy.compressionLevel).toBe('high');
      expect(loadingStrategy.qualityLevel).toBe('low');
    });

    it('should optimize for fast networks', async () => {
      const { NetworkAwareLoader } = await import('@/lib/mobile-game-compatibility');
      
      // Mock fast network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
        },
        writable: true,
      });

      const loader = new NetworkAwareLoader();
      const loadingStrategy = loader.getOptimalLoadingStrategy();

      expect(loadingStrategy.preloadAssets).toBe(true);
      expect(loadingStrategy.compressionLevel).toBe('low');
      expect(loadingStrategy.qualityLevel).toBe('high');
    });
  });

  describe('Accessibility Compatibility', () => {
    it('should ensure touch targets are accessible', async () => {
      const { validateTouchTargets } = await import('@/lib/mobile-game-compatibility');
      
      const touchControls = [
        { size: { width: 44, height: 44 }, position: { x: 50, y: 500 } },
        { size: { width: 30, height: 30 }, position: { x: 100, y: 500 } }, // Too small
        { size: { width: 48, height: 48 }, position: { x: 52, y: 502 } }, // Too close
      ];

      const validation = validateTouchTargets(touchControls);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBe(2);
      expect(validation.issues.some(i => i.includes('too small'))).toBe(true);
      expect(validation.issues.some(i => i.includes('too close'))).toBe(true);
    });

    it('should check color contrast for mobile displays', async () => {
      const { checkColorContrast } = await import('@/lib/mobile-game-compatibility');
      
      const colorScheme = {
        background: '#000000',
        text: '#ffffff',
        primary: '#007bff',
        secondary: '#6c757d',
      };

      const contrastCheck = checkColorContrast(colorScheme);

      expect(contrastCheck.textContrast).toBeGreaterThan(4.5); // WCAG AA
      expect(contrastCheck.primaryContrast).toBeGreaterThan(3); // WCAG AA Large
    });
  });
});