/**
 * Memory management utilities for mobile devices
 */

import { useState, useEffect } from 'react';

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  cleanup: number; // MB
}

export interface MemoryManagerConfig {
  thresholds: MemoryThresholds;
  checkInterval: number; // ms
  enableAutoCleanup: boolean;
  enableGarbageCollection: boolean;
}

export interface CacheableResource {
  id: string;
  data: unknown;
  size: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
}

class MemoryManager {
  private config: MemoryManagerConfig;
  private cache = new Map<string, CacheableResource>();
  private intervalId: NodeJS.Timeout | null = null;
  private listeners = new Set<(info: MemoryInfo) => void>();
  private isMonitoring = false;

  constructor(config?: Partial<MemoryManagerConfig>) {
    this.config = {
      thresholds: {
        warning: 50, // 50MB
        critical: 80, // 80MB
        cleanup: 100 // 100MB
      },
      checkInterval: 10000, // 10 seconds
      enableAutoCleanup: true,
      enableGarbageCollection: true,
      ...config
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.checkInterval);

    // Initial check
    this.checkMemoryUsage();
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Get current memory information
   */
  getMemoryInfo(): MemoryInfo | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsageMB(): number {
    const info = this.getMemoryInfo();
    return info ? info.usedJSHeapSize / (1024 * 1024) : 0;
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  private checkMemoryUsage(): void {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    const usageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);

    // Notify listeners
    this.listeners.forEach(listener => listener(memoryInfo));

    // Auto cleanup if enabled
    if (this.config.enableAutoCleanup) {
      if (usageMB >= this.config.thresholds.cleanup) {
        this.performCleanup('aggressive');
      } else if (usageMB >= this.config.thresholds.critical) {
        this.performCleanup('moderate');
      } else if (usageMB >= this.config.thresholds.warning) {
        this.performCleanup('light');
      }
    }

    // Emit memory status event
    const event = new CustomEvent('memoryStatus', {
      detail: {
        usage: usageMB,
        threshold: this.getMemoryThreshold(usageMB),
        info: memoryInfo
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current memory threshold level
   */
  private getMemoryThreshold(usageMB: number): 'normal' | 'warning' | 'critical' | 'cleanup' {
    if (usageMB >= this.config.thresholds.cleanup) return 'cleanup';
    if (usageMB >= this.config.thresholds.critical) return 'critical';
    if (usageMB >= this.config.thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Perform memory cleanup
   */
  performCleanup(level: 'light' | 'moderate' | 'aggressive' = 'moderate'): void {
    console.log(`Performing ${level} memory cleanup`);

    switch (level) {
      case 'light':
        this.cleanupLowPriorityCache();
        break;
      case 'moderate':
        this.cleanupLowPriorityCache();
        this.cleanupMediumPriorityCache();
        this.cleanupUnusedGameAssets();
        break;
      case 'aggressive':
        this.clearAllCache();
        this.cleanupUnusedGameAssets();
        this.cleanupDOMElements();
        this.triggerGarbageCollection();
        break;
    }

    // Emit cleanup event
    const event = new CustomEvent('memoryCleanup', {
      detail: { level, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Cache a resource with memory management
   */
  cacheResource(resource: Omit<CacheableResource, 'lastAccessed'>): void {
    const cacheableResource: CacheableResource = {
      ...resource,
      lastAccessed: Date.now()
    };

    this.cache.set(resource.id, cacheableResource);

    // Check if we need to cleanup after adding
    const totalCacheSize = this.getTotalCacheSize();
    if (totalCacheSize > 50 * 1024 * 1024) { // 50MB cache limit
      this.cleanupLeastRecentlyUsed();
    }
  }

  /**
   * Get cached resource
   */
  getCachedResource(id: string): unknown | null {
    const resource = this.cache.get(id);
    if (resource) {
      resource.lastAccessed = Date.now();
      return resource.data;
    }
    return null;
  }

  /**
   * Remove cached resource
   */
  removeCachedResource(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * Get total cache size in bytes
   */
  private getTotalCacheSize(): number {
    let total = 0;
    this.cache.forEach(resource => {
      total += resource.size;
    });
    return total;
  }

  /**
   * Cleanup low priority cache items
   */
  private cleanupLowPriorityCache(): void {
    const toDelete: string[] = [];
    
    this.cache.forEach((resource, id) => {
      if (resource.priority === 'low') {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.cache.delete(id));
    console.log(`Cleaned up ${toDelete.length} low priority cache items`);
  }

  /**
   * Cleanup medium priority cache items
   */
  private cleanupMediumPriorityCache(): void {
    const toDelete: string[] = [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.cache.forEach((resource, id) => {
      if (resource.priority === 'medium' && resource.lastAccessed < oneHourAgo) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.cache.delete(id));
    console.log(`Cleaned up ${toDelete.length} medium priority cache items`);
  }

  /**
   * Cleanup least recently used items
   */
  private cleanupLeastRecentlyUsed(): void {
    const resources = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove oldest 25% of items
    const toRemove = Math.ceil(resources.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(resources[i][0]);
    }

    console.log(`Cleaned up ${toRemove} least recently used cache items`);
  }

  /**
   * Clear all cache
   */
  private clearAllCache(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`Cleared all ${count} cache items`);
  }

  /**
   * Cleanup unused game assets
   */
  private cleanupUnusedGameAssets(): void {
    // Remove unused images from DOM
    const images = document.querySelectorAll('img[data-game-asset]');
    images.forEach(img => {
      const htmlImg = img as HTMLImageElement;
      if (!htmlImg.complete || htmlImg.naturalWidth === 0) {
        htmlImg.remove();
      }
    });

    // Remove unused audio elements
    const audioElements = document.querySelectorAll('audio[data-game-asset]');
    audioElements.forEach(audio => {
      const htmlAudio = audio as HTMLAudioElement;
      if (htmlAudio.paused && htmlAudio.currentTime === 0) {
        htmlAudio.remove();
      }
    });

    // Remove unused canvas elements
    const canvases = document.querySelectorAll('canvas[data-game-asset]');
    canvases.forEach(canvas => {
      const htmlCanvas = canvas as HTMLCanvasElement;
      if (!htmlCanvas.parentElement || htmlCanvas.style.display === 'none') {
        htmlCanvas.remove();
      }
    });
  }

  /**
   * Cleanup DOM elements
   */
  private cleanupDOMElements(): void {
    // Remove hidden elements that are not needed
    const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
    hiddenElements.forEach(element => {
      if (!element.hasAttribute('data-keep-hidden')) {
        element.remove();
      }
    });

    // Remove empty text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.trim() === '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const emptyTextNodes: Node[] = [];
    let node;
    while (node = walker.nextNode()) {
      emptyTextNodes.push(node);
    }

    emptyTextNodes.forEach(textNode => {
      if (textNode.parentNode) {
        textNode.parentNode.removeChild(textNode);
      }
    });
  }

  /**
   * Trigger garbage collection if available
   */
  private triggerGarbageCollection(): void {
    if (this.config.enableGarbageCollection && 'gc' in window) {
      try {
        (window as any).gc();
        console.log('Triggered garbage collection');
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
      }
    }
  }

  /**
   * Add memory status listener
   */
  addMemoryListener(listener: (info: MemoryInfo) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove memory status listener
   */
  removeMemoryListener(listener: (info: MemoryInfo) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    current: number;
    thresholds: MemoryThresholds;
    cacheSize: number;
    cacheItems: number;
  } {
    return {
      current: this.getMemoryUsageMB(),
      thresholds: this.config.thresholds,
      cacheSize: this.getTotalCacheSize() / (1024 * 1024), // MB
      cacheItems: this.cache.size
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MemoryManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy memory manager
   */
  destroy(): void {
    this.stopMonitoring();
    this.clearAllCache();
    this.listeners.clear();
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();

/**
 * React hook for memory management
 */
export function useMemoryManager(autoStart = true) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<'normal' | 'warning' | 'critical' | 'cleanup'>('normal');

  useEffect(() => {
    if (autoStart) {
      memoryManager.startMonitoring();
    }

    const handleMemoryStatus = (event: CustomEvent) => {
      const { threshold, info } = event.detail;
      setMemoryInfo(info);
      setMemoryStatus(threshold);
    };

    window.addEventListener('memoryStatus', handleMemoryStatus as EventListener);

    return () => {
      window.removeEventListener('memoryStatus', handleMemoryStatus as EventListener);
      if (autoStart) {
        memoryManager.stopMonitoring();
      }
    };
  }, [autoStart]);

  return {
    memoryInfo,
    memoryStatus,
    memoryStats: memoryManager.getMemoryStats(),
    performCleanup: memoryManager.performCleanup.bind(memoryManager),
    cacheResource: memoryManager.cacheResource.bind(memoryManager),
    getCachedResource: memoryManager.getCachedResource.bind(memoryManager)
  };
}

/**
 * Utility to estimate object size in bytes
 */
export function estimateObjectSize(obj: unknown): number {
  const jsonString = JSON.stringify(obj);
  return new Blob([jsonString]).size;
}

/**
 * Utility to check if device has low memory
 */
export function isLowMemoryDevice(): boolean {
  // Check device memory if available
  if ('deviceMemory' in navigator) {
    return (navigator as any).deviceMemory < 4; // Less than 4GB
  }

  // Fallback: check current memory usage
  const memoryInfo = memoryManager.getMemoryInfo();
  if (memoryInfo) {
    const limitMB = memoryInfo.jsHeapSizeLimit / (1024 * 1024);
    return limitMB < 1000; // Less than 1GB heap limit
  }

  return false;
}