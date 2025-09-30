/**
 * Mobile Performance Monitor
 * Tracks game performance metrics on mobile devices
 */

import { trackMobilePerformance, trackMobileError } from './mobile-analytics';

export interface GamePerformanceSession {
  gameId: string;
  startTime: number;
  endTime?: number;
  fps: number[];
  memoryUsage: number[];
  touchLatency: number[];
  renderTime: number[];
  frameDrops: number;
  averageFPS: number;
  peakMemory: number;
  averageTouchLatency: number;
}

export interface TouchLatencyMeasurement {
  touchStart: number;
  touchEnd: number;
  latency: number;
}

class MobilePerformanceMonitor {
  private activeSessions: Map<string, GamePerformanceSession> = new Map();
  private frameCounters: Map<string, number> = new Map();
  private lastFrameTimes: Map<string, number> = new Map();
  private touchMeasurements: Map<string, TouchLatencyMeasurement[]> = new Map();
  private performanceObserver?: PerformanceObserver;
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.entryType === 'measure' && entry.name.startsWith('game-render-')) {
            const gameId = entry.name.replace('game-render-', '');
            const session = this.activeSessions.get(gameId);

            if (session) {
              session.renderTime.push(entry.duration);
            }
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.memoryCheckInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (!memory) return;

      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

      // Update all active sessions
      for (const [gameId, session] of Array.from(this.activeSessions.entries())) {
        session.memoryUsage.push(memoryUsage);
        session.peakMemory = Math.max(session.peakMemory, memoryUsage);

        // Check for memory issues
        if (memoryUsage > 100) { // Alert if over 100MB
          trackMobileError({
            type: 'performance',
            message: `High memory usage detected: ${memoryUsage.toFixed(2)}MB`,
            gameId,
          });
        }
      }
    }, 1000); // Check every second
  }

  public startGameSession(gameId: string): void {
    const session: GamePerformanceSession = {
      gameId,
      startTime: performance.now(),
      fps: [],
      memoryUsage: [],
      touchLatency: [],
      renderTime: [],
      frameDrops: 0,
      averageFPS: 0,
      peakMemory: 0,
      averageTouchLatency: 0,
    };

    this.activeSessions.set(gameId, session);
    this.frameCounters.set(gameId, 0);
    this.lastFrameTimes.set(gameId, performance.now());
    this.touchMeasurements.set(gameId, []);

    // Start FPS monitoring for this game
    this.startFPSMonitoring(gameId);

    console.log(`Started performance monitoring for game: ${gameId}`);
  }

  public endGameSession(gameId: string): GamePerformanceSession | null {
    const session = this.activeSessions.get(gameId);
    if (!session) return null;

    session.endTime = performance.now();

    // Calculate final metrics
    session.averageFPS = this.calculateAverageFPS(session.fps);
    session.averageTouchLatency = this.calculateAverageTouchLatency(gameId);

    // Track performance metrics
    trackMobilePerformance({
      gameId,
      loadTime: session.endTime - session.startTime,
      fps: session.fps,
      memoryUsage: session.memoryUsage,
      touchLatency: session.touchLatency,
      renderTime: session.renderTime,
    });

    // Check for performance issues
    this.analyzePerformanceIssues(session);

    // Cleanup
    this.activeSessions.delete(gameId);
    this.frameCounters.delete(gameId);
    this.lastFrameTimes.delete(gameId);
    this.touchMeasurements.delete(gameId);

    console.log(`Ended performance monitoring for game: ${gameId}`, session);
    return session;
  }

  private startFPSMonitoring(gameId: string): void {
    const measureFPS = () => {
      const session = this.activeSessions.get(gameId);
      if (!session) return;

      const now = performance.now();
      const lastTime = this.lastFrameTimes.get(gameId) || now;
      const deltaTime = now - lastTime;

      if (deltaTime > 0) {
        const fps = 1000 / deltaTime;
        session.fps.push(fps);

        // Detect frame drops (FPS below 30)
        if (fps < 30) {
          session.frameDrops++;
        }

        // Alert for severe performance issues
        if (fps < 15) {
          trackMobileError({
            type: 'performance',
            message: `Severe FPS drop detected: ${fps.toFixed(2)} FPS`,
            gameId,
          });
        }
      }

      this.lastFrameTimes.set(gameId, now);
      this.frameCounters.set(gameId, (this.frameCounters.get(gameId) || 0) + 1);

      // Continue monitoring if session is still active
      if (this.activeSessions.has(gameId)) {
        requestAnimationFrame(() => measureFPS());
      }
    };

    requestAnimationFrame(() => measureFPS());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public measureTouchLatency(gameId: string, _touchEvent: TouchEvent): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;

    const touchStart = performance.now();

    // Measure time until next frame
    requestAnimationFrame(() => {
      const touchEnd = performance.now();
      const latency = touchEnd - touchStart;

      session.touchLatency.push(latency);

      const measurements = this.touchMeasurements.get(gameId) || [];
      measurements.push({ touchStart, touchEnd, latency });
      this.touchMeasurements.set(gameId, measurements);

      // Alert for high touch latency
      if (latency > 100) { // Over 100ms is problematic
        trackMobileError({
          type: 'touch_input',
          message: `High touch latency detected: ${latency.toFixed(2)}ms`,
          gameId,
        });
      }
    });
  }

  public markRenderStart(gameId: string): void {
    if (typeof window === 'undefined') return;
    performance.mark(`game-render-start-${gameId}`);
  }

  public markRenderEnd(gameId: string): void {
    if (typeof window === 'undefined') return;

    const startMark = `game-render-start-${gameId}`;
    const endMark = `game-render-end-${gameId}`;
    const measureName = `game-render-${gameId}`;

    performance.mark(endMark);

    try {
      performance.measure(measureName, startMark, endMark);
    } catch (error) {
      console.warn('Failed to measure render time:', error);
    }
  }

  private calculateAverageFPS(fpsArray: number[]): number {
    if (fpsArray.length === 0) return 0;
    return fpsArray.reduce((sum, fps) => sum + fps, 0) / fpsArray.length;
  }

  private calculateAverageTouchLatency(gameId: string): number {
    const measurements = this.touchMeasurements.get(gameId) || [];
    if (measurements.length === 0) return 0;

    const totalLatency = measurements.reduce((sum, m) => sum + m.latency, 0);
    return totalLatency / measurements.length;
  }

  private analyzePerformanceIssues(session: GamePerformanceSession): void {
    const issues: string[] = [];

    // Check average FPS
    if (session.averageFPS < 30) {
      issues.push(`Low average FPS: ${session.averageFPS.toFixed(2)}`);
    }

    // Check frame drops
    const frameDropPercentage = (session.frameDrops / session.fps.length) * 100;
    if (frameDropPercentage > 10) {
      issues.push(`High frame drop rate: ${frameDropPercentage.toFixed(2)}%`);
    }

    // Check memory usage
    if (session.peakMemory > 150) {
      issues.push(`High peak memory usage: ${session.peakMemory.toFixed(2)}MB`);
    }

    // Check touch latency
    if (session.averageTouchLatency > 50) {
      issues.push(`High touch latency: ${session.averageTouchLatency.toFixed(2)}ms`);
    }

    // Report issues
    if (issues.length > 0) {
      trackMobileError({
        type: 'performance',
        message: `Performance issues detected: ${issues.join(', ')}`,
        gameId: session.gameId,
      });
    }
  }

  public getActiveSession(gameId: string): GamePerformanceSession | undefined {
    return this.activeSessions.get(gameId);
  }

  public getAllActiveSessions(): GamePerformanceSession[] {
    return Array.from(this.activeSessions.values());
  }

  public destroy(): void {
    // End all active sessions
    for (const gameId of Array.from(this.activeSessions.keys())) {
      this.endGameSession(gameId);
    }

    // Cleanup observers and intervals
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Singleton instance (client-side only)
let mobilePerformanceMonitorInstance: MobilePerformanceMonitor | null = null;

export const getMobilePerformanceMonitor = (): MobilePerformanceMonitor => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      startSession: () => '',
      endSession: () => ({ sessionId: '', duration: 0, averageFPS: 0, memoryUsage: 0, touchLatency: 0, renderTime: 0 }),
      getActiveSession: () => undefined,
      getAllSessions: () => [],
      clearSessions: () => {},
      recordTouchLatency: () => {},
      recordRenderTime: () => {},
      recordMemoryUsage: () => {},
      recordFPS: () => {},
    } as any;
  }
  
  if (!mobilePerformanceMonitorInstance) {
    mobilePerformanceMonitorInstance = new MobilePerformanceMonitor();
  }
  return mobilePerformanceMonitorInstance;
};

// Export the getter function instead of a direct instance
export { getMobilePerformanceMonitor as mobilePerformanceMonitor };

// Convenience functions
export const startGamePerformanceMonitoring = (gameId: string) => {
  getMobilePerformanceMonitor().startGameSession(gameId);
};

export const endGamePerformanceMonitoring = (gameId: string) => {
  return getMobilePerformanceMonitor().endGameSession(gameId);
};

export const measureGameTouchLatency = (gameId: string, touchEvent: TouchEvent) => {
  getMobilePerformanceMonitor().measureTouchLatency(gameId, touchEvent);
};

export const markGameRenderStart = (gameId: string) => {
  getMobilePerformanceMonitor().markRenderStart(gameId);
};

export const markGameRenderEnd = (gameId: string) => {
  getMobilePerformanceMonitor().markRenderEnd(gameId);
};