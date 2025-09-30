/**
 * OrientationManager - Handles device orientation changes and viewport management
 */

export type Orientation = 'portrait' | 'landscape';
export type ViewportMode = 'fit' | 'fill' | 'stretch';

export interface ViewportConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  scaleMode: ViewportMode;
  lockOrientation?: Orientation;
}

export interface OrientationChangeEvent {
  orientation: Orientation;
  angle: number;
  width: number;
  height: number;
}

export class OrientationManager {
  private listeners: ((event: OrientationChangeEvent) => void)[] = [];
  private currentOrientation: Orientation = 'portrait';
  private viewportMetaTag: HTMLMetaElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Initialize current orientation
    this.updateOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Create or get viewport meta tag
    this.setupViewportMetaTag();
  }

  private setupViewportMetaTag(): void {
    this.viewportMetaTag = document.querySelector('meta[name="viewport"]');
    
    if (!this.viewportMetaTag) {
      this.viewportMetaTag = document.createElement('meta');
      this.viewportMetaTag.name = 'viewport';
      document.head.appendChild(this.viewportMetaTag);
    }
  }

  private updateOrientation(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.currentOrientation = width > height ? 'landscape' : 'portrait';
  }

  private handleOrientationChange(): void {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      this.updateOrientation();
      this.notifyListeners();
    }, 100);
  }

  private handleResize(): void {
    this.updateOrientation();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const event: OrientationChangeEvent = {
      orientation: this.currentOrientation,
      angle: this.getOrientationAngle(),
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.listeners.forEach(listener => listener(event));
  }

  private getOrientationAngle(): number {
    if ('orientation' in screen) {
      return (screen.orientation as any).angle || 0;
    }
    return (window as any).orientation || 0;
  }

  /**
   * Add listener for orientation changes
   */
  addOrientationListener(listener: (event: OrientationChangeEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current orientation
   */
  getCurrentOrientation(): Orientation {
    return this.currentOrientation;
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape(): boolean {
    return this.currentOrientation === 'landscape';
  }

  /**
   * Check if device is in portrait mode
   */
  isPortrait(): boolean {
    return this.currentOrientation === 'portrait';
  }

  /**
   * Set viewport meta tag for specific configuration
   */
  setViewportConfig(config: ViewportConfig): void {
    if (!this.viewportMetaTag) return;

    let content = 'width=device-width, initial-scale=1.0';
    
    if (config.minWidth) {
      content += `, minimum-scale=${config.minWidth / window.innerWidth}`;
    }
    
    if (config.maxWidth) {
      content += `, maximum-scale=${config.maxWidth / window.innerWidth}`;
    }

    // Disable zoom for games that need precise control
    if (config.scaleMode === 'fit' || config.scaleMode === 'fill') {
      content += ', user-scalable=no';
    }

    this.viewportMetaTag.content = content;
  }

  /**
   * Reset viewport to default
   */
  resetViewport(): void {
    if (!this.viewportMetaTag) return;
    this.viewportMetaTag.content = 'width=device-width, initial-scale=1.0';
  }

  /**
   * Lock orientation if supported
   */
  async lockOrientation(orientation: Orientation): Promise<boolean> {
    if (!('orientation' in screen) || !('lock' in (screen as any).orientation)) {
      return false;
    }

    try {
      const orientationLock = orientation === 'landscape' ? 'landscape' : 'portrait';
      await (screen as any).orientation.lock(orientationLock);
      return true;
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      return false;
    }
  }

  /**
   * Unlock orientation if supported
   */
  unlockOrientation(): void {
    if ('orientation' in screen && 'unlock' in (screen as any).orientation) {
      try {
        (screen as any).orientation.unlock();
      } catch (error) {
        console.warn('Failed to unlock orientation:', error);
      }
    }
  }

  /**
   * Get optimal viewport dimensions for current orientation
   */
  getOptimalViewport(): { width: number; height: number } {
    const { innerWidth, innerHeight } = window;
    
    return {
      width: innerWidth,
      height: innerHeight
    };
  }

  /**
   * Calculate scale factor for fitting content
   */
  calculateScaleFactor(
    contentWidth: number,
    contentHeight: number,
    mode: ViewportMode = 'fit'
  ): number {
    const { width: viewportWidth, height: viewportHeight } = this.getOptimalViewport();
    
    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    
    switch (mode) {
      case 'fit':
        return Math.min(scaleX, scaleY);
      case 'fill':
        return Math.max(scaleX, scaleY);
      case 'stretch':
        return 1; // Let CSS handle stretching
      default:
        return 1;
    }
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.listeners = [];
  }
}

// Singleton instance
let orientationManagerInstance: OrientationManager | null = null;

export const getOrientationManager = (): OrientationManager => {
  if (!orientationManagerInstance) {
    orientationManagerInstance = new OrientationManager();
  }
  return orientationManagerInstance;
};