/**
 * Tests for useMobileAnalytics hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMobileAnalytics, usePWAAnalytics } from '../useMobileAnalytics';

// Mock the analytics modules
jest.mock('../mobile-analytics', () => ({
  mobileAnalytics: {
    getStoredAnalytics: jest.fn(() => ({
      events: [],
      performance: [],
      errors: []
    })),
    clearStoredData: jest.fn(),
  },
  trackMobileEvent: jest.fn(),
  trackMobileError: jest.fn(),
}));

jest.mock('../mobile-performance-monitor', () => ({
  mobilePerformanceMonitor: {
    getActiveSession: jest.fn(),
  },
  startGamePerformanceMonitoring: jest.fn(),
  endGamePerformanceMonitoring: jest.fn(() => ({
    gameId: 'test-game',
    startTime: 1000,
    endTime: 2000,
    averageFPS: 60,
    frameDrops: 0,
  })),
  measureGameTouchLatency: jest.fn(),
  markGameRenderStart: jest.fn(),
  markGameRenderEnd: jest.fn(),
}));

// Mock document event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(document, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(document, 'removeEventListener', { value: mockRemoveEventListener });

describe('useMobileAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useMobileAnalytics());
      
      expect(result.current.trackEvent).toBeDefined();
      expect(result.current.trackError).toBeDefined();
      expect(result.current.startPerformanceSession).toBeDefined();
      expect(result.current.endPerformanceSession).toBeDefined();
    });

    it('should track events with game ID when provided', () => {
      const { trackMobileEvent } = require('../mobile-analytics');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      act(() => {
        result.current.trackEvent('game_start', { level: 1 });
      });
      
      expect(trackMobileEvent).toHaveBeenCalledWith('game_start', {
        level: 1,
        gameId: 'test-game'
      });
    });

    it('should track errors with game ID when provided', () => {
      const { trackMobileError } = require('../mobile-analytics');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      act(() => {
        result.current.trackError({
          type: 'game_load',
          message: 'Failed to load game'
        });
      });
      
      expect(trackMobileError).toHaveBeenCalledWith({
        type: 'game_load',
        message: 'Failed to load game',
        gameId: 'test-game'
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should auto-start performance session when enabled', () => {
      const { startGamePerformanceMonitoring } = require('../mobile-performance-monitor');
      
      renderHook(() => useMobileAnalytics({
        gameId: 'test-game',
        trackPerformance: true,
        autoStartSession: true
      }));
      
      expect(startGamePerformanceMonitoring).toHaveBeenCalledWith('test-game');
    });

    it('should start performance session manually', () => {
      const { startGamePerformanceMonitoring } = require('../mobile-performance-monitor');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      act(() => {
        result.current.startPerformanceSession();
      });
      
      expect(startGamePerformanceMonitoring).toHaveBeenCalledWith('test-game');
    });

    it('should end performance session and track metrics', () => {
      const { endGamePerformanceMonitoring } = require('../mobile-performance-monitor');
      const { trackMobileEvent } = require('../mobile-analytics');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      act(() => {
        const session = result.current.endPerformanceSession();
        expect(session).toBeDefined();
      });
      
      expect(endGamePerformanceMonitoring).toHaveBeenCalledWith('test-game');
      expect(trackMobileEvent).toHaveBeenCalledWith('game_end', {
        gameId: 'test-game',
        sessionDuration: 1000,
        averageFPS: 60,
        frameDrops: 0,
      });
    });

    it('should handle performance session with custom game ID', () => {
      const { startGamePerformanceMonitoring } = require('../mobile-performance-monitor');
      const { result } = renderHook(() => useMobileAnalytics());
      
      act(() => {
        result.current.startPerformanceSession('custom-game');
      });
      
      expect(startGamePerformanceMonitoring).toHaveBeenCalledWith('custom-game');
    });
  });

  describe('Touch Event Tracking', () => {
    it('should set up touch event listeners when enabled', () => {
      renderHook(() => useMobileAnalytics({
        gameId: 'test-game',
        trackTouchEvents: true
      }));
      
      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
    });

    it('should clean up touch event listeners on unmount', () => {
      const { unmount } = renderHook(() => useMobileAnalytics({
        gameId: 'test-game',
        trackTouchEvents: true
      }));
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('should measure touch latency', () => {
      const { measureGameTouchLatency } = require('../mobile-performance-monitor');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      const touchEvent = new TouchEvent('touchstart');
      
      act(() => {
        result.current.measureTouchLatency(touchEvent);
      });
      
      expect(measureGameTouchLatency).toHaveBeenCalledWith('test-game', touchEvent);
    });
  });

  describe('Render Tracking', () => {
    it('should mark render start and end', () => {
      const { markGameRenderStart, markGameRenderEnd } = require('../mobile-performance-monitor');
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      act(() => {
        result.current.markRenderStart();
        result.current.markRenderEnd();
      });
      
      expect(markGameRenderStart).toHaveBeenCalledWith('test-game');
      expect(markGameRenderEnd).toHaveBeenCalledWith('test-game');
    });

    it('should handle render tracking without game ID', () => {
      const { markGameRenderStart } = require('../mobile-performance-monitor');
      const { result } = renderHook(() => useMobileAnalytics());
      
      act(() => {
        result.current.markRenderStart();
      });
      
      expect(markGameRenderStart).not.toHaveBeenCalled();
    });
  });

  describe('Analytics Data Management', () => {
    it('should get analytics data', () => {
      const { mobileAnalytics } = require('../mobile-analytics');
      const { result } = renderHook(() => useMobileAnalytics());
      
      act(() => {
        const data = result.current.getAnalyticsData();
        expect(data).toEqual({
          events: [],
          performance: [],
          errors: []
        });
      });
      
      expect(mobileAnalytics.getStoredAnalytics).toHaveBeenCalled();
    });

    it('should clear analytics data', () => {
      const { mobileAnalytics } = require('../mobile-analytics');
      const { result } = renderHook(() => useMobileAnalytics());
      
      act(() => {
        result.current.clearAnalyticsData();
      });
      
      expect(mobileAnalytics.clearStoredData).toHaveBeenCalled();
    });
  });

  describe('Current Session', () => {
    it('should return current session when game ID is provided', () => {
      const { mobilePerformanceMonitor } = require('../mobile-performance-monitor');
      const mockSession = { gameId: 'test-game', startTime: 1000 };
      mobilePerformanceMonitor.getActiveSession.mockReturnValue(mockSession);
      
      const { result } = renderHook(() => useMobileAnalytics({ gameId: 'test-game' }));
      
      expect(result.current.currentSession).toBe(mockSession);
    });

    it('should return undefined when no game ID is provided', () => {
      const { result } = renderHook(() => useMobileAnalytics());
      
      expect(result.current.currentSession).toBeUndefined();
    });
  });

  describe('Game ID Updates', () => {
    it('should handle game ID changes', () => {
      const { result, rerender } = renderHook(
        ({ gameId }) => useMobileAnalytics({ gameId }),
        { initialProps: { gameId: 'game-1' } }
      );
      
      // Change game ID
      rerender({ gameId: 'game-2' });
      
      const { trackMobileEvent } = require('../mobile-analytics');
      
      act(() => {
        result.current.trackEvent('game_start');
      });
      
      expect(trackMobileEvent).toHaveBeenCalledWith('game_start', { gameId: 'game-2' });
    });
  });
});

describe('usePWAAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track PWA installation events', () => {
    const { trackMobileEvent } = require('../mobile-analytics');
    const { result } = renderHook(() => usePWAAnalytics());
    
    act(() => {
      result.current.trackPWAInstall('installed');
    });
    
    expect(trackMobileEvent).toHaveBeenCalledWith('pwa_install', { stage: 'installed' });
  });

  it('should track PWA launch events', () => {
    const { trackMobileEvent } = require('../mobile-analytics');
    const { result } = renderHook(() => usePWAAnalytics());
    
    act(() => {
      result.current.trackPWALaunch('standalone');
    });
    
    expect(trackMobileEvent).toHaveBeenCalledWith('pwa_launch', { mode: 'standalone' });
  });

  it('should track offline usage', () => {
    const { trackMobileEvent } = require('../mobile-analytics');
    const { result } = renderHook(() => usePWAAnalytics());
    
    act(() => {
      result.current.trackOfflineUsage(true, 5);
    });
    
    expect(trackMobileEvent).toHaveBeenCalledWith('offline_mode', {
      status: 'offline',
      availableGames: 5
    });
  });

  it('should provide base analytics functions', () => {
    const { result } = renderHook(() => usePWAAnalytics());
    
    expect(result.current.trackEvent).toBeDefined();
    expect(result.current.trackError).toBeDefined();
  });
});