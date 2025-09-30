/**
 * Performance Integration Tests
 * 
 * Tests for mobile performance optimization and monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Mobile Performance Monitor', () => {
    it('should track FPS correctly', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      monitor.startSession();

      // Simulate frame rendering
      for (let i = 0; i < 60; i++) {
        monitor.recordFrameTime(16.67); // 60 FPS
      }

      const metrics = monitor.getMetrics();
      expect(metrics.averageFPS).toBeCloseTo(60, 1);
      expect(metrics.frameCount).toBe(60);
    });

    it('should detect performance issues', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      monitor.startSession();

      // Simulate poor performance
      for (let i = 0; i < 30; i++) {
        monitor.recordFrameTime(50); // 20 FPS
      }

      const warnings = monitor.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.type === 'low_fps')).toBe(true);
    });

    it('should provide optimization recommendations', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      monitor.startSession();

      // Simulate various performance issues
      monitor.recordFrameTime(100); // Very slow frame
      monitor.recordLoadTime(5000); // Slow load time

      const recommendations = monitor.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('texture quality'))).toBe(true);
    });
  });

  describe('Performance Optimizer', () => {
    it('should apply mobile optimizations', async () => {
      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      
      const optimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'aggressive',
      });

      const optimizations = await optimizer.optimize();
      
      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
      expect(optimizations.length).toBeGreaterThan(0);
    });

    it('should handle different optimization strategies', async () => {
      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      
      const conservativeOptimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'conservative',
      });

      const aggressiveOptimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'aggressive',
      });

      const conservativeOpts = await conservativeOptimizer.optimize();
      const aggressiveOpts = await aggressiveOptimizer.optimize();

      expect(aggressiveOpts.length).toBeGreaterThanOrEqual(conservativeOpts.length);
    });
  });

  describe('Memory Management', () => {
    it('should monitor memory usage', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 100 * 1024 * 1024, // 100MB
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
        },
        writable: true,
      });

      const monitor = new MobilePerformanceMonitor('test-game');
      const memoryUsage = monitor.getMemoryUsage();

      expect(memoryUsage.used).toBe(50 * 1024 * 1024);
      expect(memoryUsage.total).toBe(100 * 1024 * 1024);
      expect(memoryUsage.percentage).toBe(50);
    });

    it('should warn about high memory usage', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024, // 180MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
        },
        writable: true,
      });

      const monitor = new MobilePerformanceMonitor('test-game');
      const warnings = monitor.getWarnings();

      expect(warnings.some(w => w.type === 'high_memory')).toBe(true);
    });
  });

  describe('Network Performance', () => {
    it('should track asset loading times', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      
      monitor.recordAssetLoadTime('texture.png', 500);
      monitor.recordAssetLoadTime('sound.mp3', 200);
      monitor.recordAssetLoadTime('script.js', 800);

      const metrics = monitor.getMetrics();
      expect(metrics.totalAssetLoadTime).toBe(1500);
      expect(metrics.averageAssetLoadTime).toBe(500);
    });

    it('should detect slow network conditions', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
        },
        writable: true,
      });

      const monitor = new MobilePerformanceMonitor('test-game');
      const networkInfo = monitor.getNetworkInfo();

      expect(networkInfo.effectiveType).toBe('2g');
      expect(networkInfo.downlink).toBe(0.5);
      expect(networkInfo.rtt).toBe(2000);

      const warnings = monitor.getWarnings();
      expect(warnings.some(w => w.type === 'slow_network')).toBe(true);
    });
  });

  describe('Battery Performance', () => {
    it('should monitor battery status', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: jest.fn().mockResolvedValue({
          level: 0.3, // 30%
          charging: false,
          chargingTime: Infinity,
          dischargingTime: 3600, // 1 hour
        }),
        writable: true,
      });

      const monitor = new MobilePerformanceMonitor('test-game');
      const batteryInfo = await monitor.getBatteryInfo();

      expect(batteryInfo.level).toBe(0.3);
      expect(batteryInfo.charging).toBe(false);
      expect(batteryInfo.dischargingTime).toBe(3600);
    });

    it('should adjust performance based on battery level', async () => {
      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      
      // Mock low battery
      Object.defineProperty(navigator, 'getBattery', {
        value: jest.fn().mockResolvedValue({
          level: 0.15, // 15%
          charging: false,
        }),
        writable: true,
      });

      const optimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'battery_saver',
      });

      const optimizations = await optimizer.optimize();
      
      expect(optimizations.some(opt => 
        opt.includes('reduce frame rate') || 
        opt.includes('disable effects')
      )).toBe(true);
    });
  });

  describe('Thermal Management', () => {
    it('should detect device overheating', async () => {
      const { MobilePerformanceMonitor } = await import('@/lib/mobile-performance-monitor');
      
      const monitor = new MobilePerformanceMonitor('test-game');
      
      // Simulate high CPU usage over time
      for (let i = 0; i < 100; i++) {
        monitor.recordFrameTime(33); // 30 FPS - moderate load
      }

      // Simulate thermal throttling
      monitor.recordThermalState('critical');

      const warnings = monitor.getWarnings();
      expect(warnings.some(w => w.type === 'thermal_throttling')).toBe(true);
    });

    it('should reduce performance when overheating', async () => {
      const { MobilePerformanceOptimizer } = await import('@/lib/mobile-performance-optimizer');
      
      const optimizer = new MobilePerformanceOptimizer({
        gameId: 'test-game',
        strategy: 'thermal_aware',
      });

      // Simulate overheating
      optimizer.setThermalState('critical');

      const optimizations = await optimizer.optimize();
      
      expect(optimizations.some(opt => 
        opt.includes('reduce quality') || 
        opt.includes('lower frame rate')
      )).toBe(true);
    });
  });
});