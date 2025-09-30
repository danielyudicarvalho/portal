/**
 * Tests for bundle analyzer functionality
 */

import { bundleAnalyzer, isBundleSizeAcceptableForMobile, formatBundleSize } from '../bundle-analyzer';

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn();
mockPerformanceObserver.mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));
window.PerformanceObserver = mockPerformanceObserver;

// Mock performance.timing
Object.defineProperty(performance, 'timing', {
  value: {
    navigationStart: 1000,
    domainLookupStart: 1010,
    domainLookupEnd: 1020,
    connectStart: 1020,
    connectEnd: 1030,
    requestStart: 1030,
    responseStart: 1040,
    responseEnd: 1050,
    domContentLoadedEventEnd: 1200,
    loadEventEnd: 1300
  },
  configurable: true
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  },
  configurable: true
});

// Mock navigator.deviceMemory
Object.defineProperty(navigator, 'deviceMemory', {
  value: 4,
  configurable: true
});

describe('BundleAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeBundles', () => {
    it('should analyze loaded bundles', () => {
      const analysis = bundleAnalyzer.analyzeBundles();

      expect(analysis).toHaveProperty('totalSize');
      expect(analysis).toHaveProperty('totalGzipSize');
      expect(analysis).toHaveProperty('criticalSize');
      expect(analysis).toHaveProperty('bundles');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('mobileOptimized');
      expect(Array.isArray(analysis.bundles)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should identify mobile optimization status', () => {
      const analysis = bundleAnalyzer.analyzeBundles();
      expect(typeof analysis.mobileOptimized).toBe('boolean');
    });
  });

  describe('getLoadTimeMetrics', () => {
    it('should return load time metrics when available', () => {
      const metrics = bundleAnalyzer.getLoadTimeMetrics();

      expect(metrics).toEqual({
        dns: 10, // domainLookupEnd - domainLookupStart
        tcp: 10, // connectEnd - connectStart
        request: 10, // responseStart - requestStart
        response: 10, // responseEnd - responseStart
        dom: 200, // domContentLoadedEventEnd - navigationStart
        load: 300 // loadEventEnd - navigationStart
      });
    });

    it('should return null when performance.timing is not available', () => {
      const originalTiming = performance.timing;
      delete (performance as any).timing;

      const metrics = bundleAnalyzer.getLoadTimeMetrics();
      expect(metrics).toBeNull();

      (performance as any).timing = originalTiming;
    });
  });

  describe('getMobileRecommendations', () => {
    it('should return mobile-specific recommendations', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      const recommendations = bundleAnalyzer.getMobileRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should include network-based recommendations for slow connections', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: 'slow-2g',
          saveData: true
        },
        configurable: true
      });

      const recommendations = bundleAnalyzer.getMobileRecommendations();
      expect(recommendations.some(rec => rec.includes('Slow network'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('Data saver'))).toBe(true);
    });

    it('should include device-based recommendations for low memory devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // Low memory device
        configurable: true
      });

      const recommendations = bundleAnalyzer.getMobileRecommendations();
      expect(recommendations.some(rec => rec.includes('Low memory device'))).toBe(true);

      // Restore original value
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 4,
        configurable: true
      });
    });
  });

  describe('optimizeForMobile', () => {
    it('should optimize bundle loading for mobile', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation();

      bundleAnalyzer.optimizeForMobile();

      // Should create preload links
      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });
  });

  describe('getAnalysisReport', () => {
    it('should generate a detailed analysis report', () => {
      const report = bundleAnalyzer.getAnalysisReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Bundle Analysis Report');
      expect(report).toContain('Total Size:');
      expect(report).toContain('Critical Size:');
      expect(report).toContain('Mobile Optimized:');
    });
  });
});

describe('isBundleSizeAcceptableForMobile', () => {
  it('should return true for acceptable bundle sizes', () => {
    const size = 300 * 1024; // 300KB
    expect(isBundleSizeAcceptableForMobile(size)).toBe(true);
  });

  it('should return false for large bundle sizes', () => {
    const size = 600 * 1024; // 600KB
    expect(isBundleSizeAcceptableForMobile(size)).toBe(false);
  });
});

describe('formatBundleSize', () => {
  it('should format bytes correctly', () => {
    expect(formatBundleSize(512)).toBe('512 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatBundleSize(1024)).toBe('1.00 KB');
    expect(formatBundleSize(1536)).toBe('1.50 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatBundleSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatBundleSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
  });
});