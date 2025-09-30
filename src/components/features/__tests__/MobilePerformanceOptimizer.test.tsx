/**
 * Tests for MobilePerformanceOptimizer component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobilePerformanceOptimizer from '../MobilePerformanceOptimizer';

// Mock the performance optimization libraries
jest.mock('../../../lib/lazy-loader', () => ({
  lazyLoader: {
    registerComponent: jest.fn(),
    loadComponent: jest.fn().mockResolvedValue(undefined),
    unregisterComponent: jest.fn(),
    getComponentStatus: jest.fn().mockReturnValue({ loaded: false, loading: false })
  }
}));

jest.mock('../../../lib/memory-manager', () => ({
  memoryManager: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    performCleanup: jest.fn(),
    getMemoryUsageMB: jest.fn().mockReturnValue(45),
    cacheResource: jest.fn(),
    getMemoryStats: jest.fn().mockReturnValue({
      current: 45,
      thresholds: { warning: 50, critical: 80, cleanup: 100 },
      cacheSize: 10,
      cacheItems: 5
    })
  },
  useMemoryManager: jest.fn().mockReturnValue({
    memoryInfo: {
      usedJSHeapSize: 45 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
    },
    memoryStatus: 'normal',
    memoryStats: {
      current: 45,
      thresholds: { warning: 50, critical: 80, cleanup: 100 },
      cacheSize: 10,
      cacheItems: 5
    },
    performCleanup: jest.fn(),
    cacheResource: jest.fn(),
    getCachedResource: jest.fn()
  })
}));

jest.mock('../../../lib/bundle-analyzer', () => ({
  bundleAnalyzer: {
    optimizeForMobile: jest.fn(),
    analyzeBundles: jest.fn().mockReturnValue({
      totalSize: 500 * 1024,
      totalGzipSize: 150 * 1024,
      criticalSize: 200 * 1024,
      bundles: [],
      recommendations: ['Test recommendation'],
      mobileOptimized: true
    }),
    getAnalysisReport: jest.fn().mockReturnValue('Test report')
  },
  useBundleAnalysis: jest.fn().mockReturnValue({
    analysis: {
      totalSize: 500 * 1024,
      totalGzipSize: 150 * 1024,
      criticalSize: 200 * 1024,
      bundles: [],
      recommendations: ['Test recommendation'],
      mobileOptimized: true
    },
    isAnalyzing: false,
    analyzeNow: jest.fn(),
    getReport: jest.fn().mockReturnValue('Test report'),
    getMobileRecommendations: jest.fn().mockReturnValue(['Mobile recommendation'])
  })
}));

jest.mock('../../../hooks/useMobilePerformance', () => ({
  useMobilePerformance: jest.fn().mockReturnValue({
    isOptimizing: false,
    isOptimized: false,
    metrics: null,
    preloadProgress: null,
    recommendations: ['Performance recommendation'],
    warnings: [],
    error: null,
    startOptimization: jest.fn(),
    stopOptimization: jest.fn(),
    getPerformanceHistory: jest.fn().mockReturnValue([]),
    isMobileDevice: jest.fn().mockReturnValue(true),
    getNetworkInfo: jest.fn().mockReturnValue({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    }),
    getDeviceCapabilities: jest.fn().mockReturnValue({
      memory: 4,
      cores: 4,
      pixelRatio: 2,
      screenSize: { width: 375, height: 667 }
    }),
    isSupported: true,
    shouldOptimize: true
  })
}));

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName: string) => ({
    tagName: tagName.toUpperCase(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    style: {},
    rel: '',
    as: '',
    href: '',
    async: false,
    defer: false
  }))
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn().mockReturnValue([])
});

Object.defineProperty(document.head, 'appendChild', {
  value: jest.fn()
});

describe('MobilePerformanceOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when showDebugInfo is false', () => {
    const { container } = render(
      <MobilePerformanceOptimizer showDebugInfo={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render debug interface when showDebugInfo is true', () => {
    render(
      <MobilePerformanceOptimizer showDebugInfo={true} />
    );
    
    expect(screen.getByText('Mobile Performance Status')).toBeInTheDocument();
    expect(screen.getByText('⏸️ Idle')).toBeInTheDocument();
  });

  it('should show optimization controls', () => {
    render(
      <MobilePerformanceOptimizer showDebugInfo={true} />
    );
    
    expect(screen.getByText('Optimize Now')).toBeInTheDocument();
    expect(screen.getByText('Clean Memory')).toBeInTheDocument();
    expect(screen.getByText('Analyze Bundles')).toBeInTheDocument();
  });

  it('should handle optimize button click', async () => {
    render(
      <MobilePerformanceOptimizer 
        showDebugInfo={true}
        autoOptimize={false}
      />
    );
    
    const optimizeButton = screen.getByText('Optimize Now');
    fireEvent.click(optimizeButton);
    
    // Should show optimizing state
    await waitFor(() => {
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
    });
  });

  it('should handle clean memory button click', () => {
    const { useMemoryManager } = jest.requireActual('../../../lib/memory-manager');
    const mockPerformCleanup = jest.fn();
    
    useMemoryManager.mockReturnValue({
      ...useMemoryManager(),
      performCleanup: mockPerformCleanup
    });

    render(
      <MobilePerformanceOptimizer showDebugInfo={true} />
    );
    
    const cleanButton = screen.getByText('Clean Memory');
    fireEvent.click(cleanButton);
    
    expect(mockPerformCleanup).toHaveBeenCalledWith('moderate');
  });

  it('should handle analyze bundles button click', () => {
    const { useBundleAnalysis } = jest.requireActual('../../../lib/bundle-analyzer');
    const mockAnalyzeNow = jest.fn();
    
    useBundleAnalysis.mockReturnValue({
      ...useBundleAnalysis(),
      analyzeNow: mockAnalyzeNow
    });

    render(
      <MobilePerformanceOptimizer showDebugInfo={true} />
    );
    
    const analyzeButton = screen.getByText('Analyze Bundles');
    fireEvent.click(analyzeButton);
    
    expect(mockAnalyzeNow).toHaveBeenCalled();
  });

  it('should auto-optimize when autoOptimize is true', async () => {
    render(
      <MobilePerformanceOptimizer 
        showDebugInfo={true}
        autoOptimize={true}
      />
    );
    
    // Should automatically start optimization
    await waitFor(() => {
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
    });
  });

  it('should show debug information when available', () => {
    render(
      <MobilePerformanceOptimizer 
        showDebugInfo={true}
        autoOptimize={false}
      />
    );
    
    // Check for debug sections
    expect(screen.getByText('Memory Status')).toBeInTheDocument();
    expect(screen.getByText('Bundle Analysis')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Device Info')).toBeInTheDocument();
  });

  it('should handle different optimization states', () => {
    const { container } = render(
      <MobilePerformanceOptimizer showDebugInfo={true} />
    );
    
    // Initial state should be idle
    expect(screen.getByText('⏸️ Idle')).toBeInTheDocument();
    expect(container.querySelector('.status-idle')).toBeInTheDocument();
  });

  it('should handle game-specific optimization', () => {
    render(
      <MobilePerformanceOptimizer 
        gameId="test-game"
        showDebugInfo={true}
        autoOptimize={false}
      />
    );
    
    expect(screen.getByText('Mobile Performance Status')).toBeInTheDocument();
  });

  it('should handle optimization with all features enabled', () => {
    render(
      <MobilePerformanceOptimizer 
        enableLazyLoading={true}
        enableMemoryManagement={true}
        enableBundleOptimization={true}
        showDebugInfo={true}
        autoOptimize={false}
      />
    );
    
    expect(screen.getByText('Optimize Now')).toBeInTheDocument();
  });

  it('should handle optimization with features disabled', () => {
    render(
      <MobilePerformanceOptimizer 
        enableLazyLoading={false}
        enableMemoryManagement={false}
        enableBundleOptimization={false}
        showDebugInfo={true}
        autoOptimize={false}
      />
    );
    
    expect(screen.getByText('Optimize Now')).toBeInTheDocument();
  });

  it('should cleanup on unmount', () => {
    const { memoryManager } = jest.requireActual('../../../lib/memory-manager');
    
    const { unmount } = render(
      <MobilePerformanceOptimizer 
        enableMemoryManagement={true}
        showDebugInfo={true}
      />
    );
    
    unmount();
    
    expect(memoryManager.stopMonitoring).toHaveBeenCalled();
  });
});