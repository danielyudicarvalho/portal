/**
 * Tests for useMobilePerformance hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMobilePerformance, usePreloadProgress } from '../useMobilePerformance';

// Mock the mobile performance optimizer
jest.mock('../../lib/mobile-performance-optimizer', () => ({
  mobilePerformanceOptimizer: {
    optimizeGameForMobile: jest.fn().mockResolvedValue({
      success: true,
      recommendations: ['Test recommendation'],
      warnings: []
    }),
    stopOptimization: jest.fn().mockResolvedValue({
      success: true,
      metrics: {
        gameLoadTime: 2000,
        firstRenderTime: 500,
        averageFPS: 60,
        memoryUsage: 50,
        networkLatency: 100,
        cacheHitRate: 80
      },
      recommendations: [],
      warnings: []
    }),
    getPerformanceHistory: jest.fn().mockReturnValue([]),
    getOptimizationStatus: jest.fn().mockReturnValue(null)
  }
}));

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  configurable: true
});

Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  },
  configurable: true
});

Object.defineProperty(navigator, 'deviceMemory', {
  value: 4,
  configurable: true
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  value: 4,
  configurable: true
});

describe('useMobilePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true
    });
    
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      configurable: true
    });

    // Mock screen
    Object.defineProperty(screen, 'width', {
      value: 375,
      configurable: true
    });
    
    Object.defineProperty(screen, 'height', {
      value: 667,
      configurable: true
    });

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      configurable: true
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    expect(result.current.isOptimizing).toBe(false);
    expect(result.current.isOptimized).toBe(false);
    expect(result.current.metrics).toBeNull();
    expect(result.current.preloadProgress).toBeNull();
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.warnings).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should detect mobile device correctly', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    expect(result.current.isMobileDevice()).toBe(true);
    expect(result.current.shouldOptimize).toBe(true);
  });

  it('should start optimization when called', async () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    await act(async () => {
      await result.current.startOptimization();
    });

    expect(result.current.isOptimized).toBe(true);
    expect(result.current.recommendations).toContain('Test recommendation');
  });

  it('should auto-start optimization when enabled', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ 
        gameId: 'test-game',
        autoStart: true
      })
    );

    // Should start optimization automatically for mobile devices
    expect(result.current.shouldOptimize).toBe(true);
  });

  it('should stop optimization and get metrics', async () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    await act(async () => {
      await result.current.startOptimization();
      await result.current.stopOptimization();
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.averageFPS).toBe(60);
  });

  it('should get performance history', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    const history = result.current.getPerformanceHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should get network information', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    const networkInfo = result.current.getNetworkInfo();
    
    expect(networkInfo).toMatchObject({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    });
  });

  it('should get device capabilities', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    const capabilities = result.current.getDeviceCapabilities();
    
    expect(capabilities).toMatchObject({
      memory: 4,
      cores: 4,
      pixelRatio: 2,
      screenSize: {
        width: 375,
        height: 667
      }
    });
  });

  it('should handle optimization errors', async () => {
    // Mock optimizer to throw error
    const { mobilePerformanceOptimizer } = require('../../lib/mobile-performance-optimizer');
    mobilePerformanceOptimizer.optimizeGameForMobile.mockRejectedValueOnce(
      new Error('Optimization failed')
    );

    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    await act(async () => {
      await result.current.startOptimization();
    });

    expect(result.current.error).toBe('Optimization failed');
    expect(result.current.isOptimized).toBe(false);
  });

  it('should support different optimization strategies', () => {
    const { result: aggressive } = renderHook(() => 
      useMobilePerformance({ 
        gameId: 'test-game',
        strategy: 'aggressive'
      })
    );

    const { result: conservative } = renderHook(() => 
      useMobilePerformance({ 
        gameId: 'test-game',
        strategy: 'conservative'
      })
    );

    const { result: adaptive } = renderHook(() => 
      useMobilePerformance({ 
        gameId: 'test-game',
        strategy: 'adaptive'
      })
    );

    // All should initialize properly with different strategies
    expect(aggressive.current.shouldOptimize).toBe(true);
    expect(conservative.current.shouldOptimize).toBe(true);
    expect(adaptive.current.shouldOptimize).toBe(true);
  });

  it('should check if performance API is supported', () => {
    const { result } = renderHook(() => 
      useMobilePerformance({ gameId: 'test-game' })
    );

    expect(result.current.isSupported).toBe(true);
  });
});

describe('usePreloadProgress', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    window.removeEventListener('gamePreloadProgress', jest.fn());
  });

  it('should initialize with null progress', () => {
    const { result } = renderHook(() => 
      usePreloadProgress('test-game')
    );

    expect(result.current).toBeNull();
  });

  it('should update progress when event is fired', () => {
    const { result } = renderHook(() => 
      usePreloadProgress('test-game')
    );

    const progressData = {
      loaded: 5,
      total: 10,
      percentage: 50,
      currentAsset: '/test-asset.png'
    };

    act(() => {
      const event = new CustomEvent('gamePreloadProgress', {
        detail: {
          gameId: 'test-game',
          progress: progressData
        }
      });
      window.dispatchEvent(event);
    });

    expect(result.current).toEqual(progressData);
  });

  it('should ignore events for different games', () => {
    const { result } = renderHook(() => 
      usePreloadProgress('test-game')
    );

    act(() => {
      const event = new CustomEvent('gamePreloadProgress', {
        detail: {
          gameId: 'other-game',
          progress: { loaded: 1, total: 1, percentage: 100 }
        }
      });
      window.dispatchEvent(event);
    });

    expect(result.current).toBeNull();
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => 
      usePreloadProgress('test-game')
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'gamePreloadProgress',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});