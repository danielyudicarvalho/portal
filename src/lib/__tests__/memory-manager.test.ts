/**
 * Tests for memory manager functionality
 */

import { memoryManager, estimateObjectSize, isLowMemoryDevice } from '../memory-manager';

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  },
  configurable: true
});

// Mock navigator.deviceMemory
Object.defineProperty(navigator, 'deviceMemory', {
  value: 4,
  configurable: true
});

// Mock window.gc
Object.defineProperty(window, 'gc', {
  value: jest.fn(),
  configurable: true
});

describe('MemoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoryManager.stopMonitoring();
  });

  afterEach(() => {
    memoryManager.stopMonitoring();
  });

  describe('getMemoryInfo', () => {
    it('should return memory information when available', () => {
      const memoryInfo = memoryManager.getMemoryInfo();
      
      expect(memoryInfo).toEqual({
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
      });
    });

    it('should return null when memory API is not available', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const memoryInfo = memoryManager.getMemoryInfo();
      expect(memoryInfo).toBeNull();

      (performance as any).memory = originalMemory;
    });
  });

  describe('getMemoryUsageMB', () => {
    it('should return memory usage in MB', () => {
      const usageMB = memoryManager.getMemoryUsageMB();
      expect(usageMB).toBe(50); // 50MB
    });

    it('should return 0 when memory API is not available', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const usageMB = memoryManager.getMemoryUsageMB();
      expect(usageMB).toBe(0);

      (performance as any).memory = originalMemory;
    });
  });

  describe('cacheResource', () => {
    it('should cache a resource', () => {
      const resource = {
        id: 'test-resource',
        data: { test: 'data' },
        size: 1024,
        priority: 'medium' as const
      };

      memoryManager.cacheResource(resource);
      const cached = memoryManager.getCachedResource('test-resource');

      expect(cached).toEqual({ test: 'data' });
    });

    it('should update last accessed time when retrieving cached resource', () => {
      const resource = {
        id: 'test-resource',
        data: { test: 'data' },
        size: 1024,
        priority: 'medium' as const
      };

      memoryManager.cacheResource(resource);
      
      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        const cached = memoryManager.getCachedResource('test-resource');
        expect(cached).toEqual({ test: 'data' });
      }, 10);
    });
  });

  describe('removeCachedResource', () => {
    it('should remove a cached resource', () => {
      const resource = {
        id: 'test-resource',
        data: { test: 'data' },
        size: 1024,
        priority: 'medium' as const
      };

      memoryManager.cacheResource(resource);
      const removed = memoryManager.removeCachedResource('test-resource');
      const cached = memoryManager.getCachedResource('test-resource');

      expect(removed).toBe(true);
      expect(cached).toBeNull();
    });

    it('should return false when removing non-existent resource', () => {
      const removed = memoryManager.removeCachedResource('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('performCleanup', () => {
    it('should perform light cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      memoryManager.performCleanup('light');

      expect(consoleSpy).toHaveBeenCalledWith('Performing light memory cleanup');
      consoleSpy.mockRestore();
    });

    it('should perform moderate cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      memoryManager.performCleanup('moderate');

      expect(consoleSpy).toHaveBeenCalledWith('Performing moderate memory cleanup');
      consoleSpy.mockRestore();
    });

    it('should perform aggressive cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      memoryManager.performCleanup('aggressive');

      expect(consoleSpy).toHaveBeenCalledWith('Performing aggressive memory cleanup');
      expect(window.gc).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('startMonitoring', () => {
    it('should start memory monitoring', () => {
      jest.useFakeTimers();
      const eventSpy = jest.spyOn(window, 'dispatchEvent');

      memoryManager.startMonitoring();

      // Fast-forward time to trigger monitoring
      jest.advanceTimersByTime(10000);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'memoryStatus'
        })
      );

      jest.useRealTimers();
    });
  });

  describe('getMemoryStats', () => {
    it('should return memory statistics', () => {
      const stats = memoryManager.getMemoryStats();

      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('thresholds');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheItems');
      expect(typeof stats.current).toBe('number');
    });
  });
});

describe('estimateObjectSize', () => {
  it('should estimate object size in bytes', () => {
    const obj = { test: 'data', number: 123 };
    const size = estimateObjectSize(obj);
    
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThan(0);
  });
});

describe('isLowMemoryDevice', () => {
  it('should return false for high memory device', () => {
    const isLowMemory = isLowMemoryDevice();
    expect(isLowMemory).toBe(false); // 4GB device memory
  });

  it('should return true for low memory device', () => {
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 2,
      configurable: true
    });

    const isLowMemory = isLowMemoryDevice();
    expect(isLowMemory).toBe(true);

    // Restore original value
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 4,
      configurable: true
    });
  });

  it('should fallback to heap limit when deviceMemory is not available', () => {
    const originalDeviceMemory = (navigator as any).deviceMemory;
    delete (navigator as any).deviceMemory;

    // Mock low heap limit
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024 // 500MB limit (low)
      },
      configurable: true
    });

    const isLowMemory = isLowMemoryDevice();
    expect(isLowMemory).toBe(true);

    // Restore original values
    (navigator as any).deviceMemory = originalDeviceMemory;
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
      },
      configurable: true
    });
  });
});