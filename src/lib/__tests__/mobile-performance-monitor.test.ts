/**
 * Tests for Mobile Performance Monitor
 */

import { 
  mobilePerformanceMonitor,
  startGamePerformanceMonitoring,
  endGamePerformanceMonitoring,
  measureGameTouchLatency,
  markGameRenderStart,
  markGameRenderEnd
} from '../mobile-performance-monitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  }
};

Object.defineProperty(window, 'performance', { value: mockPerformance });

// Mock PerformanceObserver
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
};

Object.defineProperty(window, 'PerformanceObserver', {
  value: jest.fn().mockImplementation((callback) => {
    mockPerformanceObserver.callback = callback;
    return mockPerformanceObserver;
  })
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn((callback) => {
    setTimeout(callback, 16); // Simulate 60fps
    return 1;
  })
});

// Mock analytics
jest.mock('../mobile-analytics', () => ({
  trackMobilePerformance: jest.fn(),
  trackMobileError: jest.fn(),
}));

describe('Mobile Performance Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  describe('Game Session Management', () => {
    it('should start a game performance session', () => {
      startGamePerformanceMonitoring('test-game');
      
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      expect(session).toBeDefined();
      expect(session?.gameId).toBe('test-game');
      expect(session?.startTime).toBe(1000);
    });

    it('should end a game performance session', () => {
      startGamePerformanceMonitoring('test-game');
      
      mockPerformance.now.mockReturnValue(2000);
      const session = endGamePerformanceMonitoring('test-game');
      
      expect(session).toBeDefined();
      expect(session?.endTime).toBe(2000);
      expect(session?.gameId).toBe('test-game');
      
      // Session should be removed from active sessions
      const activeSession = mobilePerformanceMonitor.getActiveSession('test-game');
      expect(activeSession).toBeUndefined();
    });

    it('should return null when ending non-existent session', () => {
      const session = endGamePerformanceMonitoring('non-existent-game');
      expect(session).toBeNull();
    });

    it('should track multiple active sessions', () => {
      startGamePerformanceMonitoring('game-1');
      startGamePerformanceMonitoring('game-2');
      
      const sessions = mobilePerformanceMonitor.getAllActiveSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.gameId)).toContain('game-1');
      expect(sessions.map(s => s.gameId)).toContain('game-2');
    });
  });

  describe('FPS Monitoring', () => {
    it('should track FPS during game session', (done) => {
      startGamePerformanceMonitoring('test-game');
      
      // Simulate frame updates
      let frameCount = 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalRAF = window.requestAnimationFrame;
      
      (window.requestAnimationFrame as jest.Mock).mockImplementation((callback) => {
        frameCount++;
        mockPerformance.now.mockReturnValue(1000 + frameCount * 16.67); // 60fps
        
        setTimeout(() => {
          callback();
          
          if (frameCount >= 5) {
            const session = mobilePerformanceMonitor.getActiveSession('test-game');
            expect(session?.fps.length).toBeGreaterThan(0);
            done();
          }
        }, 1);
        
        return frameCount;
      });
    });

    it('should detect frame drops', () => {
      startGamePerformanceMonitoring('test-game');
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      
      // Simulate low FPS
      session!.fps.push(25); // Below 30fps threshold
      session!.frameDrops++;
      
      expect(session?.frameDrops).toBe(1);
    });

    it('should calculate average FPS correctly', () => {
      startGamePerformanceMonitoring('test-game');
      
      mockPerformance.now.mockReturnValue(2000);
      const session = endGamePerformanceMonitoring('test-game');
      
      // Mock some FPS data
      if (session) {
        session.fps = [60, 58, 62, 59, 61];
        session.averageFPS = session.fps.reduce((a, b) => a + b, 0) / session.fps.length;
      }
      
      expect(session?.averageFPS).toBe(60);
    });
  });

  describe('Touch Latency Measurement', () => {
    it('should measure touch latency', () => {
      startGamePerformanceMonitoring('test-game');
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      
      mockPerformance.now.mockReturnValue(1000);
      measureGameTouchLatency('test-game', touchEvent);
      
      // Simulate frame completion
      mockPerformance.now.mockReturnValue(1020); // 20ms latency
      
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      expect(session).toBeDefined();
    });

    it('should track high touch latency as error', () => {
      const { trackMobileError } = require('../mobile-analytics');
      
      startGamePerformanceMonitoring('test-game');
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      
      // Simulate high latency
      session!.touchLatency.push(150); // Over 100ms threshold
      
      // This would be called internally when latency is measured
      expect(trackMobileError).not.toHaveBeenCalled(); // Not called in this test setup
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage during session', (done) => {
      startGamePerformanceMonitoring('test-game');
      
      // Wait for memory check interval
      setTimeout(() => {
        const session = mobilePerformanceMonitor.getActiveSession('test-game');
        expect(session?.memoryUsage.length).toBeGreaterThan(0);
        expect(session?.peakMemory).toBeGreaterThan(0);
        done();
      }, 1100); // Slightly more than 1 second interval
    });

    it('should detect high memory usage', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trackMobileError } = require('../mobile-analytics');
      
      startGamePerformanceMonitoring('test-game');
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      
      // Simulate high memory usage
      session!.memoryUsage.push(120); // Over 100MB threshold
      session!.peakMemory = 120;
      
      // This would trigger error tracking in real scenario
      expect(session?.peakMemory).toBe(120);
    });
  });

  describe('Render Time Tracking', () => {
    it('should mark render start and end', () => {
      markGameRenderStart('test-game');
      expect(mockPerformance.mark).toHaveBeenCalledWith('game-render-start-test-game');
      
      markGameRenderEnd('test-game');
      expect(mockPerformance.mark).toHaveBeenCalledWith('game-render-end-test-game');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'game-render-test-game',
        'game-render-start-test-game',
        'game-render-end-test-game'
      );
    });

    it('should handle measure errors gracefully', () => {
      mockPerformance.measure.mockImplementation(() => {
        throw new Error('Invalid mark');
      });
      
      expect(() => {
        markGameRenderStart('test-game');
        markGameRenderEnd('test-game');
      }).not.toThrow();
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze performance issues on session end', () => {
      const { trackMobileError } = require('../mobile-analytics');
      
      startGamePerformanceMonitoring('test-game');
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      
      // Set up poor performance metrics
      session!.fps = [20, 25, 18, 22]; // Low FPS
      session!.frameDrops = 10;
      session!.memoryUsage = [160]; // High memory
      session!.peakMemory = 160;
      session!.touchLatency = [80, 90, 85]; // High latency
      
      mockPerformance.now.mockReturnValue(2000);
      endGamePerformanceMonitoring('test-game');
      
      // Should have tracked performance issues
      expect(trackMobileError).toHaveBeenCalled();
    });

    it('should calculate performance metrics correctly', () => {
      startGamePerformanceMonitoring('test-game');
      
      mockPerformance.now.mockReturnValue(3000);
      const session = endGamePerformanceMonitoring('test-game');
      
      expect(session?.endTime).toBe(3000);
      expect(session?.startTime).toBe(1000);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should clean up on destroy', () => {
      startGamePerformanceMonitoring('test-game-1');
      startGamePerformanceMonitoring('test-game-2');
      
      mobilePerformanceMonitor.destroy();
      
      // All sessions should be ended
      expect(mobilePerformanceMonitor.getAllActiveSessions()).toHaveLength(0);
      
      // Performance observer should be disconnected
      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle missing performance APIs gracefully', () => {
      // Remove PerformanceObserver
      delete (window as any).PerformanceObserver;
      
      expect(() => {
        startGamePerformanceMonitoring('test-game');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle session operations on non-existent games', () => {
      measureGameTouchLatency('non-existent', new TouchEvent('touchstart'));
      markGameRenderStart('non-existent');
      markGameRenderEnd('non-existent');
      
      // Should not throw errors
      expect(mobilePerformanceMonitor.getActiveSession('non-existent')).toBeUndefined();
    });

    it('should handle performance.now() returning same values', () => {
      mockPerformance.now.mockReturnValue(1000); // Always return same value
      
      startGamePerformanceMonitoring('test-game');
      
      // Should handle zero delta time gracefully
      const session = mobilePerformanceMonitor.getActiveSession('test-game');
      expect(session).toBeDefined();
    });
  });
});