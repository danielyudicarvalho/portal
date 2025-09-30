/**
 * Game asset preloader for faster startup times on mobile devices
 */

export interface AssetPreloadConfig {
  gameId: string;
  priority: 'high' | 'medium' | 'low';
  assets: GameAsset[];
  preloadStrategy: 'eager' | 'lazy' | 'viewport';
}

export interface GameAsset {
  url: string;
  type: 'image' | 'audio' | 'script' | 'style' | 'json';
  size?: number;
  critical?: boolean;
}

export interface PreloadResult {
  success: boolean;
  loadTime: number;
  fromCache: boolean;
  error?: string;
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset?: string;
}

class GameAssetPreloader {
  private preloadCache = new Map<string, Promise<PreloadResult>>();
  private progressCallbacks = new Map<string, (progress: PreloadProgress) => void>();
  private abortControllers = new Map<string, AbortController>();

  /**
   * Preload assets for a specific game
   */
  async preloadGameAssets(
    config: AssetPreloadConfig,
    onProgress?: (progress: PreloadProgress) => void
  ): Promise<PreloadResult[]> {
    const { gameId, assets } = config;
    
    // Store progress callback
    if (onProgress) {
      this.progressCallbacks.set(gameId, onProgress);
    }

    // Create abort controller for this preload session
    const abortController = new AbortController();
    this.abortControllers.set(gameId, abortController);

    try {
      // Sort assets by priority (critical first)
      const sortedAssets = this.sortAssetsByPriority(assets);
      
      // Preload critical assets first
      const criticalAssets = sortedAssets.filter(asset => asset.critical);
      const nonCriticalAssets = sortedAssets.filter(asset => !asset.critical);

      const results: PreloadResult[] = [];

      // Load critical assets sequentially for better control
      if (criticalAssets.length > 0) {
        const criticalResults = await this.preloadAssetsSequentially(
          gameId,
          criticalAssets,
          abortController.signal
        );
        results.push(...criticalResults);
      }

      // Load non-critical assets in parallel
      if (nonCriticalAssets.length > 0) {
        const nonCriticalResults = await this.preloadAssetsParallel(
          gameId,
          nonCriticalAssets,
          abortController.signal
        );
        results.push(...nonCriticalResults);
      }

      return results;
    } finally {
      // Cleanup
      this.progressCallbacks.delete(gameId);
      this.abortControllers.delete(gameId);
    }
  }

  /**
   * Preload assets sequentially (for critical assets)
   */
  private async preloadAssetsSequentially(
    gameId: string,
    assets: GameAsset[],
    signal: AbortSignal
  ): Promise<PreloadResult[]> {
    const results: PreloadResult[] = [];
    
    for (let i = 0; i < assets.length; i++) {
      if (signal.aborted) break;
      
      const asset = assets[i];
      this.updateProgress(gameId, i, assets.length, asset.url);
      
      const result = await this.preloadSingleAsset(asset, signal);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Preload assets in parallel (for non-critical assets)
   */
  private async preloadAssetsParallel(
    gameId: string,
    assets: GameAsset[],
    signal: AbortSignal
  ): Promise<PreloadResult[]> {
    const preloadPromises = assets.map(asset => 
      this.preloadSingleAsset(asset, signal)
    );
    
    // Use Promise.allSettled to handle partial failures
    const settledResults = await Promise.allSettled(preloadPromises);
    
    return settledResults.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, loadTime: 0, fromCache: false, error: 'Promise rejected' }
    );
  }

  /**
   * Preload a single asset
   */
  private async preloadSingleAsset(
    asset: GameAsset,
    signal: AbortSignal
  ): Promise<PreloadResult> {
    const startTime = performance.now();
    
    // Check if already cached
    const cacheKey = `preload_${asset.url}`;
    if (this.preloadCache.has(cacheKey)) {
      const cachedResult = await this.preloadCache.get(cacheKey)!;
      return { ...cachedResult, fromCache: true };
    }

    try {
      await this.loadAssetByType(asset, signal);
      const loadTime = performance.now() - startTime;
      
      const preloadResult: PreloadResult = {
        success: true,
        loadTime,
        fromCache: false
      };

      // Cache the result
      this.preloadCache.set(cacheKey, Promise.resolve(preloadResult));
      
      return preloadResult;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      return {
        success: false,
        loadTime,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Load asset based on its type
   */
  private async loadAssetByType(asset: GameAsset, signal: AbortSignal): Promise<void> {
    switch (asset.type) {
      case 'image':
        return this.preloadImage(asset.url, signal);
      case 'audio':
        return this.preloadAudio(asset.url, signal);
      case 'script':
        return this.preloadScript(asset.url, signal);
      case 'style':
        return this.preloadStyle(asset.url, signal);
      case 'json':
        return this.preloadJSON(asset.url, signal);
      default:
        return this.preloadGeneric(asset.url, signal);
    }
  }

  /**
   * Preload image asset
   */
  private preloadImage(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve();
      };
      
      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      signal.addEventListener('abort', () => {
        cleanup();
        reject(new Error('Aborted'));
      });

      img.src = url;
    });
  }

  /**
   * Preload audio asset
   */
  private preloadAudio(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      const cleanup = () => {
        audio.oncanplaythrough = null;
        audio.onerror = null;
      };

      audio.oncanplaythrough = () => {
        cleanup();
        resolve();
      };
      
      audio.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load audio: ${url}`));
      };

      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      signal.addEventListener('abort', () => {
        cleanup();
        reject(new Error('Aborted'));
      });

      audio.preload = 'auto';
      audio.src = url;
    });
  }

  /**
   * Preload script asset
   */
  private preloadScript(url: string, signal: AbortSignal): Promise<void> {
    return this.preloadWithFetch(url, signal);
  }

  /**
   * Preload style asset
   */
  private preloadStyle(url: string, signal: AbortSignal): Promise<void> {
    return this.preloadWithFetch(url, signal);
  }

  /**
   * Preload JSON asset
   */
  private preloadJSON(url: string, signal: AbortSignal): Promise<void> {
    return this.preloadWithFetch(url, signal);
  }

  /**
   * Preload generic asset using fetch
   */
  private preloadGeneric(url: string, signal: AbortSignal): Promise<void> {
    return this.preloadWithFetch(url, signal);
  }

  /**
   * Preload using fetch API
   */
  private async preloadWithFetch(url: string, signal: AbortSignal): Promise<void> {
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Read the response to ensure it's fully loaded
    await response.blob();
  }

  /**
   * Sort assets by priority
   */
  private sortAssetsByPriority(assets: GameAsset[]): GameAsset[] {
    return [...assets].sort((a, b) => {
      // Critical assets first
      if (a.critical && !b.critical) return -1;
      if (!a.critical && b.critical) return 1;
      
      // Then by size (smaller first for faster loading)
      if (a.size && b.size) {
        return a.size - b.size;
      }
      
      return 0;
    });
  }

  /**
   * Update preload progress
   */
  private updateProgress(gameId: string, loaded: number, total: number, currentAsset?: string): void {
    const callback = this.progressCallbacks.get(gameId);
    if (callback) {
      callback({
        loaded,
        total,
        percentage: Math.round((loaded / total) * 100),
        currentAsset
      });
    }
  }

  /**
   * Cancel preloading for a specific game
   */
  cancelPreload(gameId: string): void {
    const controller = this.abortControllers.get(gameId);
    if (controller) {
      controller.abort();
    }
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.preloadCache.size;
  }

  /**
   * Check if asset is preloaded
   */
  isAssetPreloaded(url: string): boolean {
    return this.preloadCache.has(`preload_${url}`);
  }
}

// Singleton instance (client-side only)
let gameAssetPreloaderInstance: GameAssetPreloader | null = null;

export const getGameAssetPreloader = (): GameAssetPreloader => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      preloadAssets: async () => ({ success: false, loadedAssets: [], failedAssets: [], totalLoadTime: 0 }),
      preloadCriticalAssets: async () => ({ success: false, loadedAssets: [], failedAssets: [], totalLoadTime: 0 }),
      getPreloadProgress: () => ({ loaded: 0, total: 0, percentage: 0, currentAsset: '', status: 'idle' }),
      clearCache: () => {},
      getCacheStats: () => ({ size: 0, hitRate: 0, totalRequests: 0, cacheHits: 0 }),
    } as any;
  }
  
  if (!gameAssetPreloaderInstance) {
    gameAssetPreloaderInstance = new GameAssetPreloader();
  }
  return gameAssetPreloaderInstance;
};

// Export the getter function instead of a direct instance
export { getGameAssetPreloader as gameAssetPreloader };

/**
 * Generate asset configuration for common game types
 */
export function generateAssetConfig(gameId: string, gameType: string): AssetPreloadConfig {
  const baseAssets: GameAsset[] = [
    { url: `/games/${gameId}/index.html`, type: 'script', critical: true },
    { url: `/games/${gameId}/js/game.js`, type: 'script', critical: true }
  ];

  // Add type-specific assets
  switch (gameType) {
    case 'canvas':
      baseAssets.push(
        { url: `/games/${gameId}/assets/sprites.png`, type: 'image', critical: true },
        { url: `/games/${gameId}/assets/background.png`, type: 'image', critical: false }
      );
      break;
    case 'audio':
      baseAssets.push(
        { url: `/games/${gameId}/sounds/music.wav`, type: 'audio', critical: false },
        { url: `/games/${gameId}/sounds/effects.wav`, type: 'audio', critical: false }
      );
      break;
  }

  return {
    gameId,
    priority: 'high',
    assets: baseAssets,
    preloadStrategy: 'eager'
  };
}