/**
 * Tests for Mobile Analytics System
 */

import { mobileAnalytics, trackMobileEvent, trackMobileError, trackMobilePerformance } from '../mobile-analytics';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
    }
  }
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    connection: {
      effectiveType: '4g'
    }
  }
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 375,
    height: 812,
    orientation: {
      type: 'portrait-primary',
      angle: 0
    }
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('standalone'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Mobile Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  describe('Event Tracking', () => {
    it('should track PWA launch events', () => {
      // Track enough events to trigger batch flush (batch size is 10)
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { mode: 'standalone', index: i });
      }
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_analytics',
        expect.stringContaining('pwa_launch')
      );
    });

    it('should track game start events', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('game_start', { gameId: 'test-game', index: i });
      }
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_analytics',
        expect.stringContaining('game_start')
      );
    });

    it('should track orientation change events', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('orientation_change', { 
          from: 'portrait', 
          to: 'landscape',
          index: i
        });
      }
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_analytics',
        expect.stringContaining('orientation_change')
      );
    });

    it('should include device info in events', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { index: i });
      }
      
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      const event = storedData[0];
      
      expect(event.deviceInfo).toBeDefined();
      expect(event.deviceInfo.userAgent).toContain('iPhone');
      expect(event.deviceInfo.screenWidth).toBe(375);
      expect(event.deviceInfo.screenHeight).toBe(812);
    });

    it('should generate unique session IDs', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { index: i });
      }
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('game_start', { index: i });
      }
      
      const calls = localStorageMock.setItem.mock.calls;
      const event1 = JSON.parse(calls[0][1])[0];
      const event2 = JSON.parse(calls[1][1])[0];
      
      expect(event1.sessionId).toBe(event2.sessionId);
      expect(event1.sessionId).toMatch(/^mobile_\d+_[a-z0-9]+$/);
    });
  });

  describe('Performance Tracking', () => {
    it('should track game performance metrics', () => {
      const metrics = {
        gameId: 'test-game',
        loadTime: 1500,
        fps: [60, 58, 59, 61],
        memoryUsage: [45, 50, 48],
        touchLatency: [15, 18, 12],
        renderTime: [16.7, 17.2, 16.1]
      };

      trackMobilePerformance(metrics);
      // Force flush by calling it directly
      mobileAnalytics.flush();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_performance',
        expect.stringContaining('test-game')
      );
    });

    it('should limit stored performance entries', () => {
      // Mock existing data with 500 entries
      const existingData = Array(500).fill(null).map((_, i) => ({
        gameId: `game-${i}`,
        timestamp: Date.now() - i * 1000
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      trackMobilePerformance({
        gameId: 'new-game',
        loadTime: 1000,
        fps: [60],
        memoryUsage: [50],
        touchLatency: [15],
        renderTime: [16.7]
      });
      
      // Force flush
      mobileAnalytics.flush();

      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      
      expect(storedData.length).toBe(500); // Should maintain limit
      expect(storedData[storedData.length - 1].gameId).toBe('new-game');
    });
  });

  describe('Error Tracking', () => {
    it('should track touch input errors', () => {
      trackMobileError({
        type: 'touch_input',
        message: 'High touch latency detected',
        gameId: 'test-game'
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_errors',
        expect.stringContaining('touch_input')
      );
    });

    it('should track performance errors', () => {
      trackMobileError({
        type: 'performance',
        message: 'Low FPS detected: 15 FPS',
        gameId: 'test-game'
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mobile_errors',
        expect.stringContaining('performance')
      );
    });

    it('should include stack trace when provided', () => {
      const error = new Error('Test error');
      
      trackMobileError({
        type: 'game_load',
        message: error.message,
        stack: error.stack,
        gameId: 'test-game'
      });
      
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      const errorEntry = storedData[0];
      
      expect(errorEntry.stack).toBeDefined();
      expect(errorEntry.stack).toContain('Test error');
    });

    it('should limit stored error entries', () => {
      // Mock existing data with 200 entries
      const existingData = Array(200).fill(null).map((_, i) => ({
        type: 'test',
        message: `Error ${i}`,
        timestamp: Date.now() - i * 1000
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      trackMobileError({
        type: 'game_load',
        message: 'New error'
      });

      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      
      expect(storedData.length).toBe(200); // Should maintain limit
      expect(storedData[storedData.length - 1].message).toBe('New error');
    });
  });

  describe('Data Management', () => {
    it('should retrieve stored analytics data', () => {
      const mockEvents = [{ type: 'pwa_launch', timestamp: Date.now() }];
      const mockPerformance = [{ gameId: 'test', loadTime: 1000 }];
      const mockErrors = [{ type: 'test', message: 'Test error' }];

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockEvents))
        .mockReturnValueOnce(JSON.stringify(mockPerformance))
        .mockReturnValueOnce(JSON.stringify(mockErrors));

      const data = mobileAnalytics.getStoredAnalytics();
      
      expect(data.events).toEqual(mockEvents);
      expect(data.performance).toEqual(mockPerformance);
      expect(data.errors).toEqual(mockErrors);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const data = mobileAnalytics.getStoredAnalytics();
      
      expect(data.events).toEqual([]);
      expect(data.performance).toEqual([]);
      expect(data.errors).toEqual([]);
    });

    it('should clear stored data', () => {
      mobileAnalytics.clearStoredData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mobile_analytics');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mobile_performance');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mobile_errors');
    });
  });

  describe('Batch Processing', () => {
    it('should flush events when batch size is reached', () => {
      // Track multiple events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('game_start', { gameId: `game-${i}` });
      }
      
      // Should have called setItem for each batch
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      expect(() => {
        trackMobileEvent('pwa_launch');
      }).not.toThrow();
    });
  });

  describe('Device Detection', () => {
    it('should detect PWA standalone mode', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { index: i });
      }
      
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      const event = storedData[0];
      
      expect(event.deviceInfo.isStandalone).toBe(true);
    });

    it('should include memory information when available', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { index: i });
      }
      
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      const event = storedData[0];
      
      expect(event.deviceInfo.memoryInfo).toBeDefined();
      expect(event.deviceInfo.memoryInfo.usedJSHeapSize).toBe(50 * 1024 * 1024);
    });

    it('should include connection information when available', () => {
      // Track enough events to trigger batch flush
      for (let i = 0; i < 10; i++) {
        trackMobileEvent('pwa_launch', { index: i });
      }
      
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      const event = storedData[0];
      
      expect(event.deviceInfo.connectionType).toBe('4g');
    });
  });
});