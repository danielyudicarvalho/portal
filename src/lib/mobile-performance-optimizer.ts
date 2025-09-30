/**
 * Mobile performance optimizer that integrates preloading, monitoring, and image optimization
 */

import { getPerformanceMonitor, PerformanceMetrics, MOBILE_PERFORMANCE_THRESHOLDS } from './performance-monitor';
import { getGameAssetPreloader, AssetPreloadConfig, PreloadProgress } from './game-asset-preloader';
import { getOptimizedImageLoader, ImageLoadOptions } from './optimized-image-loader';

export interface MobileOptimizationConfig {
  gameId: string;
  enablePreloading: boolean;
  enablePerformanceMonitoring: boolean;
  enableImageOptimization: boolean;
  preloadStrategy: 'aggressive' | 'conservative' | 'adaptive';
  performanceThresholds?: Partial<typeof MOBILE_PERFORMANCE_THRESHOLDS>;
}

export interface OptimizationResult {
  success: boolean;
  metrics?: PerformanceMetrics;
  preloadResults?: any[];
  recommendations?: string[];
  warnings?: string[];
}

class MobilePerformanceOptimizer {
  private activeOptimizations = new Map<string, MobileOptimizationConfig>();
  private performanceHistory = new Map<string, PerformanceMetrics[]>();

  /**
   * Start mobile optimization for a game
   */
  async optimizeGameForMobile(config: MobileOptimizationConfig): Promise<OptimizationResult> {
    const { gameId } = config;

    // Store active optimization config
    this.activeOptimizations.set(gameId, config);

    const result: OptimizationResult = {
      success: true,
      recommendations: [],
      warnings: []
    };

    try {
      // Start performance monitoring
      if (config.enablePerformanceMonitoring) {
        getPerformanceMonitor().startMonitoring(gameId);
      }

      // Preload game assets
      if (config.enablePreloading) {
        const preloadConfig = await this.generatePreloadConfig(gameId, config.preloadStrategy);

        result.preloadResults = await getGameAssetPreloader().preloadGameAssets(
          preloadConfig,
          (progress) => this.handlePreloadProgress(gameId, progress)
        );
      }

      // Optimize images
      if (config.enableImageOptimization) {
        await this.optimizeGameImages(gameId);
      }

      // Apply mobile-specific optimizations
      await this.applyMobileOptimizations(gameId);

      // Generate recommendations
      result.recommendations = this.generateOptimizationRecommendations(gameId);

      return result;
    } catch (error) {
      result.success = false;
      result.warnings = [`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return result;
    }
  }

  /**
   * Stop optimization and get final results
   */
  async stopOptimization(gameId: string): Promise<OptimizationResult> {
    const config = this.activeOptimizations.get(gameId);
    if (!config) {
      return { success: false, warnings: ['No active optimization found'] };
    }

    const result: OptimizationResult = {
      success: true,
      recommendations: [],
      warnings: []
    };

    // Get final performance metrics
    if (config.enablePerformanceMonitoring) {
      const metrics = getPerformanceMonitor().stopMonitoring(gameId);
      if (metrics) {
        result.metrics = metrics;

        // Store in history
        const history = this.performanceHistory.get(gameId) || [];
        history.push(metrics);
        this.performanceHistory.set(gameId, history.slice(-10)); // Keep last 10 sessions

        // Check if performance meets standards
        const isAcceptable = this.isPerformanceAcceptable(metrics, config.performanceThresholds);
        if (!isAcceptable) {
          result.warnings.push('Performance below mobile standards');
          result.recommendations.push(...this.generatePerformanceRecommendations(metrics));
        }
      }
    }

    // Cleanup
    this.activeOptimizations.delete(gameId);

    return result;
  }

  /**
   * Generate preload configuration based on strategy
   */
  private async generatePreloadConfig(gameId: string, strategy: string): Promise<AssetPreloadConfig> {
    // Detect game assets automatically
    const gameAssets = await this.detectGameAssets(gameId);

    let priority: 'high' | 'medium' | 'low' = 'medium';
    let preloadStrategy: 'eager' | 'lazy' | 'viewport' = 'lazy';

    switch (strategy) {
      case 'aggressive':
        priority = 'high';
        preloadStrategy = 'eager';
        break;
      case 'conservative':
        priority = 'low';
        preloadStrategy = 'viewport';
        break;
      case 'adaptive':
        // Adapt based on network conditions
        if (typeof navigator !== 'undefined') {
          const connection = (navigator as any).connection;
          if (connection && connection.effectiveType === '4g') {
            priority = 'high';
            preloadStrategy = 'eager';
          } else {
            priority = 'medium';
            preloadStrategy = 'lazy';
          }
        }
        break;
    }

    return {
      gameId,
      priority,
      assets: gameAssets,
      preloadStrategy
    };
  }

  /**
   * Detect game assets automatically
   */
  private async detectGameAssets(gameId: string): Promise<any[]> {
    const assets = [];

    // Common game asset patterns
    const assetPatterns = [
      { url: `/games/${gameId}/index.html`, type: 'script', critical: true },
      { url: `/games/${gameId}/js/game.js`, type: 'script', critical: true },
      { url: `/games/${gameId}/assets/sprites.png`, type: 'image', critical: true },
      { url: `/games/${gameId}/assets/background.png`, type: 'image', critical: false },
      { url: `/games/${gameId}/sounds/music.wav`, type: 'audio', critical: false }
    ];

    // Check which assets actually exist
    for (const pattern of assetPatterns) {
      try {
        const response = await fetch(pattern.url, { method: 'HEAD' });
        if (response.ok) {
          assets.push(pattern);
        }
      } catch {
        // Asset doesn't exist, skip
      }
    }

    return assets;
  }

  /**
   * Optimize game images
   */
  private async optimizeGameImages(gameId: string): Promise<void> {
    if (typeof document === 'undefined') return;
    
    // Find all images in the game
    const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
    if (!gameContainer) return;

    const images = gameContainer.querySelectorAll('img');

    for (const img of Array.from(images)) {
      if (img.src) {
        // Replace with optimized version
        const optimizedOptions: ImageLoadOptions = {
          quality: 80,
          format: 'auto',
          lazy: !img.dataset.critical,
          priority: !!img.dataset.critical
        };

        try {
          await getOptimizedImageLoader().loadOptimizedImage({
            src: img.src,
            alt: img.alt,
            width: img.width || 300,
            height: img.height || 200,
            sizes: [
              { width: img.width || 300, height: img.height || 200 },
              { width: (img.width || 300) * 2, height: (img.height || 200) * 2, density: 2 }
            ],
            options: optimizedOptions
          });
        } catch (error) {
          console.warn(`Failed to optimize image ${img.src}:`, error);
        }
      }
    }
  }

  /**
   * Apply mobile-specific optimizations
   */
  private async applyMobileOptimizations(gameId: string): Promise<void> {
    if (typeof document === 'undefined') return;
    
    const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
    if (!gameContainer) return;

    // Optimize viewport
    this.optimizeViewport(gameContainer as HTMLElement);

    // Optimize touch interactions
    this.optimizeTouchInteractions(gameContainer as HTMLElement);

    // Optimize rendering
    this.optimizeRendering(gameContainer as HTMLElement);

    // Optimize memory usage
    this.optimizeMemoryUsage(gameContainer as HTMLElement);
  }

  /**
   * Optimize viewport for mobile
   */
  private optimizeViewport(container: HTMLElement): void {
    if (typeof document === 'undefined') return;
    
    // Set optimal viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Optimize container sizing
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.maxWidth = '100vw';
    container.style.maxHeight = '100vh';
    container.style.overflow = 'hidden';
  }

  /**
   * Optimize touch interactions
   */
  private optimizeTouchInteractions(container: HTMLElement): void {
    // Prevent default touch behaviors that might interfere with games
    container.style.touchAction = 'manipulation';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';

    // Optimize touch targets
    const interactiveElements = container.querySelectorAll('button, a, [onclick], [data-interactive]');
    Array.from(interactiveElements).forEach(element => {
      const el = element as HTMLElement;
      el.style.minHeight = '44px';
      el.style.minWidth = '44px';
      el.style.cursor = 'pointer';
    });
  }

  /**
   * Optimize rendering performance
   */
  private optimizeRendering(container: HTMLElement): void {
    if (typeof window === 'undefined') return;
    
    // Enable hardware acceleration
    container.style.transform = 'translateZ(0)';
    container.style.willChange = 'transform';

    // Optimize canvas elements
    const canvases = container.querySelectorAll('canvas');
    Array.from(canvases).forEach(canvas => {
      // Enable hardware acceleration for canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false; // Disable for pixel art games
      }

      // Set optimal canvas size
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    });
  }

  /**
   * Optimize memory usage
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private optimizeMemoryUsage(_container: HTMLElement): void {
    // Set up memory monitoring
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);

        if (usedMB > 100) { // If using more than 100MB
          // Trigger garbage collection if available
          if ('gc' in window) {
            (window as any).gc();
          }

          // Clear image cache if memory is high
          getOptimizedImageLoader().clearCache();
        }
      };

      setInterval(checkMemory, 30000); // Check every 30 seconds
    }
  }

  /**
   * Handle preload progress
   */
  private handlePreloadProgress(gameId: string, progress: PreloadProgress): void {
    if (typeof window === 'undefined') return;
    
    // Emit progress event for UI updates
    const event = new CustomEvent('gamePreloadProgress', {
      detail: { gameId, progress }
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if performance meets standards
   */
  private isPerformanceAcceptable(
    metrics: PerformanceMetrics,
    customThresholds?: Partial<typeof MOBILE_PERFORMANCE_THRESHOLDS>
  ): boolean {
    const thresholds = { ...MOBILE_PERFORMANCE_THRESHOLDS, ...customThresholds };

    return (
      metrics.averageFPS >= thresholds.MIN_FPS &&
      metrics.gameLoadTime <= thresholds.MAX_LOAD_TIME &&
      metrics.memoryUsage <= thresholds.MAX_MEMORY_USAGE &&
      metrics.cacheHitRate >= thresholds.MIN_CACHE_HIT_RATE
    );
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(gameId: string): string[] {
    const recommendations: string[] = [];
    const config = this.activeOptimizations.get(gameId);

    if (!config) return recommendations;

    // Network-based recommendations
    if (typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          recommendations.push('Consider reducing asset quality for slow network connections');
          recommendations.push('Enable aggressive caching for offline play');
        }

        if (connection.saveData) {
          recommendations.push('User has data saver enabled - minimize asset downloads');
        }
      }

      // Device-based recommendations
      if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
        recommendations.push('Low memory device detected - optimize memory usage');
      }
    }

    // Performance-based recommendations
    const history = this.performanceHistory.get(gameId);
    if (history && history.length > 0) {
      const avgFPS = history.reduce((sum, m) => sum + m.averageFPS, 0) / history.length;
      if (avgFPS < 30) {
        recommendations.push('Consider reducing visual effects for better performance');
      }
    }

    return recommendations;
  }

  /**
   * Generate performance-specific recommendations
   */
  private generatePerformanceRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.averageFPS < MOBILE_PERFORMANCE_THRESHOLDS.MIN_FPS) {
      recommendations.push('FPS below 30 - consider optimizing rendering or reducing visual complexity');
    }

    if (metrics.gameLoadTime > MOBILE_PERFORMANCE_THRESHOLDS.MAX_LOAD_TIME) {
      recommendations.push('Load time exceeds 3 seconds - implement asset preloading or reduce initial bundle size');
    }

    if (metrics.memoryUsage > MOBILE_PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE) {
      recommendations.push('Memory usage high - implement memory management and asset cleanup');
    }

    if (metrics.cacheHitRate < MOBILE_PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE) {
      recommendations.push('Low cache hit rate - improve caching strategy for better offline performance');
    }

    return recommendations;
  }

  /**
   * Get performance history for a game
   */
  getPerformanceHistory(gameId: string): PerformanceMetrics[] {
    return this.performanceHistory.get(gameId) || [];
  }

  /**
   * Clear performance history
   */
  clearPerformanceHistory(gameId?: string): void {
    if (gameId) {
      this.performanceHistory.delete(gameId);
    } else {
      this.performanceHistory.clear();
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(gameId: string): MobileOptimizationConfig | null {
    return this.activeOptimizations.get(gameId) || null;
  }
}

// Singleton instance (client-side only)
let mobilePerformanceOptimizerInstance: MobilePerformanceOptimizer | null = null;

export const getMobilePerformanceOptimizer = (): MobilePerformanceOptimizer => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      optimizeGameForMobile: async () => ({ success: false, warnings: ['SSR mode'] }),
      getPerformanceHistory: () => [],
      clearPerformanceHistory: () => {},
      getOptimizationStatus: () => null,
    } as any;
  }
  
  if (!mobilePerformanceOptimizerInstance) {
    mobilePerformanceOptimizerInstance = new MobilePerformanceOptimizer();
  }
  return mobilePerformanceOptimizerInstance;
};

// Export the getter function instead of a direct instance
export { getMobilePerformanceOptimizer as mobilePerformanceOptimizer };

/**
 * Quick optimization function for common use cases
 */
export async function optimizeGameForMobile(
  gameId: string,
  strategy: 'aggressive' | 'conservative' | 'adaptive' = 'adaptive'
): Promise<OptimizationResult> {
  const config: MobileOptimizationConfig = {
    gameId,
    enablePreloading: true,
    enablePerformanceMonitoring: true,
    enableImageOptimization: true,
    preloadStrategy: strategy
  };

  return getMobilePerformanceOptimizer().optimizeGameForMobile(config);
}