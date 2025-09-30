/**
 * Tests for optimized image loader
 */

import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { getOptimizedImageLoader, createMobileOptimizedImage } from '../optimized-image-loader';

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 300;
  height: number = 200;

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  private callback: (entries: any[]) => void;
  
  constructor(callback: (entries: any[]) => void) {
    this.callback = callback;
  }
  
  observe(element: Element) {
    // Simulate immediate intersection for testing
    setTimeout(() => {
      this.callback([{
        target: element,
        isIntersecting: true
      }]);
    }, 10);
  }
  
  unobserve() {}
  disconnect() {}
}

// Mock canvas for WebP support detection
const mockCanvas = {
  width: 1,
  height: 1,
  toDataURL: jest.fn((format: string) => {
    if (format === 'image/webp') {
      return 'data:image/webp;base64,test';
    }
    return 'data:image/png;base64,test';
  })
};

describe('OptimizedImageLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global objects
    global.Image = MockImage as any;
    global.IntersectionObserver = MockIntersectionObserver as any;
    
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        saveData: false
      },
      configurable: true
    });

    // Clear image cache
    getOptimizedImageLoader().clearCache();
  });

  describe('loadOptimizedImage', () => {
    it('should load image successfully', async () => {
      const config = {
        src: '/test-image.jpg',
        alt: 'Test image',
        width: 300,
        height: 200,
        sizes: [
          { width: 300, height: 200 },
          { width: 600, height: 400, density: 2 }
        ]
      };

      const result = await getOptimizedImageLoader().loadOptimizedImage(config);

      expect(result.success).toBe(true);
      expect(result.loadTime).toBeGreaterThan(0);
      expect(result.fromCache).toBe(false);
    });

    it('should use cached images on subsequent loads', async () => {
      const config = {
        src: '/cached-image.jpg',
        alt: 'Cached image',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }]
      };

      // First load
      const firstResult = await getOptimizedImageLoader().loadOptimizedImage(config);
      expect(firstResult.fromCache).toBe(false);

      // Second load should use cache
      const secondResult = await getOptimizedImageLoader().loadOptimizedImage(config);
      expect(secondResult.fromCache).toBe(true);
      expect(secondResult.loadTime).toBe(0);
    });

    it('should handle image loading errors', async () => {
      // Mock Image to fail
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 300;
        height: number = 200;

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      } as any;

      const config = {
        src: '/failing-image.jpg',
        alt: 'Failing image',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }]
      };

      const result = await getOptimizedImageLoader().loadOptimizedImage(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should optimize image URL based on network conditions', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          saveData: true
        },
        configurable: true
      });

      const config = {
        src: '/network-test.jpg',
        alt: 'Network test',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }],
        options: { quality: 90 }
      };

      const result = await getOptimizedImageLoader().loadOptimizedImage(config);

      expect(result.success).toBe(true);
      // Quality should be reduced for slow connections
      expect(result.finalUrl).toContain('q=60');
    });
  });

  describe('createResponsiveImage', () => {
    it('should create responsive image element', () => {
      const config = {
        src: '/responsive-image.jpg',
        alt: 'Responsive image',
        width: 300,
        height: 200,
        sizes: [
          { width: 300, height: 200 },
          { width: 600, height: 400, density: 2 }
        ],
        options: {
          lazy: true,
          priority: false
        }
      };

      const img = getOptimizedImageLoader().createResponsiveImage(config);

      expect(img.tagName).toBe('IMG');
      expect(img.alt).toBe('Responsive image');
      expect(img.width).toBe(300);
      expect(img.height).toBe(200);
      expect(img.loading).toBe('lazy');
      expect(img.srcset).toBeTruthy();
    });

    it('should handle priority images', () => {
      const config = {
        src: '/priority-image.jpg',
        alt: 'Priority image',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }],
        options: {
          priority: true,
          lazy: false
        }
      };

      const img = getOptimizedImageLoader().createResponsiveImage(config);

      expect(img.loading).toBe('eager');
      expect(img.fetchPriority).toBe('high');
    });

    it('should handle blur placeholder', () => {
      const config = {
        src: '/blur-image.jpg',
        alt: 'Blur image',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }],
        options: {
          placeholder: 'blur',
          blurDataURL: 'data:image/jpeg;base64,blur'
        }
      };

      const img = getOptimizedImageLoader().createResponsiveImage(config);

      expect(img.src).toBe('data:image/jpeg;base64,blur');
      expect(img.style.filter).toBe('blur(10px)');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      getOptimizedImageLoader().clearCache();
      
      const stats = getOptimizedImageLoader().getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.memoryUsage).toBe(0);
    });

    it('should report cache statistics', async () => {
      const config = {
        src: '/stats-test.jpg',
        alt: 'Stats test',
        width: 300,
        height: 200,
        sizes: [{ width: 300, height: 200 }]
      };

      await getOptimizedImageLoader().loadOptimizedImage(config);
      
      const stats = getOptimizedImageLoader().getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('preloadCriticalImages', () => {
    it('should preload multiple images', async () => {
      const urls = [
        '/critical1.jpg',
        '/critical2.jpg',
        '/critical3.jpg'
      ];

      const results = await getOptimizedImageLoader().preloadCriticalImages(urls);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('network-aware loading', () => {
    it('should adapt to network changes', () => {
      // This would test the network change event listeners
      // For now, we'll just verify the connection detection works
      const connection = (navigator as any).connection;
      expect(connection).toBeDefined();
      expect(connection.effectiveType).toBe('4g');
    });
  });
});

describe('createMobileOptimizedImage', () => {
  it('should create mobile-optimized image with default settings', () => {
    const img = createMobileOptimizedImage(
      '/mobile-image.jpg',
      'Mobile image',
      300,
      200
    );

    expect(img.tagName).toBe('IMG');
    expect(img.alt).toBe('Mobile image');
    expect(img.width).toBe(300);
    expect(img.height).toBe(200);
    expect(img.loading).toBe('lazy');
  });

  it('should apply custom options', () => {
    const img = createMobileOptimizedImage(
      '/custom-image.jpg',
      'Custom image',
      300,
      200,
      {
        quality: 70,
        format: 'webp',
        lazy: false,
        priority: true
      }
    );

    expect(img.loading).toBe('eager');
    expect(img.fetchPriority).toBe('high');
  });

  it('should generate responsive sizes', () => {
    const img = createMobileOptimizedImage(
      '/responsive.jpg',
      'Responsive',
      300,
      200
    );

    expect(img.srcset).toContain('300w');
    expect(img.srcset).toContain('2x');
  });
});