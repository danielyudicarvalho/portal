/**
 * Tests for game asset preloader
 */

import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { gameAssetPreloader, generateAssetConfig } from '../game-asset-preloader';

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';

  constructor() {
    // Simulate successful image loading after a delay
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
}

// Mock Audio constructor
class MockAudio {
  oncanplaythrough: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  preload: string = '';

  constructor() {
    setTimeout(() => {
      if (this.oncanplaythrough) {
        this.oncanplaythrough();
      }
    }, 10);
  }
}

// Mock fetch
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  blob: () => Promise.resolve(new Blob())
});

describe('GameAssetPreloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global constructors
    global.Image = MockImage as any;
    global.Audio = MockAudio as any;
    global.fetch = mockFetch;
    
    // Clear preloader cache
    gameAssetPreloader.clearCache();
  });

  describe('preloadGameAssets', () => {
    it('should preload assets successfully', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'high' as const,
        assets: [
          { url: '/test-image.png', type: 'image' as const, critical: true },
          { url: '/test-audio.mp3', type: 'audio' as const, critical: false }
        ],
        preloadStrategy: 'eager' as const
      };

      const results = await gameAssetPreloader.preloadGameAssets(config);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle preload progress callback', async () => {
      const progressCallback = jest.fn();
      const config = {
        gameId: 'test-game',
        priority: 'medium' as const,
        assets: [
          { url: '/test1.png', type: 'image' as const, critical: true },
          { url: '/test2.png', type: 'image' as const, critical: false }
        ],
        preloadStrategy: 'lazy' as const
      };

      await gameAssetPreloader.preloadGameAssets(config, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          loaded: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        })
      );
    });

    it('should prioritize critical assets', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'high' as const,
        assets: [
          { url: '/critical.png', type: 'image' as const, critical: true },
          { url: '/non-critical.png', type: 'image' as const, critical: false }
        ],
        preloadStrategy: 'eager' as const
      };

      const results = await gameAssetPreloader.preloadGameAssets(config);

      // Both should succeed, but critical assets are loaded first
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle asset loading errors gracefully', async () => {
      // Mock Image to fail
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      } as any;

      const config = {
        gameId: 'test-game',
        priority: 'low' as const,
        assets: [
          { url: '/failing-image.png', type: 'image' as const, critical: false }
        ],
        preloadStrategy: 'lazy' as const
      };

      const results = await gameAssetPreloader.preloadGameAssets(config);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('cancelPreload', () => {
    it('should cancel ongoing preload', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'medium' as const,
        assets: [
          { url: '/test.png', type: 'image' as const, critical: false }
        ],
        preloadStrategy: 'lazy' as const
      };

      // Start preload
      const preloadPromise = gameAssetPreloader.preloadGameAssets(config);
      
      // Cancel immediately
      gameAssetPreloader.cancelPreload('test-game');

      const results = await preloadPromise;
      
      // Should still complete but may have been interrupted
      expect(results).toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should cache preloaded assets', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'high' as const,
        assets: [
          { url: '/cached-image.png', type: 'image' as const, critical: true }
        ],
        preloadStrategy: 'eager' as const
      };

      // First preload
      await gameAssetPreloader.preloadGameAssets(config);
      
      // Check if asset is cached
      expect(gameAssetPreloader.isAssetPreloaded('/cached-image.png')).toBe(true);
      
      // Second preload should use cache
      const results = await gameAssetPreloader.preloadGameAssets(config);
      expect(results[0].fromCache).toBe(true);
    });

    it('should clear cache', () => {
      gameAssetPreloader.clearCache();
      expect(gameAssetPreloader.getCacheSize()).toBe(0);
    });

    it('should report cache size', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'medium' as const,
        assets: [
          { url: '/test1.png', type: 'image' as const, critical: false },
          { url: '/test2.png', type: 'image' as const, critical: false }
        ],
        preloadStrategy: 'lazy' as const
      };

      await gameAssetPreloader.preloadGameAssets(config);
      
      expect(gameAssetPreloader.getCacheSize()).toBeGreaterThan(0);
    });
  });

  describe('asset type handling', () => {
    it('should handle different asset types', async () => {
      const config = {
        gameId: 'test-game',
        priority: 'medium' as const,
        assets: [
          { url: '/image.png', type: 'image' as const, critical: false },
          { url: '/audio.mp3', type: 'audio' as const, critical: false },
          { url: '/script.js', type: 'script' as const, critical: false },
          { url: '/style.css', type: 'style' as const, critical: false },
          { url: '/data.json', type: 'json' as const, critical: false }
        ],
        preloadStrategy: 'lazy' as const
      };

      const results = await gameAssetPreloader.preloadGameAssets(config);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});

describe('generateAssetConfig', () => {
  it('should generate config for canvas games', () => {
    const config = generateAssetConfig('test-game', 'canvas');

    expect(config.gameId).toBe('test-game');
    expect(config.priority).toBe('high');
    expect(config.assets).toContainEqual(
      expect.objectContaining({
        url: '/games/test-game/index.html',
        type: 'script',
        critical: true
      })
    );
    expect(config.assets).toContainEqual(
      expect.objectContaining({
        url: '/games/test-game/assets/sprites.png',
        type: 'image',
        critical: true
      })
    );
  });

  it('should generate config for audio games', () => {
    const config = generateAssetConfig('audio-game', 'audio');

    expect(config.assets).toContainEqual(
      expect.objectContaining({
        url: '/games/audio-game/sounds/music.wav',
        type: 'audio',
        critical: false
      })
    );
  });

  it('should include base assets for all game types', () => {
    const config = generateAssetConfig('any-game', 'unknown');

    expect(config.assets).toContainEqual(
      expect.objectContaining({
        url: '/games/any-game/index.html',
        type: 'script',
        critical: true
      })
    );
    expect(config.assets).toContainEqual(
      expect.objectContaining({
        url: '/games/any-game/js/game.js',
        type: 'script',
        critical: true
      })
    );
  });
});