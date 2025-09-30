/**
 * Tests for performance monitor
 */

import { performanceMonitor, MOBILE_PERFORMANCE_THRESHOLDS, isPerformanceAcceptable } from '../performance-monitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024 // 100MB
  }
};

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
}

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    global.performance = mockPerformance as any;
    global.PerformanceObserver = MockPerformanceObserver as any;
    global.requestAnimationFrame = mockRequestAnimationFrame;
  });

  afterEach(() => {
    // Clean up any active monitoring
    performanceMonitor.stopMonitoring('test-game');
  });

  describe('startMonitoring', () => {
    it('should initialize metrics for a game', () => {
      performanceMonitor.startMonitoring('test-game');
      
      const metrics = performanceMonitor.getMetrics('test-game');
      expect(metrics).toBeDefined();
      expect(metrics?.gameLoadTime).toBe(0);
      expect(metrics?.averageFPS).toBe(0);
    });

    it('should start FPS monitoring', () => {
      performanceMonitor.startMonitoring('test-game');
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('stopMonitoring', () => {
    it('should return final metrics and clean up', () => {
      performanceMonitor.startMonitoring('test-game');
      
      const metrics = performanceMonitor.stopMonitoring('test-game');
      
      expect(metrics).toBeDefined();
      expect(performanceMonitor.getMetrics('test-game')).toBeNull();
    });

    it('should return null for non-existent game', () => {
      const metrics = performanceMonitor.stopMonitoring('non-existent');
      expect(metrics).toBeNull();
    });
  });

  describe('recordFirstRender', () => {
    it('should record first render time', () => {
      performanceMonitor.startMonitoring('test-game');
      performanceMonitor.recordFirstRender('test-game');
      
      const metrics = performanceMonitor.getMetrics('test-game');
      expect(metrics?.firstRenderTime).toBeGreaterThan(0);
    });

    it('should only record first render time once', () => {
      performanceMonitor.startMonitoring('test-game');
      performanceMonitor.recordFirstRender('test-game');
      
      const firstTime = performanceMonitor.getMetrics('test-game')?.firstRenderTime;
      
      performanceMonitor.recordFirstRender('test-game');
      const secondTime = performanceMonitor.getMetrics('test-game')?.firstRenderTime;
      
      expect(firstTime).toBe(secondTime);
    });
  });

  describe('measureNetworkLatency', () => {
    it('should measure network latency', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      });

      const latency = await performanceMonitor.measureNetworkLatency();
      
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(fetch).toHaveBeenCalledWith('/api/ping', { method: 'HEAD' });
    });

    it('should return -1 on network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const latency = await performanceMonitor.measureNetworkLatency();
      
      expect(latency).toBe(-1);
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information', () => {
      // Mock navigator
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      const deviceInfo = performanceMonitor.getDeviceInfo();
      
      expect(deviceInfo).toMatchObject({
        userAgent: expect.stringContaining('iPhone'),
        screenWidth: expect.any(Number),
        screenHeight: expect.any(Number),
        devicePixelRatio: expect.any(Number),
        connectionType: expect.any(String)
      });
    });
  });

  describe('exportPerformanceData', () => {
    it('should export performance data', () => {
      performanceMonitor.startMonitoring('test-game');
      
      const data = performanceMonitor.exportPerformanceData('test-game');
      
      expect(data).toMatchObject({
        gameId: 'test-game',
        deviceInfo: expect.any(Object),
        metrics: expect.any(Object),
        timestamp: expect.any(Number)
      });
    });

    it('should return null for non-existent game', () => {
      const data = performanceMonitor.exportPerformanceData('non-existent');
      expect(data).toBeNull();
    });
  });
});

describe('isPerformanceAcceptable', () => {
  it('should return true for good performance', () => {
    const goodMetrics = {
      gameLoadTime: 2000,
      firstRenderTime: 500,
      averageFPS: 60,
      memoryUsage: 50,
      networkLatency: 100,
      cacheHitRate: 80
    };

    expect(isPerformanceAcceptable(goodMetrics)).toBe(true);
  });

  it('should return false for poor performance', () => {
    const poorMetrics = {
      gameLoadTime: 5000, // Too slow
      firstRenderTime: 1000,
      averageFPS: 20, // Too low
      memoryUsage: 150, // Too high
      networkLatency: 500,
      cacheHitRate: 50 // Too low
    };

    expect(isPerformanceAcceptable(poorMetrics)).toBe(false);
  });

  it('should use performance thresholds correctly', () => {
    const borderlineMetrics = {
      gameLoadTime: MOBILE_PERFORMANCE_THRESHOLDS.MAX_LOAD_TIME,
      firstRenderTime: 500,
      averageFPS: MOBILE_PERFORMANCE_THRESHOLDS.MIN_FPS,
      memoryUsage: MOBILE_PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE,
      networkLatency: 100,
      cacheHitRate: MOBILE_PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE
    };

    expect(isPerformanceAcceptable(borderlineMetrics)).toBe(true);
  });
});