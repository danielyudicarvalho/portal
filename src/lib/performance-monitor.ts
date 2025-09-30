/**
 * Performance monitoring utility for mobile game rendering and loading
 */

export interface PerformanceMetrics {
  gameLoadTime: number;
  firstRenderTime: number;
  averageFPS: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
}

export interface GamePerformanceData {
  gameId: string;
  deviceInfo: DeviceInfo;
  metrics: PerformanceMetrics;
  timestamp: number;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  connectionType: string;
  memoryLimit?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Start monitoring performance for a specific game
   */
  startMonitoring(gameId: string): void {
    if (typeof window === 'undefined') return;
    
    const startTime = performance.now();

    // Initialize metrics
    this.metrics.set(gameId, {
      gameLoadTime: 0,
      firstRenderTime: 0,
      averageFPS: 0,
      memoryUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0
    });

    // Monitor resource loading
    this.monitorResourceLoading(gameId, startTime);

    // Monitor FPS
    this.startFPSMonitoring(gameId);

    // Monitor memory usage
    this.monitorMemoryUsage(gameId);
  }

  /**
   * Stop monitoring and return final metrics
   */
  stopMonitoring(gameId: string): PerformanceMetrics | null {
    this.stopFPSMonitoring();
    this.cleanupObservers();

    const metrics = this.metrics.get(gameId);
    this.metrics.delete(gameId);

    return metrics || null;
  }

  /**
   * Monitor resource loading times
   */
  private monitorResourceLoading(gameId: string, startTime: number): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      let cacheHits = 0;
      let totalRequests = 0;

      entries.forEach((entry) => {
        if (entry.name.includes(gameId)) {
          totalRequests++;

          // Check if resource was served from cache
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize > 0) {
            cacheHits++;
          }
        }
      });

      const metrics = this.metrics.get(gameId);
      if (metrics) {
        metrics.gameLoadTime = performance.now() - startTime;
        metrics.cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
        this.metrics.set(gameId, metrics);
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Start FPS monitoring using requestAnimationFrame
   */
  private startFPSMonitoring(gameId: string): void {
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
    
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.fpsHistory = [];

    const measureFPS = (currentTime: number) => {
      this.frameCount++;

      if (currentTime - this.lastFrameTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
        this.fpsHistory.push(fps);

        // Keep only last 10 seconds of FPS data
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }

        const metrics = this.metrics.get(gameId);
        if (metrics) {
          metrics.averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
          this.metrics.set(gameId, metrics);
        }

        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      if (this.metrics.has(gameId)) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Stop FPS monitoring
   */
  private stopFPSMonitoring(): void {
    this.frameCount = 0;
    this.fpsHistory = [];
  }

  /**
   * Monitor memory usage if available
   */
  private monitorMemoryUsage(gameId: string): void {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        const metrics = this.metrics.get(gameId);

        if (metrics && memory) {
          metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
          this.metrics.set(gameId, metrics);
        }

        if (this.metrics.has(gameId)) {
          setTimeout(updateMemoryUsage, 1000);
        }
      };

      updateMemoryUsage();
    }
  }

  /**
   * Measure network latency
   */
  async measureNetworkLatency(): Promise<number> {
    const startTime = performance.now();

    try {
      await fetch('/api/ping', { method: 'HEAD' });
      return performance.now() - startTime;
    } catch {
      return -1; // Network error
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        screenWidth: 0,
        screenHeight: 0,
        devicePixelRatio: 1,
        connectionType: 'unknown',
        memoryLimit: undefined
      };
    }

    const connection = (navigator as {
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    }).connection || (navigator as { mozConnection?: { effectiveType?: string } }).mozConnection || (navigator as { webkitConnection?: { effectiveType?: string } }).webkitConnection;

    return {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      connectionType: connection?.effectiveType || 'unknown',
      memoryLimit: (navigator as { deviceMemory?: number }).deviceMemory
    };
  }

  /**
   * Record first render time
   */
  recordFirstRender(gameId: string): void {
    const metrics = this.metrics.get(gameId);
    if (metrics && metrics.firstRenderTime === 0) {
      metrics.firstRenderTime = performance.now();
      this.metrics.set(gameId, metrics);
    }
  }

  /**
   * Get current metrics for a game
   */
  getMetrics(gameId: string): PerformanceMetrics | null {
    return this.metrics.get(gameId) || null;
  }

  /**
   * Clean up performance observers
   */
  private cleanupObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(gameId: string): GamePerformanceData | null {
    const metrics = this.metrics.get(gameId);
    if (!metrics) return null;

    return {
      gameId,
      deviceInfo: this.getDeviceInfo(),
      metrics,
      timestamp: Date.now()
    };
  }
}

// Singleton instance (client-side only)
let performanceMonitorInstance: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      startMonitoring: () => {},
      stopMonitoring: () => {},
      getMetrics: () => ({ averageFPS: 0, gameLoadTime: 0, memoryUsage: 0, cacheHitRate: 0 }),
      recordLoadTime: () => {},
      recordFPS: () => {},
      recordMemoryUsage: () => {},
      recordCacheHit: () => {},
      recordCacheMiss: () => {},
      getDeviceInfo: () => ({ isMobile: false, screenWidth: 0, screenHeight: 0, devicePixelRatio: 1, connectionType: 'unknown', memoryLimit: 0 }),
      clearMetrics: () => {},
    } as any;
  }
  
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
};

// Export the getter function instead of a direct instance
export { getPerformanceMonitor as performanceMonitor };

// Performance thresholds for mobile devices
export const MOBILE_PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 30,
  MAX_LOAD_TIME: 3000, // 3 seconds
  MAX_MEMORY_USAGE: 100, // 100MB
  MIN_CACHE_HIT_RATE: 70 // 70%
};

/**
 * Check if performance meets mobile standards
 */
export function isPerformanceAcceptable(metrics: PerformanceMetrics): boolean {
  return (
    metrics.averageFPS >= MOBILE_PERFORMANCE_THRESHOLDS.MIN_FPS &&
    metrics.gameLoadTime <= MOBILE_PERFORMANCE_THRESHOLDS.MAX_LOAD_TIME &&
    metrics.memoryUsage <= MOBILE_PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE &&
    metrics.cacheHitRate >= MOBILE_PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE
  );
}