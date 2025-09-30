/**
 * Mobile Performance Optimizer Component
 * Integrates lazy loading, memory management, and bundle optimization
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { lazyLoader } from '../../lib/lazy-loader';
import { memoryManager, useMemoryManager } from '../../lib/memory-manager';
import { getBundleAnalyzer, useBundleAnalysis } from '../../lib/bundle-analyzer';
import { useMobilePerformance } from '../../hooks/useMobilePerformance';

export interface MobilePerformanceOptimizerProps {
  gameId?: string;
  enableLazyLoading?: boolean;
  enableMemoryManagement?: boolean;
  enableBundleOptimization?: boolean;
  autoOptimize?: boolean;
  showDebugInfo?: boolean;
}

export function MobilePerformanceOptimizer({
  gameId,
  enableLazyLoading = true,
  enableMemoryManagement = true,
  enableBundleOptimization = true,
  autoOptimize = true,
  showDebugInfo = false
}: MobilePerformanceOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStatus, setOptimizationStatus] = useState<'idle' | 'optimizing' | 'optimized' | 'error'>('idle');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Hooks for performance monitoring
  const mobilePerformance = useMobilePerformance({
    gameId: gameId || 'global',
    autoStart: autoOptimize,
    strategy: 'adaptive'
  });

  const memoryStatus = useMemoryManager(enableMemoryManagement);
  const bundleAnalysis = useBundleAnalysis();

  /**
   * Optimize lazy loading
   */
  const optimizeLazyLoading = useCallback(async (): Promise<void> => {
    // Register game components for lazy loading
    const gameElements = document.querySelectorAll('[data-game-component]');

    gameElements.forEach((element, index) => {
      const componentId = element.getAttribute('data-game-component') || `game-component-${index}`;

      lazyLoader.registerComponent(
        componentId,
        element as HTMLElement,
        async () => {
          // Lazy load game assets
          if (gameId) {
            const gameAssets = [
              `/games/${gameId}/js/game.js`,
              `/games/${gameId}/assets/sprites.png`
            ];

            const loadPromises = gameAssets.map(async (assetUrl) => {
              try {
                if (assetUrl.endsWith('.js')) {
                  const script = document.createElement('script');
                  script.src = assetUrl;
                  script.async = true;

                  return new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load ${assetUrl}`));
                    document.head.appendChild(script);
                  });
                } else {
                  const img = new Image();
                  return new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error(`Failed to load ${assetUrl}`));
                    img.src = assetUrl;
                  });
                }
              } catch (error) {
                console.warn(`Failed to lazy load asset ${assetUrl}:`, error);
              }
            });

            await Promise.allSettled(loadPromises);
          }
        }
      );
    });

    // Optimize images for lazy loading
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      }
    });
  }, []);

  /**
   * Optimize memory usage
   */
  const optimizeMemoryUsage = useCallback(async (): Promise<void> => {
    // Start memory monitoring
    memoryManager.startMonitoring();

    // Perform initial cleanup if memory usage is high
    const currentUsage = memoryManager.getMemoryUsageMB();
    if (currentUsage > 50) { // If using more than 50MB
      memoryManager.performCleanup('moderate');
    }

    // Set up game-specific memory management
    if (gameId) {
      // Cache game assets with proper priority
      const gameAssets = document.querySelectorAll(`[data-game-id="${gameId}"] img, [data-game-id="${gameId}"] audio`);

      gameAssets.forEach((asset, index) => {
        const assetElement = asset as HTMLImageElement | HTMLAudioElement;
        const assetSize = estimateAssetSize(assetElement);

        memoryManager.cacheResource({
          id: `${gameId}-asset-${index}`,
          data: assetElement,
          size: assetSize,
          priority: index < 3 ? 'high' : 'medium' // First 3 assets are high priority
        });
      });
    }
  }, [gameId]);

  /**
   * Optimize bundle loading
   */
  const optimizeBundleLoading = useCallback(async (): Promise<void> => {
    // Optimize for mobile
    getBundleAnalyzer().optimizeForMobile();

    // Preload critical resources
    const criticalResources = [
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/framework.js',
      '/_next/static/css/app.css'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      link.href = resource;
      document.head.appendChild(link);
    });

    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[src]:not([data-critical])');
    scripts.forEach(script => {
      script.setAttribute('defer', 'true');
    });
  }, []);

  /**
   * Estimate asset size
   */
  const estimateAssetSize = (element: HTMLImageElement | HTMLAudioElement): number => {
    if (element instanceof HTMLImageElement) {
      // Estimate image size based on dimensions
      return (element.naturalWidth || 300) * (element.naturalHeight || 200) * 4; // 4 bytes per pixel (RGBA)
    } else if (element instanceof HTMLAudioElement) {
      // Estimate audio size (rough approximation)
      return element.duration ? element.duration * 128 * 1024 / 8 : 1024 * 1024; // 128kbps
    }
    return 1024; // Default 1KB
  };

  /**
   * Update debug information
   */
  const updateDebugInfo = useCallback((): void => {
    const info = {
      memory: memoryStatus.memoryStats,
      bundle: bundleAnalysis.analysis,
      performance: {
        isOptimized: mobilePerformance.isOptimized,
        recommendations: mobilePerformance.recommendations,
        warnings: mobilePerformance.warnings
      },
      device: {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        memory: (navigator as any).deviceMemory || 'unknown',
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }
    };

    setDebugInfo(info);
  }, [memoryStatus.memoryStats, bundleAnalysis.analysis, mobilePerformance.isOptimized, mobilePerformance.recommendations, mobilePerformance.warnings]);

  /**
   * Start comprehensive mobile optimization
   */
  const startOptimization = useCallback(async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    setOptimizationStatus('optimizing');

    try {
      const optimizations: Promise<void>[] = [];

      // 1. Lazy Loading Optimization
      if (enableLazyLoading) {
        optimizations.push(optimizeLazyLoading());
      }

      // 2. Memory Management Optimization
      if (enableMemoryManagement) {
        optimizations.push(optimizeMemoryUsage());
      }

      // 3. Bundle Optimization
      if (enableBundleOptimization) {
        optimizations.push(optimizeBundleLoading());
      }

      // Wait for all optimizations to complete
      await Promise.allSettled(optimizations);

      setOptimizationStatus('optimized');

      // Update debug info
      if (showDebugInfo) {
        updateDebugInfo();
      }

    } catch (error) {
      console.error('Mobile optimization failed:', error);
      setOptimizationStatus('error');
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, enableLazyLoading, enableMemoryManagement, enableBundleOptimization, showDebugInfo, optimizeLazyLoading, optimizeMemoryUsage, optimizeBundleLoading, updateDebugInfo]);

  // Auto-start optimization
  useEffect(() => {
    if (autoOptimize && optimizationStatus === 'idle') {
      startOptimization();
    }
  }, [autoOptimize, optimizationStatus, startOptimization]);

  // Update debug info periodically
  useEffect(() => {
    if (showDebugInfo) {
      const interval = setInterval(updateDebugInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [showDebugInfo, updateDebugInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (enableMemoryManagement) {
        memoryManager.stopMonitoring();
      }
    };
  }, [enableMemoryManagement]);

  if (!showDebugInfo) {
    return null; // Component runs in background
  }

  return (
    <div className="mobile-performance-optimizer">
      <div className="performance-status">
        <h3>Mobile Performance Status</h3>
        <div className={`status-indicator status-${optimizationStatus}`}>
          {optimizationStatus === 'idle' && '⏸️ Idle'}
          {optimizationStatus === 'optimizing' && '⚡ Optimizing...'}
          {optimizationStatus === 'optimized' && '✅ Optimized'}
          {optimizationStatus === 'error' && '❌ Error'}
        </div>
      </div>

      {debugInfo && (
        <div className="debug-info">
          <details>
            <summary>Memory Status</summary>
            <pre>{JSON.stringify(debugInfo.memory, null, 2)}</pre>
          </details>

          <details>
            <summary>Bundle Analysis</summary>
            <pre>{JSON.stringify(debugInfo.bundle, null, 2)}</pre>
          </details>

          <details>
            <summary>Performance Metrics</summary>
            <pre>{JSON.stringify(debugInfo.performance, null, 2)}</pre>
          </details>

          <details>
            <summary>Device Info</summary>
            <pre>{JSON.stringify(debugInfo.device, null, 2)}</pre>
          </details>
        </div>
      )}

      <div className="optimization-controls">
        <button
          onClick={startOptimization}
          disabled={isOptimizing}
          className="optimize-button"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
        </button>

        <button
          onClick={() => memoryStatus.performCleanup('moderate')}
          className="cleanup-button"
        >
          Clean Memory
        </button>

        <button
          onClick={() => bundleAnalysis.analyzeNow()}
          className="analyze-button"
        >
          Analyze Bundles
        </button>
      </div>

      <style jsx>{`
        .mobile-performance-optimizer {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          max-width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 9999;
        }

        .performance-status {
          margin-bottom: 10px;
        }

        .status-indicator {
          padding: 5px 10px;
          border-radius: 4px;
          margin-top: 5px;
        }

        .status-idle { background: #666; }
        .status-optimizing { background: #f39c12; }
        .status-optimized { background: #27ae60; }
        .status-error { background: #e74c3c; }

        .debug-info {
          margin: 10px 0;
        }

        .debug-info details {
          margin: 5px 0;
        }

        .debug-info summary {
          cursor: pointer;
          padding: 5px;
          background: #333;
          border-radius: 3px;
        }

        .debug-info pre {
          background: #222;
          padding: 10px;
          border-radius: 3px;
          overflow-x: auto;
          font-size: 10px;
        }

        .optimization-controls {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .optimization-controls button {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .optimize-button { background: #3498db; color: white; }
        .cleanup-button { background: #e67e22; color: white; }
        .analyze-button { background: #9b59b6; color: white; }

        .optimization-controls button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default MobilePerformanceOptimizer;