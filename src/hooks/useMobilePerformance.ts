/**
 * React hook for mobile performance optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getMobilePerformanceOptimizer, 
  MobileOptimizationConfig
} from '../lib/mobile-performance-optimizer';
import { PerformanceMetrics } from '../lib/performance-monitor';
import { PreloadProgress } from '../lib/game-asset-preloader';

export interface UseMobilePerformanceOptions {
  gameId: string;
  autoStart?: boolean;
  strategy?: 'aggressive' | 'conservative' | 'adaptive';
  enablePreloading?: boolean;
  enableMonitoring?: boolean;
  enableImageOptimization?: boolean;
}

export interface MobilePerformanceState {
  isOptimizing: boolean;
  isOptimized: boolean;
  metrics: PerformanceMetrics | null;
  preloadProgress: PreloadProgress | null;
  recommendations: string[];
  warnings: string[];
  error: string | null;
}

export function useMobilePerformance(options: UseMobilePerformanceOptions) {
  const {
    gameId,
    autoStart = false,
    strategy = 'adaptive',
    enablePreloading = true,
    enableMonitoring = true,
    enableImageOptimization = true
  } = options;

  const [state, setState] = useState<MobilePerformanceState>({
    isOptimizing: false,
    isOptimized: false,
    metrics: null,
    preloadProgress: null,
    recommendations: [],
    warnings: [],
    error: null
  });

  const optimizationRef = useRef<boolean>(false);

  /**
   * Start mobile optimization
   */
  const startOptimization = useCallback(async () => {
    if (optimizationRef.current) return;

    setState(prev => ({
      ...prev,
      isOptimizing: true,
      error: null
    }));

    try {
      const config: MobileOptimizationConfig = {
        gameId,
        enablePreloading,
        enablePerformanceMonitoring: enableMonitoring,
        enableImageOptimization,
        preloadStrategy: strategy
      };

      optimizationRef.current = true;
      const result = await getMobilePerformanceOptimizer().optimizeGameForMobile(config);

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        isOptimized: result.success,
        recommendations: result.recommendations || [],
        warnings: result.warnings || [],
        error: result.success ? null : 'Optimization failed'
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        isOptimized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [gameId, strategy, enablePreloading, enableMonitoring, enableImageOptimization]);

  /**
   * Stop optimization and get final results
   */
  const stopOptimization = useCallback(async () => {
    if (!optimizationRef.current) return;

    try {
      const result = await getMobilePerformanceOptimizer().stopOptimization(gameId);
      
      setState(prev => ({
        ...prev,
        metrics: result.metrics || null,
        recommendations: [...prev.recommendations, ...(result.recommendations || [])],
        warnings: [...prev.warnings, ...(result.warnings || [])]
      }));

      optimizationRef.current = false;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop optimization'
      }));
    }
  }, [gameId]);

  /**
   * Handle preload progress updates
   */
  const handlePreloadProgress = useCallback((event: CustomEvent) => {
    const { gameId: eventGameId, progress } = event.detail;
    
    if (eventGameId === gameId) {
      setState(prev => ({
        ...prev,
        preloadProgress: progress
      }));
    }
  }, [gameId]);

  /**
   * Get performance history
   */
  const getPerformanceHistory = useCallback(() => {
    return getMobilePerformanceOptimizer().getPerformanceHistory(gameId);
  }, [gameId]);

  /**
   * Check if device is mobile
   */
  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }, []);

  /**
   * Get network information
   */
  const getNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }, []);

  /**
   * Get device capabilities
   */
  const getDeviceCapabilities = useCallback(() => {
    return {
      memory: (navigator as any).deviceMemory || 0,
      cores: navigator.hardwareConcurrency || 0,
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: screen.width,
        height: screen.height
      }
    };
  }, []);

  // Auto-start optimization if enabled
  useEffect(() => {
    if (autoStart && isMobileDevice()) {
      startOptimization();
    }

    return () => {
      if (optimizationRef.current) {
        stopOptimization();
      }
    };
  }, [autoStart, startOptimization, stopOptimization, isMobileDevice]);

  // Listen for preload progress events
  useEffect(() => {
    window.addEventListener('gamePreloadProgress', handlePreloadProgress as EventListener);
    
    return () => {
      window.removeEventListener('gamePreloadProgress', handlePreloadProgress as EventListener);
    };
  }, [handlePreloadProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (optimizationRef.current) {
        getMobilePerformanceOptimizer().stopOptimization(gameId);
        optimizationRef.current = false;
      }
    };
  }, [gameId]);

  return {
    // State
    ...state,
    
    // Actions
    startOptimization,
    stopOptimization,
    
    // Utilities
    getPerformanceHistory,
    isMobileDevice,
    getNetworkInfo,
    getDeviceCapabilities,
    
    // Computed values
    isSupported: typeof window !== 'undefined' && 'performance' in window,
    shouldOptimize: isMobileDevice() && !state.isOptimized
  };
}

/**
 * Hook for monitoring performance metrics in real-time
 */
export function usePerformanceMetrics(gameId: string, enabled = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    // Update metrics every second
    intervalRef.current = setInterval(() => {
      const currentMetrics = getMobilePerformanceOptimizer().getOptimizationStatus(gameId);
      if (currentMetrics) {
        // Get current metrics from the performance monitor
        // This would need to be exposed from the performance monitor
        // For now, we'll just update the state to trigger re-renders
        setMetrics(prev => ({ ...prev } as PerformanceMetrics));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameId, enabled]);

  return metrics;
}

/**
 * Hook for preload progress tracking
 */
export function usePreloadProgress(gameId: string) {
  const [progress, setProgress] = useState<PreloadProgress | null>(null);

  useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      const { gameId: eventGameId, progress: eventProgress } = event.detail;
      
      if (eventGameId === gameId) {
        setProgress(eventProgress);
      }
    };

    window.addEventListener('gamePreloadProgress', handleProgress as EventListener);
    
    return () => {
      window.removeEventListener('gamePreloadProgress', handleProgress as EventListener);
    };
  }, [gameId]);

  return progress;
}