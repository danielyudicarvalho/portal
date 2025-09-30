/**
 * Bundle size analyzer and optimizer for mobile performance
 */

import { useState, useEffect, useCallback } from 'react';

export interface BundleInfo {
  name: string;
  size: number;
  gzipSize?: number;
  loadTime?: number;
  critical: boolean;
}

export interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  criticalSize: number;
  bundles: BundleInfo[];
  recommendations: string[];
  mobileOptimized: boolean;
}

export interface LoadTimeMetrics {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
}

class BundleAnalyzer {
  private loadedBundles = new Map<string, BundleInfo>();
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePerformanceObserver();
    }
  }

  /**
   * Initialize performance observer to track resource loading
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('_next/static') || entry.name.includes('.js') || entry.name.includes('.css')) {
          this.trackBundleLoad(entry as PerformanceResourceTiming);
        }
      });
    });

    this.performanceObserver.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track bundle loading performance
   */
  private trackBundleLoad(entry: PerformanceResourceTiming): void {
    const bundleName = this.extractBundleName(entry.name);
    const size = entry.transferSize || 0;
    const loadTime = entry.responseEnd - entry.startTime;

    const bundleInfo: BundleInfo = {
      name: bundleName,
      size,
      loadTime,
      critical: this.isCriticalBundle(bundleName)
    };

    this.loadedBundles.set(bundleName, bundleInfo);
  }

  /**
   * Extract bundle name from URL
   */
  private extractBundleName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  /**
   * Check if bundle is critical for initial load
   */
  private isCriticalBundle(bundleName: string): boolean {
    const criticalPatterns = [
      'main-',
      'framework-',
      'webpack-',
      'polyfills-',
      '_app-',
      'pages/_app'
    ];

    return criticalPatterns.some(pattern => bundleName.includes(pattern));
  }

  /**
   * Analyze current bundle performance
   */
  analyzeBundles(): BundleAnalysis {
    const bundles = Array.from(this.loadedBundles.values());
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const criticalBundles = bundles.filter(bundle => bundle.critical);
    const criticalSize = criticalBundles.reduce((sum, bundle) => sum + bundle.size, 0);

    const analysis: BundleAnalysis = {
      totalSize,
      totalGzipSize: totalSize * 0.3, // Estimate gzip compression
      criticalSize,
      bundles,
      recommendations: this.generateRecommendations(bundles, totalSize, criticalSize),
      mobileOptimized: this.isMobileOptimized(totalSize, criticalSize)
    };

    return analysis;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(bundles: BundleInfo[], totalSize: number, criticalSize: number): string[] {
    const recommendations: string[] = [];

    // Size-based recommendations
    if (totalSize > 1024 * 1024) { // > 1MB
      recommendations.push('Total bundle size exceeds 1MB - consider code splitting');
    }

    if (criticalSize > 512 * 1024) { // > 512KB
      recommendations.push('Critical bundle size exceeds 512KB - optimize initial load');
    }

    // Bundle-specific recommendations
    const largeBundles = bundles.filter(bundle => bundle.size > 200 * 1024); // > 200KB
    if (largeBundles.length > 0) {
      recommendations.push(`Large bundles detected: ${largeBundles.map(b => b.name).join(', ')}`);
    }

    // Load time recommendations
    const slowBundles = bundles.filter(bundle => bundle.loadTime && bundle.loadTime > 1000); // > 1s
    if (slowBundles.length > 0) {
      recommendations.push('Some bundles are loading slowly - check network conditions or bundle size');
    }

    // Mobile-specific recommendations
    if (!this.isMobileDevice()) {
      recommendations.push('Consider mobile-specific optimizations for better mobile performance');
    }

    return recommendations;
  }

  /**
   * Check if bundles are mobile optimized
   */
  private isMobileOptimized(totalSize: number, criticalSize: number): boolean {
    // Mobile optimization criteria
    const maxTotalSize = 800 * 1024; // 800KB
    const maxCriticalSize = 300 * 1024; // 300KB

    return totalSize <= maxTotalSize && criticalSize <= maxCriticalSize;
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Get load time metrics
   */
  getLoadTimeMetrics(): LoadTimeMetrics | null {
    if (typeof window === 'undefined' || !('performance' in window) || !performance.timing) {
      return null;
    }

    const timing = performance.timing;
    
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart
    };
  }

  /**
   * Get bundle size recommendations for mobile
   */
  getMobileRecommendations(): string[] {
    const recommendations: string[] = [];
    const analysis = this.analyzeBundles();

    if (this.isMobileDevice()) {
      // Mobile-specific recommendations
      if (analysis.totalSize > 500 * 1024) { // > 500KB on mobile
        recommendations.push('Bundle size too large for mobile - implement aggressive code splitting');
      }

      if (analysis.criticalSize > 200 * 1024) { // > 200KB critical on mobile
        recommendations.push('Critical bundle too large for mobile - defer non-essential code');
      }

      // Network-based recommendations
      if (typeof navigator !== 'undefined') {
        const connection = (navigator as any).connection;
        if (connection) {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            recommendations.push('Slow network detected - minimize bundle sizes and enable aggressive caching');
          }

          if (connection.saveData) {
            recommendations.push('Data saver mode detected - serve minimal bundles');
          }
        }

        // Device-based recommendations
        if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
          recommendations.push('Low memory device - optimize for memory usage');
        }
      }
    }

    return recommendations;
  }

  /**
   * Optimize bundle loading for mobile
   */
  optimizeForMobile(): void {
    // Preload critical resources
    this.preloadCriticalResources();

    // Lazy load non-critical resources
    this.lazyLoadNonCriticalResources();

    // Optimize images
    this.optimizeImages();

    // Enable compression
    this.enableCompression();
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    if (typeof document === 'undefined') return;
    
    const criticalBundles = Array.from(this.loadedBundles.values())
      .filter(bundle => bundle.critical)
      .sort((a, b) => (a.loadTime || 0) - (b.loadTime || 0)); // Sort by load time

    criticalBundles.forEach(bundle => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = bundle.name.endsWith('.css') ? 'style' : 'script';
      link.href = bundle.name;
      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load non-critical resources
   */
  private lazyLoadNonCriticalResources(): void {
    if (typeof document === 'undefined') return;
    
    const nonCriticalBundles = Array.from(this.loadedBundles.values())
      .filter(bundle => !bundle.critical);

    nonCriticalBundles.forEach(bundle => {
      if (bundle.name.endsWith('.js')) {
        const script = document.createElement('script');
        script.src = bundle.name;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    });
  }

  /**
   * Optimize images for mobile
   */
  private optimizeImages(): void {
    if (typeof document === 'undefined') return;
    
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" for non-critical images
      if (!img.hasAttribute('data-critical')) {
        img.loading = 'lazy';
      }

      // Add decoding="async" for better performance
      img.decoding = 'async';
    });
  }

  /**
   * Enable compression headers
   */
  private enableCompression(): void {
    if (typeof document === 'undefined') return;
    
    // This would typically be handled by the server/CDN
    // But we can add hints for the browser
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Accept-Encoding';
    meta.content = 'gzip, deflate, br';
    document.head.appendChild(meta);
  }

  /**
   * Get bundle analysis report
   */
  getAnalysisReport(): string {
    const analysis = this.analyzeBundles();
    const loadMetrics = this.getLoadTimeMetrics();

    let report = `Bundle Analysis Report\n`;
    report += `========================\n\n`;
    report += `Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB\n`;
    report += `Critical Size: ${(analysis.criticalSize / 1024).toFixed(2)} KB\n`;
    report += `Mobile Optimized: ${analysis.mobileOptimized ? 'Yes' : 'No'}\n\n`;

    if (loadMetrics) {
      report += `Load Time Metrics:\n`;
      report += `- DOM Ready: ${loadMetrics.dom}ms\n`;
      report += `- Full Load: ${loadMetrics.load}ms\n\n`;
    }

    report += `Bundles:\n`;
    analysis.bundles.forEach(bundle => {
      report += `- ${bundle.name}: ${(bundle.size / 1024).toFixed(2)} KB`;
      if (bundle.loadTime) {
        report += ` (${bundle.loadTime.toFixed(0)}ms)`;
      }
      if (bundle.critical) {
        report += ` [CRITICAL]`;
      }
      report += `\n`;
    });

    if (analysis.recommendations.length > 0) {
      report += `\nRecommendations:\n`;
      analysis.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * Destroy bundle analyzer
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    this.loadedBundles.clear();
  }
}

// Singleton instance (client-side only)
let bundleAnalyzerInstance: BundleAnalyzer | null = null;

export const getBundleAnalyzer = (): BundleAnalyzer => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      analyzeBundles: () => ({ totalSize: 0, totalGzipSize: 0, criticalSize: 0, bundles: [], recommendations: [], mobileOptimized: true }),
      getMobileRecommendations: () => [],
      getAnalysisReport: () => 'SSR Mode - No analysis available',
      optimizeForMobile: () => {},
      destroy: () => {}
    } as any;
  }
  
  if (!bundleAnalyzerInstance) {
    bundleAnalyzerInstance = new BundleAnalyzer();
  }
  return bundleAnalyzerInstance;
};

// Export the getter function instead of a direct instance
export { getBundleAnalyzer as bundleAnalyzer };

/**
 * React hook for bundle analysis
 */
export function useBundleAnalysis() {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeNow = useCallback(() => {
    setIsAnalyzing(true);
    
    // Small delay to ensure all resources are loaded
    setTimeout(() => {
      const result = getBundleAnalyzer().analyzeBundles();
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Auto-analyze after page load
    if (document.readyState === 'complete') {
      analyzeNow();
    } else {
      window.addEventListener('load', analyzeNow);
      return () => window.removeEventListener('load', analyzeNow);
    }
  }, [analyzeNow]);

  return {
    analysis,
    isAnalyzing,
    analyzeNow,
    getReport: getBundleAnalyzer().getAnalysisReport.bind(getBundleAnalyzer()),
    getMobileRecommendations: getBundleAnalyzer().getMobileRecommendations.bind(getBundleAnalyzer())
  };
}

/**
 * Utility to check if bundle size is acceptable for mobile
 */
export function isBundleSizeAcceptableForMobile(sizeInBytes: number): boolean {
  const maxMobileSize = 500 * 1024; // 500KB
  return sizeInBytes <= maxMobileSize;
}

/**
 * Utility to format bundle size
 */
export function formatBundleSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}