/**
 * Mobile Analytics and Monitoring System
 * Tracks PWA usage, performance metrics, and mobile-specific events
 */

export interface MobileAnalyticsEvent {
  type: 'pwa_install' | 'pwa_launch' | 'game_start' | 'game_end' | 'orientation_change' | 'offline_mode' | 'error';
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  orientation: string;
  isStandalone: boolean;
  connectionType?: string;
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface PerformanceMetrics {
  gameId: string;
  loadTime: number;
  fps: number[];
  memoryUsage: number[];
  touchLatency: number[];
  renderTime: number[];
  timestamp: number;
}

export interface MobileError {
  type: 'touch_input' | 'game_load' | 'orientation' | 'performance' | 'network' | 'pwa';
  message: string;
  stack?: string;
  gameId?: string;
  deviceInfo: DeviceInfo;
  timestamp: number;
  sessionId: string;
}

class MobileAnalytics {
  private sessionId: string;
  private events: MobileAnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private errors: MobileError[] = [];
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  private generateSessionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Start periodic flushing
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Initialize client-side tracking only
    if (typeof window !== 'undefined') {
      // Track PWA launch
      this.trackEvent('pwa_launch', {
        launchMode: this.getDisplayMode(),
        referrer: document.referrer,
      });

      // Track orientation changes
      window.addEventListener('orientationchange', () => {
        this.trackEvent('orientation_change', {
          orientation: screen.orientation?.type || 'unknown',
          angle: screen.orientation?.angle || 0,
        });
      });

      // Track online/offline status
      window.addEventListener('online', () => {
        this.trackEvent('offline_mode', { status: 'online' });
      });

      window.addEventListener('offline', () => {
        this.trackEvent('offline_mode', { status: 'offline' });
      });

      // Track PWA installation
      window.addEventListener('beforeinstallprompt', () => {
        this.trackEvent('pwa_install', { stage: 'prompt_shown' });
      });

      // Track app installation
      window.addEventListener('appinstalled', () => {
        this.trackEvent('pwa_install', { stage: 'installed' });
      });
    }
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        screenWidth: 0,
        screenHeight: 0,
        devicePixelRatio: 1,
        orientation: 'unknown',
        isStandalone: false,
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const memory = (performance as any).memory;

    return {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      connectionType: connection?.effectiveType,
      memoryInfo: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : undefined,
    };
  }

  private getDisplayMode(): string {
    if (typeof window === 'undefined') return 'browser';
    
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
      if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
      if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    } catch {
      // Fallback if matchMedia is not available
    }
    return 'browser';
  }

  public trackEvent(type: MobileAnalyticsEvent['type'], data: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    const event: MobileAnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      deviceInfo: this.getDeviceInfo(),
    };

    this.events.push(event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackPerformance(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const performanceData: PerformanceMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(performanceData);
  }

  public trackError(error: Omit<MobileError, 'timestamp' | 'sessionId' | 'deviceInfo'>): void {
    if (!this.isEnabled) return;

    const errorData: MobileError = {
      ...error,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: this.getDeviceInfo(),
    };

    this.errors.push(errorData);

    // Also track as an event
    this.trackEvent('error', {
      errorType: error.type,
      message: error.message,
      gameId: error.gameId,
    });

    // Immediately flush errors for quick reporting
    this.flushErrors();
  }

  public flush(): void {
    if (this.events.length > 0) {
      this.sendAnalytics(this.events);
      this.events = [];
    }

    if (this.performanceMetrics.length > 0) {
      this.sendPerformanceMetrics(this.performanceMetrics);
      this.performanceMetrics = [];
    }
  }

  private flushErrors(): void {
    if (this.errors.length > 0) {
      this.sendErrors(this.errors);
      this.errors = [];
    }
  }

  private async sendAnalytics(events: MobileAnalyticsEvent[]): Promise<void> {
    try {
      // Store locally for now - in production, this would send to analytics service
      const stored = localStorage.getItem('mobile_analytics') || '[]';
      const existingEvents = JSON.parse(stored);
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = allEvents.slice(-1000);
      localStorage.setItem('mobile_analytics', JSON.stringify(recentEvents));

      console.log('Mobile Analytics Events:', events);
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  private async sendPerformanceMetrics(metrics: PerformanceMetrics[]): Promise<void> {
    try {
      // Store locally for now - in production, this would send to monitoring service
      const stored = localStorage.getItem('mobile_performance') || '[]';
      const existingMetrics = JSON.parse(stored);
      const allMetrics = [...existingMetrics, ...metrics];
      
      // Keep only last 500 performance entries
      const recentMetrics = allMetrics.slice(-500);
      localStorage.setItem('mobile_performance', JSON.stringify(recentMetrics));

      console.log('Mobile Performance Metrics:', metrics);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  private async sendErrors(errors: MobileError[]): Promise<void> {
    try {
      // Store locally for now - in production, this would send to error reporting service
      const stored = localStorage.getItem('mobile_errors') || '[]';
      const existingErrors = JSON.parse(stored);
      const allErrors = [...existingErrors, ...errors];
      
      // Keep only last 200 errors
      const recentErrors = allErrors.slice(-200);
      localStorage.setItem('mobile_errors', JSON.stringify(recentErrors));

      console.error('Mobile Errors:', errors);
    } catch (error) {
      console.error('Failed to send error reports:', error);
    }
  }

  public getStoredAnalytics(): {
    events: MobileAnalyticsEvent[];
    performance: PerformanceMetrics[];
    errors: MobileError[];
  } {
    try {
      return {
        events: JSON.parse(localStorage.getItem('mobile_analytics') || '[]'),
        performance: JSON.parse(localStorage.getItem('mobile_performance') || '[]'),
        errors: JSON.parse(localStorage.getItem('mobile_errors') || '[]'),
      };
    } catch {
      return { events: [], performance: [], errors: [] };
    }
  }

  public clearStoredData(): void {
    localStorage.removeItem('mobile_analytics');
    localStorage.removeItem('mobile_performance');
    localStorage.removeItem('mobile_errors');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
    this.flushErrors();
  }
}

// Singleton instance (client-side only)
let mobileAnalyticsInstance: MobileAnalytics | null = null;

export const getMobileAnalytics = (): MobileAnalytics => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      trackEvent: () => {},
      trackPerformance: () => {},
      trackError: () => {},
      getSessionData: () => ({ sessionId: '', startTime: 0, events: [], performance: [], errors: [] }),
      clearSession: () => {},
    } as any;
  }
  
  if (!mobileAnalyticsInstance) {
    mobileAnalyticsInstance = new MobileAnalytics();
  }
  return mobileAnalyticsInstance;
};

// Export the getter function instead of a direct instance
export { getMobileAnalytics as mobileAnalytics };

// Convenience functions
export const trackMobileEvent = (type: MobileAnalyticsEvent['type'], data?: Record<string, any>) => {
  getMobileAnalytics().trackEvent(type, data);
};

export const trackMobilePerformance = (metrics: Omit<PerformanceMetrics, 'timestamp'>) => {
  getMobileAnalytics().trackPerformance(metrics);
};

export const trackMobileError = (error: Omit<MobileError, 'timestamp' | 'sessionId' | 'deviceInfo'>) => {
  getMobileAnalytics().trackError(error);
};