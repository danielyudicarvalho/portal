/**
 * Optimized image loading and caching for mobile bandwidth
 */

export interface ImageLoadOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  sizes?: string;
  priority?: boolean;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: { width: number; height: number; density?: number }[];
  options?: ImageLoadOptions;
}

export interface ImageLoadResult {
  success: boolean;
  loadTime: number;
  fromCache: boolean;
  finalUrl: string;
  error?: string;
}

class OptimizedImageLoader {
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<ImageLoadResult>>();
  private intersectionObserver?: IntersectionObserver;
  private loadQueue: Array<{ element: HTMLImageElement; config: ResponsiveImageConfig }> = [];
  private isProcessingQueue = false;

  constructor() {
    // Defer initialization to avoid SSR issues
    if (typeof window !== 'undefined') {
      // Use setTimeout to defer initialization until after hydration
      setTimeout(() => {
        this.initializeIntersectionObserver();
        this.initializeNetworkAwareLoading();
      }, 0);
    }
  }

  /**
   * Load an optimized image with mobile-specific optimizations
   */
  async loadOptimizedImage(config: ResponsiveImageConfig): Promise<ImageLoadResult> {
    const { src, options = {} } = config;
    const cacheKey = this.generateCacheKey(src, options);

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      return {
        success: true,
        loadTime: 0,
        fromCache: true,
        finalUrl: src
      };
    }

    const loadPromise = this.performImageLoad(config);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Create a responsive image element with optimized loading
   */
  createResponsiveImage(config: ResponsiveImageConfig): HTMLImageElement {
    const { src, alt, width, height, sizes, options = {} } = config;
    const img = document.createElement('img');

    // Set basic attributes
    img.alt = alt;
    img.width = width;
    img.height = height;

    // Generate srcset for responsive images
    const srcset = this.generateSrcSet(src, sizes, options);
    if (srcset) {
      img.srcset = srcset;
    }

    // Set sizes attribute for responsive behavior
    if (options.sizes) {
      img.sizes = options.sizes;
    }

    // Handle lazy loading
    if (options.lazy !== false) {
      img.loading = 'lazy';
      
      // Use intersection observer for better control
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(img);
      }
    } else {
      img.loading = 'eager';
    }

    // Set placeholder
    if (options.placeholder === 'blur' && options.blurDataURL) {
      img.src = options.blurDataURL;
      img.style.filter = 'blur(10px)';
      img.style.transition = 'filter 0.3s ease';
    }

    // Handle priority loading
    if (options.priority) {
      img.fetchPriority = 'high';
      this.addToLoadQueue(img, config);
    }

    return img;
  }

  /**
   * Perform the actual image loading
   */
  private async performImageLoad(config: ResponsiveImageConfig): Promise<ImageLoadResult> {
    const startTime = performance.now();
    const { src, options = {} } = config;

    try {
      // Determine optimal image URL based on device capabilities
      const optimizedUrl = await this.getOptimizedImageUrl(src, options);
      
      // Create and load image
      const img = new Image();
      
      const loadResult = await new Promise<ImageLoadResult>((resolve, reject) => {
        img.onload = () => {
          const loadTime = performance.now() - startTime;
          
          // Cache the loaded image
          const cacheKey = this.generateCacheKey(src, options);
          this.imageCache.set(cacheKey, img);
          
          resolve({
            success: true,
            loadTime,
            fromCache: false,
            finalUrl: optimizedUrl
          });
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${optimizedUrl}`));
        };

        // Set source to start loading
        img.src = optimizedUrl;
      });

      return loadResult;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      return {
        success: false,
        loadTime,
        fromCache: false,
        finalUrl: src,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get optimized image URL based on device capabilities and network conditions
   */
  private async getOptimizedImageUrl(src: string, options: ImageLoadOptions): Promise<string> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(src, origin);
    const params = new URLSearchParams();

    // Detect device capabilities
    const devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData
    );

    // Adjust quality based on network conditions
    let quality = options.quality || 85;
    if (isSlowConnection) {
      quality = Math.min(quality, 60); // Reduce quality for slow connections
    }

    // Determine optimal format
    let format = options.format || 'auto';
    if (format === 'auto') {
      format = this.getSupportedImageFormat();
    }

    // Add optimization parameters
    params.set('q', quality.toString());
    params.set('f', format);
    
    // Adjust size for device pixel ratio
    if (devicePixelRatio > 1 && !isSlowConnection) {
      params.set('dpr', Math.min(devicePixelRatio, 2).toString());
    }

    // Add parameters to URL
    url.search = params.toString();
    return url.toString();
  }

  /**
   * Generate srcset for responsive images
   */
  private generateSrcSet(src: string, sizes: ResponsiveImageConfig['sizes'], options: ImageLoadOptions): string {
    return sizes.map(size => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(src, origin);
      const params = new URLSearchParams();
      
      params.set('w', size.width.toString());
      params.set('h', size.height.toString());
      
      if (options.quality) {
        params.set('q', options.quality.toString());
      }
      
      if (options.format && options.format !== 'auto') {
        params.set('f', options.format);
      }

      url.search = params.toString();
      
      const descriptor = size.density ? `${size.density}x` : `${size.width}w`;
      return `${url.toString()} ${descriptor}`;
    }).join(', ');
  }

  /**
   * Get the best supported image format for the browser
   */
  private getSupportedImageFormat(): 'webp' | 'jpeg' | 'png' {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 'jpeg'; // Default for SSR
    }

    // Check WebP support
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      if (webpSupported) {
        return 'webp';
      }
    } catch {
      // WebP not supported
    }

    // Fallback to JPEG
    return 'jpeg';
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeIntersectionObserver(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImageWhenVisible(img);
              this.intersectionObserver!.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before the image enters viewport
        }
      );
    }
  }

  /**
   * Load image when it becomes visible
   */
  private loadImageWhenVisible(img: HTMLImageElement): void {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      
      // Remove blur effect if it was a placeholder
      if (img.style.filter) {
        img.onload = () => {
          img.style.filter = '';
        };
      }
    }
  }

  /**
   * Initialize network-aware loading
   */
  private initializeNetworkAwareLoading(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return; // Skip in SSR
    }

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.adjustLoadingStrategy();
      });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.processLoadQueue();
    });

    window.addEventListener('offline', () => {
      this.pauseLoadQueue();
    });
  }

  /**
   * Adjust loading strategy based on network conditions
   */
  private adjustLoadingStrategy(): void {
    if (typeof navigator === 'undefined') return;
    
    const connection = (navigator as any).connection;
    if (!connection) return;

    const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                           connection.effectiveType === '2g' ||
                           connection.saveData;

    if (isSlowConnection) {
      // Pause non-critical image loading
      this.pauseLoadQueue();
    } else {
      // Resume image loading
      this.processLoadQueue();
    }
  }

  /**
   * Add image to load queue for priority handling
   */
  private addToLoadQueue(img: HTMLImageElement, config: ResponsiveImageConfig): void {
    this.loadQueue.push({ element: img, config });
    
    if (!this.isProcessingQueue) {
      this.processLoadQueue();
    }
  }

  /**
   * Process the image load queue
   */
  private async processLoadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadQueue.length === 0) return;
    
    this.isProcessingQueue = true;

    while (this.loadQueue.length > 0) {
      const { element, config } = this.loadQueue.shift()!;
      
      try {
        await this.loadOptimizedImage(config);
        
        // Update the image element with the optimized source
        const optimizedUrl = await this.getOptimizedImageUrl(config.src, config.options || {});
        element.src = optimizedUrl;
      } catch (error) {
        console.warn('Failed to load priority image:', error);
      }
      
      // Add small delay to prevent overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Pause the load queue
   */
  private pauseLoadQueue(): void {
    this.isProcessingQueue = true;
  }

  /**
   * Generate cache key for image
   */
  private generateCacheKey(src: string, options: ImageLoadOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${src}_${btoa(optionsStr)}`;
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryUsage: number } {
    let memoryUsage = 0;
    
    this.imageCache.forEach(img => {
      // Estimate memory usage (width * height * 4 bytes per pixel)
      memoryUsage += img.width * img.height * 4;
    });

    return {
      size: this.imageCache.size,
      memoryUsage: memoryUsage / (1024 * 1024) // Convert to MB
    };
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages(urls: string[]): Promise<ImageLoadResult[]> {
    const preloadPromises = urls.map(url => 
      this.loadOptimizedImage({
        src: url,
        alt: '',
        width: 0,
        height: 0,
        sizes: [],
        options: { priority: true, lazy: false }
      })
    );

    return Promise.all(preloadPromises);
  }
}

// Singleton instance (client-side only)
let optimizedImageLoaderInstance: OptimizedImageLoader | null = null;

export const getOptimizedImageLoader = (): OptimizedImageLoader => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      loadOptimizedImage: async () => ({ success: false, loadTime: 0, fromCache: false, finalUrl: '', error: 'SSR mode' }),
      preloadImage: async () => ({ success: false, loadTime: 0, fromCache: false, finalUrl: '', error: 'SSR mode' }),
      observeImage: () => {},
      unobserveImage: () => {},
      clearCache: () => {},
      getCacheStats: () => ({ size: 0, hitRate: 0, totalRequests: 0, cacheHits: 0 }),
      getNetworkStats: () => ({ totalRequests: 0, totalBytes: 0, averageLoadTime: 0, slowConnectionDetected: false }),
    } as any;
  }
  
  if (!optimizedImageLoaderInstance) {
    optimizedImageLoaderInstance = new OptimizedImageLoader();
  }
  return optimizedImageLoaderInstance;
};

// Export the getter function instead of a direct instance
export { getOptimizedImageLoader as optimizedImageLoader };

/**
 * Utility function to create optimized image with default mobile settings
 */
export function createMobileOptimizedImage(
  src: string,
  alt: string,
  width: number,
  height: number,
  options: Partial<ImageLoadOptions> = {}
): HTMLImageElement {
  const defaultOptions: ImageLoadOptions = {
    quality: 80,
    format: 'auto',
    lazy: true,
    placeholder: 'empty',
    ...options
  };

  const config: ResponsiveImageConfig = {
    src,
    alt,
    width,
    height,
    sizes: [
      { width: width, height: height },
      { width: width * 2, height: height * 2, density: 2 }
    ],
    options: defaultOptions
  };

  return getOptimizedImageLoader().createResponsiveImage(config);
}