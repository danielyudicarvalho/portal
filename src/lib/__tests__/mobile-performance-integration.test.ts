/**
 * Integration tests for mobile performance optimizations
 */

describe('Mobile Performance Integration', () => {
  it('should export lazy loader utilities', () => {
    const { lazyLoader } = require('../lazy-loader');
    expect(lazyLoader).toBeDefined();
    expect(typeof lazyLoader.registerComponent).toBe('function');
    expect(typeof lazyLoader.loadComponent).toBe('function');
  });

  it('should export memory manager utilities', () => {
    const { memoryManager } = require('../memory-manager');
    expect(memoryManager).toBeDefined();
    expect(typeof memoryManager.startMonitoring).toBe('function');
    expect(typeof memoryManager.performCleanup).toBe('function');
  });

  it('should export bundle analyzer utilities', () => {
    const { bundleAnalyzer } = require('../bundle-analyzer');
    expect(bundleAnalyzer).toBeDefined();
    expect(typeof bundleAnalyzer.analyzeBundles).toBe('function');
    expect(typeof bundleAnalyzer.optimizeForMobile).toBe('function');
  });

  it('should have mobile performance optimizer component', () => {
    const MobilePerformanceOptimizer = require('../../components/features/MobilePerformanceOptimizer').default;
    expect(MobilePerformanceOptimizer).toBeDefined();
    expect(typeof MobilePerformanceOptimizer).toBe('function');
  });

  it('should have utility functions', () => {
    const { formatBundleSize, isBundleSizeAcceptableForMobile } = require('../bundle-analyzer');
    const { estimateObjectSize, isLowMemoryDevice } = require('../memory-manager');
    
    expect(typeof formatBundleSize).toBe('function');
    expect(typeof isBundleSizeAcceptableForMobile).toBe('function');
    expect(typeof estimateObjectSize).toBe('function');
    expect(typeof isLowMemoryDevice).toBe('function');
  });

  it('should format bundle sizes correctly', () => {
    const { formatBundleSize } = require('../bundle-analyzer');
    
    expect(formatBundleSize(512)).toBe('512 B');
    expect(formatBundleSize(1024)).toBe('1.00 KB');
    expect(formatBundleSize(1024 * 1024)).toBe('1.00 MB');
  });

  it('should check mobile bundle size limits', () => {
    const { isBundleSizeAcceptableForMobile } = require('../bundle-analyzer');
    
    expect(isBundleSizeAcceptableForMobile(300 * 1024)).toBe(true); // 300KB
    expect(isBundleSizeAcceptableForMobile(600 * 1024)).toBe(false); // 600KB
  });

  it('should estimate object sizes', () => {
    const { estimateObjectSize } = require('../memory-manager');
    
    const obj = { test: 'data', number: 123 };
    const size = estimateObjectSize(obj);
    
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThan(0);
  });
});