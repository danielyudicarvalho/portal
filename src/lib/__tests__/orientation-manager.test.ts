import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { OrientationManager, getOrientationManager } from '../orientation-manager';

// Mock DOM APIs
const mockScreen = {
  orientation: {
    angle: 0,
    lock: jest.fn(),
    unlock: jest.fn()
  }
};

const mockWindow = {
  innerWidth: 375,
  innerHeight: 667,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  orientation: 0
};

// Mock document
const mockDocument = {
  querySelector: jest.fn(),
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn()
  }
};

// Setup mocks
Object.defineProperty(global, 'screen', {
  value: mockScreen,
  writable: true,
  configurable: true
});

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
    configurable: true
  });
} else {
  Object.assign(global.window, mockWindow);
}

// Mock document methods
global.document = {
  ...global.document,
  querySelector: mockDocument.querySelector,
  createElement: mockDocument.createElement,
  head: mockDocument.head
} as any;

describe('OrientationManager', () => {
  let orientationManager: OrientationManager;
  let mockMetaElement: HTMLMetaElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock meta element
    mockMetaElement = {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0'
    } as HTMLMetaElement;
    
    mockDocument.querySelector.mockReturnValue(mockMetaElement);
    mockDocument.createElement.mockReturnValue(mockMetaElement);
    
    orientationManager = new OrientationManager();
  });

  afterEach(() => {
    orientationManager.destroy();
  });

  describe('initialization', () => {
    it('should initialize with correct orientation', () => {
      expect(orientationManager.getCurrentOrientation()).toBe('portrait');
      expect(orientationManager.isPortrait()).toBe(true);
      expect(orientationManager.isLandscape()).toBe(false);
    });

    it('should set up event listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should create viewport meta tag if not exists', () => {
      // Reset mocks
      jest.clearAllMocks();
      mockDocument.querySelector.mockReturnValue(null);
      
      new OrientationManager();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('meta');
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });
  });

  describe('orientation detection', () => {
    it('should detect landscape orientation', () => {
      // Mock landscape dimensions on global window
      Object.defineProperty(global.window, 'innerWidth', { value: 667, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 375, writable: true, configurable: true });
      
      const newManager = new OrientationManager();
      expect(newManager.getCurrentOrientation()).toBe('landscape');
      expect(newManager.isLandscape()).toBe(true);
      expect(newManager.isPortrait()).toBe(false);
      
      newManager.destroy();
      
      // Restore original dimensions
      Object.defineProperty(global.window, 'innerWidth', { value: 375, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 667, writable: true, configurable: true });
    });

    it('should detect portrait orientation', () => {
      // Already in portrait mode from setup
      const newManager = new OrientationManager();
      expect(newManager.getCurrentOrientation()).toBe('portrait');
      expect(newManager.isPortrait()).toBe(true);
      expect(newManager.isLandscape()).toBe(false);
      
      newManager.destroy();
    });
  });

  describe('orientation listeners', () => {
    it('should add and remove orientation listeners', () => {
      const listener = jest.fn();
      const unsubscribe = orientationManager.addOrientationListener(listener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Trigger orientation change
      const orientationChangeHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'orientationchange')?.[1];
      
      if (orientationChangeHandler) {
        // Mock landscape change
        Object.defineProperty(mockWindow, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(mockWindow, 'innerHeight', { value: 375, writable: true });
        
        orientationChangeHandler();
        
        setTimeout(() => {
          expect(listener).toHaveBeenCalledWith({
            orientation: 'landscape',
            angle: 0,
            width: 667,
            height: 375
          });
        }, 150);
      }
      
      // Unsubscribe
      unsubscribe();
    });
  });

  describe('viewport management', () => {
    it('should set viewport configuration', () => {
      const config = {
        scaleMode: 'fit' as const,
        minWidth: 320,
        maxWidth: 768
      };
      
      orientationManager.setViewportConfig(config);
      
      expect(mockMetaElement.content).toContain('width=device-width');
      expect(mockMetaElement.content).toContain('initial-scale=1.0');
    });

    it('should reset viewport to default', () => {
      orientationManager.resetViewport();
      
      expect(mockMetaElement.content).toBe('width=device-width, initial-scale=1.0');
    });

    it('should disable zoom for fit/fill scale modes', () => {
      const config = {
        scaleMode: 'fit' as const
      };
      
      orientationManager.setViewportConfig(config);
      
      expect(mockMetaElement.content).toContain('user-scalable=no');
    });
  });

  describe('orientation locking', () => {
    it('should lock orientation when supported', async () => {
      mockScreen.orientation.lock.mockResolvedValue(undefined);
      
      const result = await orientationManager.lockOrientation('landscape');
      
      expect(result).toBe(true);
      expect(mockScreen.orientation.lock).toHaveBeenCalledWith('landscape');
    });

    it('should handle lock failure gracefully', async () => {
      mockScreen.orientation.lock.mockRejectedValue(new Error('Not supported'));
      
      const result = await orientationManager.lockOrientation('landscape');
      
      expect(result).toBe(false);
    });

    it('should unlock orientation', () => {
      orientationManager.unlockOrientation();
      
      expect(mockScreen.orientation.unlock).toHaveBeenCalled();
    });

    it('should handle unlock when not supported', () => {
      const originalScreen = global.screen;
      (global as any).screen = {};
      
      expect(() => orientationManager.unlockOrientation()).not.toThrow();
      
      global.screen = originalScreen;
    });
  });

  describe('scale calculations', () => {
    it('should calculate fit scale factor', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: 400, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 600, writable: true, configurable: true });
      
      const scale = orientationManager.calculateScaleFactor(800, 600, 'fit');
      expect(scale).toBe(0.5); // min(400/800, 600/600) = min(0.5, 1) = 0.5
      
      // Restore original dimensions
      Object.defineProperty(global.window, 'innerWidth', { value: 375, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 667, writable: true, configurable: true });
    });

    it('should calculate fill scale factor', () => {
      Object.defineProperty(global.window, 'innerWidth', { value: 400, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 600, writable: true, configurable: true });
      
      const scale = orientationManager.calculateScaleFactor(800, 600, 'fill');
      expect(scale).toBe(1); // max(400/800, 600/600) = max(0.5, 1) = 1
      
      // Restore original dimensions
      Object.defineProperty(global.window, 'innerWidth', { value: 375, writable: true, configurable: true });
      Object.defineProperty(global.window, 'innerHeight', { value: 667, writable: true, configurable: true });
    });

    it('should return 1 for stretch mode', () => {
      const scale = orientationManager.calculateScaleFactor(800, 600, 'stretch');
      expect(scale).toBe(1);
    });
  });

  describe('optimal viewport', () => {
    it('should return current window dimensions', () => {
      const viewport = orientationManager.getOptimalViewport();
      
      expect(viewport).toEqual({
        width: global.window.innerWidth,
        height: global.window.innerHeight
      });
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      orientationManager.destroy();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getOrientationManager();
      const instance2 = getOrientationManager();
      
      expect(instance1).toBe(instance2);
    });
  });
});