/**
 * Lazy loading utilities for mobile performance optimization
 */

import React, { useState, useEffect, useRef, lazy } from 'react';

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  enableOnMobile?: boolean;
  fallbackDelay?: number;
}

export interface LazyLoadableComponent {
  id: string;
  element: HTMLElement;
  loader: () => Promise<void>;
  loaded: boolean;
  loading: boolean;
}

class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private components = new Map<string, LazyLoadableComponent>();
  private isMobile = false;

  constructor() {
    this.isMobile = this.detectMobile();
    this.initializeObserver();
  }

  /**
   * Detect if device is mobile
   */
  private detectMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false; // Default to desktop during SSR
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Initialize intersection observer
   */
  private initializeObserver(options: LazyLoadOptions = {}): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for SSR or browsers without IntersectionObserver
      this.fallbackToTimeoutLoading(options.fallbackDelay || 1000);
      return;
    }

    const defaultOptions: LazyLoadOptions = {
      rootMargin: '50px',
      threshold: 0.1,
      enableOnMobile: true,
      ...options
    };

    // Skip lazy loading on mobile if disabled
    if (this.isMobile && !defaultOptions.enableOnMobile) {
      this.loadAllComponents();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentId = entry.target.getAttribute('data-lazy-id');
            if (componentId) {
              this.loadComponent(componentId);
            }
          }
        });
      },
      {
        rootMargin: defaultOptions.rootMargin,
        threshold: defaultOptions.threshold
      }
    );
  }

  /**
   * Register a component for lazy loading
   */
  registerComponent(
    id: string,
    element: HTMLElement,
    loader: () => Promise<void>
  ): void {
    const component: LazyLoadableComponent = {
      id,
      element,
      loader,
      loaded: false,
      loading: false
    };

    this.components.set(id, component);
    element.setAttribute('data-lazy-id', id);

    // Add loading placeholder
    this.addLoadingPlaceholder(element);

    // Start observing
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  /**
   * Load a specific component
   */
  async loadComponent(id: string): Promise<void> {
    const component = this.components.get(id);
    if (!component || component.loaded || component.loading) {
      return;
    }

    component.loading = true;
    this.updateLoadingState(component.element, 'loading');

    try {
      await component.loader();
      component.loaded = true;
      component.loading = false;
      
      this.updateLoadingState(component.element, 'loaded');
      
      // Stop observing this element
      if (this.observer) {
        this.observer.unobserve(component.element);
      }

      // Emit loaded event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('componentLazyLoaded', {
          detail: { id, element: component.element }
        });
        window.dispatchEvent(event);
      }

    } catch (error) {
      component.loading = false;
      this.updateLoadingState(component.element, 'error');
      console.error(`Failed to lazy load component ${id}:`, error);
    }
  }

  /**
   * Load all components immediately
   */
  async loadAllComponents(): Promise<void> {
    const loadPromises = Array.from(this.components.keys()).map(id => 
      this.loadComponent(id)
    );
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Add loading placeholder
   */
  private addLoadingPlaceholder(element: HTMLElement): void {
    if (element.querySelector('.lazy-loading-placeholder')) {
      return; // Already has placeholder
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-loading-placeholder';
    placeholder.innerHTML = `
      <div class="lazy-spinner"></div>
      <div class="lazy-loading-text">Loading...</div>
    `;

    // Add CSS for placeholder
    const style = document.createElement('style');
    style.textContent = `
      .lazy-loading-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        background: #f5f5f5;
        border-radius: 8px;
        color: #666;
      }
      
      .lazy-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: lazy-spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      .lazy-loading-text {
        font-size: 14px;
        font-weight: 500;
      }
      
      @keyframes lazy-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .lazy-loading-state-loading .lazy-loading-placeholder {
        opacity: 1;
      }
      
      .lazy-loading-state-loaded .lazy-loading-placeholder {
        display: none;
      }
      
      .lazy-loading-state-error .lazy-loading-placeholder {
        background: #fee;
        color: #c33;
      }
      
      .lazy-loading-state-error .lazy-loading-text::after {
        content: " Failed to load.";
      }
    `;

    if (!document.head.querySelector('#lazy-loading-styles')) {
      style.id = 'lazy-loading-styles';
      document.head.appendChild(style);
    }

    element.appendChild(placeholder);
  }

  /**
   * Update loading state
   */
  private updateLoadingState(element: HTMLElement, state: 'loading' | 'loaded' | 'error'): void {
    // Remove existing state classes
    element.classList.remove('lazy-loading-state-loading', 'lazy-loading-state-loaded', 'lazy-loading-state-error');
    
    // Add new state class
    element.classList.add(`lazy-loading-state-${state}`);
  }

  /**
   * Fallback loading for browsers without IntersectionObserver
   */
  private fallbackToTimeoutLoading(delay: number): void {
    setTimeout(() => {
      this.loadAllComponents();
    }, delay);
  }

  /**
   * Unregister a component
   */
  unregisterComponent(id: string): void {
    const component = this.components.get(id);
    if (component && this.observer) {
      this.observer.unobserve(component.element);
    }
    this.components.delete(id);
  }

  /**
   * Get component status
   */
  getComponentStatus(id: string): { loaded: boolean; loading: boolean } | null {
    const component = this.components.get(id);
    return component ? { loaded: component.loaded, loading: component.loading } : null;
  }

  /**
   * Destroy lazy loader
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.components.clear();
  }
}

// Singleton instance
export const lazyLoader = new LazyLoader();

/**
 * React hook for lazy loading
 */
export function useLazyLoading(
  id: string,
  loader: () => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: LazyLoadOptions = {}
) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const wrappedLoader = async () => {
      try {
        setLoading(true);
        setError(null);
        await loader();
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Loading failed');
      } finally {
        setLoading(false);
      }
    };

    lazyLoader.registerComponent(id, elementRef.current, wrappedLoader);

    return () => {
      lazyLoader.unregisterComponent(id);
    };
  }, [id, loader]);

  return {
    elementRef,
    loaded,
    loading,
    error,
    loadNow: () => lazyLoader.loadComponent(id)
  };
}

/**
 * Lazy load game assets
 */
export async function lazyLoadGameAssets(gameId: string): Promise<void> {
  const gameAssets = [
    `/games/${gameId}/js/game.js`,
    `/games/${gameId}/assets/sprites.png`,
    `/games/${gameId}/assets/background.png`
  ];

  const loadPromises = gameAssets.map(async (assetUrl) => {
    try {
      if (assetUrl.endsWith('.js')) {
        // Lazy load JavaScript
        const script = document.createElement('script');
        script.src = assetUrl;
        script.async = true;
        
        return new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${assetUrl}`));
          document.head.appendChild(script);
        });
      } else {
        // Lazy load images
        const img = new Image();
        return new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${assetUrl}`));
          img.src = assetUrl;
        });
      }
    } catch (error) {
      console.warn(`Failed to lazy load asset ${assetUrl}:`, error);
    }
  });

  await Promise.allSettled(loadPromises);
}

/**
 * Lazy load React component
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(importFn);
}