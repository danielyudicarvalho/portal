import {
  detectDevice,
  needsTouchAdaptation,
  getGameAdaptationConfig,
  createGameConfig,
  meetsMinimumRequirements,
  getTouchControlStyles
} from '../mobile-detection';

// Mock navigator and window properties

const mockScreen = { width: 1024, height: 768 };

// Setup global mocks
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: ''
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0
});

Object.defineProperty(window, 'screen', {
  writable: true,
  value: mockScreen
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 768
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1
});

describe('mobile-detection', () => {
  beforeEach(() => {
    // Reset mocks
    (navigator as any).userAgent = '';
    (navigator as any).maxTouchPoints = 0;
    mockScreen.width = 1024;
    mockScreen.height = 768;
    (window as any).innerWidth = 1024;
    (window as any).innerHeight = 768;
    (window as any).devicePixelRatio = 1;
    delete (window as any).ontouchstart;
  });

  describe('detectDevice', () => {
    it('should detect mobile devices from user agent', () => {
      (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      (window as any).ontouchstart = null;

      const device = detectDevice();

      expect(device.isMobile).toBe(true);
      expect(device.isTouch).toBe(true);
      expect(device.platform).toBe('ios');
    });

    it('should detect Android devices', () => {
      (navigator as any).userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      (window as any).ontouchstart = null;

      const device = detectDevice();

      expect(device.isMobile).toBe(true);
      expect(device.platform).toBe('android');
    });

    it('should detect tablets', () => {
      (navigator as any).userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      mockScreen.width = 768;
      mockScreen.height = 1024;
      (window as any).ontouchstart = null;

      const device = detectDevice();

      expect(device.isTablet).toBe(true);
      expect(device.isTouch).toBe(true);
    });

    it('should detect desktop devices', () => {
      (navigator as any).userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      mockScreen.width = 1920;
      mockScreen.height = 1080;

      const device = detectDevice();

      expect(device.isMobile).toBe(false);
      expect(device.isTablet).toBe(false);
      expect(device.isTouch).toBe(false);
      expect(device.platform).toBe('windows');
    });

    it('should detect touch capability', () => {
      (navigator as any).maxTouchPoints = 5;
      (window as any).ontouchstart = null;

      const device = detectDevice();

      expect(device.isTouch).toBe(true);
    });

    it('should detect orientation correctly', () => {
      // Portrait
      mockScreen.width = 375;
      mockScreen.height = 667;
      let device = detectDevice();
      expect(device.orientation).toBe('portrait');

      // Landscape
      mockScreen.width = 667;
      mockScreen.height = 375;
      device = detectDevice();
      expect(device.orientation).toBe('landscape');
    });

    it('should detect pixel ratio', () => {
      (window as any).devicePixelRatio = 2;

      const device = detectDevice();

      expect(device.pixelRatio).toBe(2);
    });
  });

  describe('needsTouchAdaptation', () => {
    it('should return true for mobile devices', () => {
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 375, height: 667 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      expect(needsTouchAdaptation('test-game', deviceInfo)).toBe(true);
    });

    it('should return true for tablets', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: true,
        isTouch: true,
        screenSize: { width: 768, height: 1024 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      expect(needsTouchAdaptation('test-game', deviceInfo)).toBe(true);
    });

    it('should return true for touch-capable devices', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 1920, height: 1080 },
        orientation: 'landscape' as const,
        pixelRatio: 1,
        platform: 'windows'
      };

      expect(needsTouchAdaptation('test-game', deviceInfo)).toBe(true);
    });

    it('should return false for non-touch desktop devices', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: false,
        isTouch: false,
        screenSize: { width: 1920, height: 1080 },
        orientation: 'landscape' as const,
        pixelRatio: 1,
        platform: 'windows'
      };

      expect(needsTouchAdaptation('test-game', deviceInfo)).toBe(false);
    });
  });

  describe('getGameAdaptationConfig', () => {
    const mobileDevice = {
      isMobile: true,
      isTablet: false,
      isTouch: true,
      screenSize: { width: 375, height: 667 },
      orientation: 'portrait' as const,
      pixelRatio: 2,
      platform: 'ios'
    };

    it('should return specific config for box-jump game', () => {
      const config = getGameAdaptationConfig('box-jump', mobileDevice);

      expect(config.needsTouchControls).toBe(true);
      expect(config.recommendedControls).toHaveLength(1);
      expect(config.recommendedControls[0].type).toBe('button');
      expect(config.recommendedControls[0].action).toBe('JUMP');
      expect(config.preferredOrientation).toBe('landscape');
    });

    it('should return specific config for doodle-jump game', () => {
      const config = getGameAdaptationConfig('doodle-jump', mobileDevice);

      expect(config.recommendedControls).toHaveLength(1);
      expect(config.recommendedControls[0].type).toBe('joystick');
      expect(config.preferredOrientation).toBe('portrait');
    });

    it('should return specific config for boom-dots game', () => {
      const config = getGameAdaptationConfig('boom-dots', mobileDevice);

      expect(config.recommendedControls).toHaveLength(2);
      expect(config.recommendedControls[0].type).toBe('joystick');
      expect(config.recommendedControls[1].type).toBe('button');
      expect(config.preferredOrientation).toBe('landscape');
    });

    it('should return generic config for unknown games', () => {
      const config = getGameAdaptationConfig('unknown-game', mobileDevice);

      expect(config.recommendedControls).toHaveLength(2);
      expect(config.recommendedControls[0].type).toBe('joystick');
      expect(config.recommendedControls[1].type).toBe('button');
    });

    it('should return swipe config for fill-the-holes game', () => {
      const config = getGameAdaptationConfig('fill-the-holes', mobileDevice);

      expect(config.recommendedControls).toHaveLength(1);
      expect(config.recommendedControls[0].type).toBe('swipe');
      expect(config.viewportOptimization).toBe('fill');
    });

    it('should return tap config for simple games', () => {
      const config = getGameAdaptationConfig('circle-path', mobileDevice);

      expect(config.recommendedControls).toHaveLength(1);
      expect(config.recommendedControls[0].type).toBe('tap');
      expect(config.preferredOrientation).toBe('portrait');
    });
  });

  describe('createGameConfig', () => {
    it('should create complete game config from adaptation config', () => {
      const adaptationConfig = {
        needsTouchControls: true,
        recommendedControls: [{
          type: 'button' as const,
          position: { x: 100, y: 100 },
          size: { width: 80, height: 80 },
          keyMapping: ['Space'],
          action: 'JUMP'
        }],
        viewportOptimization: 'fit' as const,
        preferredOrientation: 'landscape' as const
      };

      const gameConfig = createGameConfig('test-game', adaptationConfig, 800, 600);

      expect(gameConfig.width).toBe(800);
      expect(gameConfig.height).toBe(600);
      expect(gameConfig.scaleMode).toBe('fit');
      expect(gameConfig.touchControls).toEqual(adaptationConfig.recommendedControls);
      expect(gameConfig.preferredOrientation).toBe('landscape');
      expect(gameConfig.minScreenSize).toEqual({ width: 320, height: 480 });
    });

    it('should use default dimensions if not provided', () => {
      const adaptationConfig = {
        needsTouchControls: true,
        recommendedControls: [],
        viewportOptimization: 'fit' as const,
        preferredOrientation: 'any' as const
      };

      const gameConfig = createGameConfig('test-game', adaptationConfig);

      expect(gameConfig.width).toBe(800);
      expect(gameConfig.height).toBe(600);
    });
  });

  describe('meetsMinimumRequirements', () => {
    it('should return true if no minimum requirements specified', () => {
      const gameConfig = {
        width: 800,
        height: 600,
        scaleMode: 'fit' as const,
        touchControls: []
      };

      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 320, height: 480 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      expect(meetsMinimumRequirements(gameConfig, deviceInfo)).toBe(true);
    });

    it('should return true if device meets minimum requirements', () => {
      const gameConfig = {
        width: 800,
        height: 600,
        scaleMode: 'fit' as const,
        touchControls: [],
        minScreenSize: { width: 320, height: 480 }
      };

      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 375, height: 667 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      expect(meetsMinimumRequirements(gameConfig, deviceInfo)).toBe(true);
    });

    it('should return false if device does not meet minimum requirements', () => {
      const gameConfig = {
        width: 800,
        height: 600,
        scaleMode: 'fit' as const,
        touchControls: [],
        minScreenSize: { width: 768, height: 1024 }
      };

      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 320, height: 480 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      expect(meetsMinimumRequirements(gameConfig, deviceInfo)).toBe(false);
    });
  });

  describe('getTouchControlStyles', () => {
    it('should return appropriate styles for mobile devices', () => {
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 375, height: 667 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      const styles = getTouchControlStyles(deviceInfo);

      expect(styles).toContain('min-width: 60px');
      expect(styles).toContain('min-height: 60px');
      expect(styles).toContain('rgba(255, 255, 255, 0.3)'); // iOS opacity
    });

    it('should return appropriate styles for tablets', () => {
      const deviceInfo = {
        isMobile: false,
        isTablet: true,
        isTouch: true,
        screenSize: { width: 768, height: 1024 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'android'
      };

      const styles = getTouchControlStyles(deviceInfo);

      expect(styles).toContain('min-width: 80px');
      expect(styles).toContain('min-height: 80px');
      expect(styles).toContain('rgba(255, 255, 255, 0.2)'); // Android opacity
    });

    it('should include touch control styling', () => {
      const deviceInfo = {
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 375, height: 667 },
        orientation: 'portrait' as const,
        pixelRatio: 2,
        platform: 'ios'
      };

      const styles = getTouchControlStyles(deviceInfo);

      expect(styles).toContain('.touch-control');
      expect(styles).toContain('.touch-control:active');
      expect(styles).toContain('.joystick-knob');
      expect(styles).toContain('backdrop-filter: blur(4px)');
    });
  });
});