/**
 * React hook for mobile analytics and monitoring
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  getMobileAnalytics, 
  trackMobileEvent, 
  trackMobileError,
  type MobileAnalyticsEvent,
  type MobileError 
} from '../lib/mobile-analytics';
import { 
  getMobilePerformanceMonitor,
  startGamePerformanceMonitoring,
  endGamePerformanceMonitoring,
  measureGameTouchLatency,
  markGameRenderStart,
  markGameRenderEnd,
  type GamePerformanceSession 
} from '../lib/mobile-performance-monitor';

export interface UseMobileAnalyticsOptions {
  gameId?: string;
  trackTouchEvents?: boolean;
  trackPerformance?: boolean;
  autoStartSession?: boolean;
}

export interface MobileAnalyticsHook {
  // Event tracking
  trackEvent: (type: MobileAnalyticsEvent['type'], data?: Record<string, any>) => void;
  trackError: (error: Omit<MobileError, 'timestamp' | 'sessionId' | 'deviceInfo'>) => void;
  
  // Performance monitoring
  startPerformanceSession: (gameId?: string) => void;
  endPerformanceSession: (gameId?: string) => GamePerformanceSession | null;
  measureTouchLatency: (touchEvent: TouchEvent) => void;
  markRenderStart: () => void;
  markRenderEnd: () => void;
  
  // Session info
  currentSession: GamePerformanceSession | undefined;
  
  // Analytics data
  getAnalyticsData: () => {
    events: MobileAnalyticsEvent[];
    performance: any[];
    errors: MobileError[];
  };
  clearAnalyticsData: () => void;
}

export function useMobileAnalytics(options: UseMobileAnalyticsOptions = {}): MobileAnalyticsHook {
  const {
    gameId,
    trackTouchEvents = false,
    trackPerformance = false,
    autoStartSession = false
  } = options;

  const gameIdRef = useRef(gameId);
  const touchEventListenerRef = useRef<((event: TouchEvent) => void) | null>(null);

  // Update gameId ref when it changes
  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  // Auto-start performance session if enabled
  useEffect(() => {
    if (autoStartSession && gameId && trackPerformance) {
      startGamePerformanceMonitoring(gameId);
      
      return () => {
        endGamePerformanceMonitoring(gameId);
      };
    }
  }, [gameId, autoStartSession, trackPerformance]);

  // Set up touch event tracking
  useEffect(() => {
    if (!trackTouchEvents || !gameId) return;

    const handleTouchEvent = (event: TouchEvent) => {
      measureGameTouchLatency(gameId, event);
      
      // Track touch event analytics
      trackMobileEvent('game_start', {
        touchType: event.type,
        touchCount: event.touches.length,
        gameId,
      });
    };

    // Store reference for cleanup
    touchEventListenerRef.current = handleTouchEvent;

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchEvent, { passive: true });
    document.addEventListener('touchmove', handleTouchEvent, { passive: true });
    document.addEventListener('touchend', handleTouchEvent, { passive: true });

    return () => {
      if (touchEventListenerRef.current) {
        document.removeEventListener('touchstart', touchEventListenerRef.current);
        document.removeEventListener('touchmove', touchEventListenerRef.current);
        document.removeEventListener('touchend', touchEventListenerRef.current);
      }
    };
  }, [trackTouchEvents, gameId]);

  // Event tracking functions
  const trackEvent = useCallback((type: MobileAnalyticsEvent['type'], data: Record<string, any> = {}) => {
    const eventData = gameIdRef.current ? { ...data, gameId: gameIdRef.current } : data;
    trackMobileEvent(type, eventData);
  }, []);

  const trackError = useCallback((error: Omit<MobileError, 'timestamp' | 'sessionId' | 'deviceInfo'>) => {
    const errorData = gameIdRef.current && !error.gameId 
      ? { ...error, gameId: gameIdRef.current } 
      : error;
    trackMobileError(errorData);
  }, []);

  // Performance monitoring functions
  const startPerformanceSession = useCallback((sessionGameId?: string) => {
    const targetGameId = sessionGameId || gameIdRef.current;
    if (targetGameId) {
      startGamePerformanceMonitoring(targetGameId);
      trackEvent('game_start', { gameId: targetGameId });
    }
  }, [trackEvent]);

  const endPerformanceSession = useCallback((sessionGameId?: string) => {
    const targetGameId = sessionGameId || gameIdRef.current;
    if (targetGameId) {
      const session = endGamePerformanceMonitoring(targetGameId);
      trackEvent('game_end', { 
        gameId: targetGameId,
        sessionDuration: session ? session.endTime! - session.startTime : 0,
        averageFPS: session?.averageFPS || 0,
        frameDrops: session?.frameDrops || 0,
      });
      return session;
    }
    return null;
  }, [trackEvent]);

  const measureTouchLatency = useCallback((touchEvent: TouchEvent) => {
    if (gameIdRef.current) {
      measureGameTouchLatency(gameIdRef.current, touchEvent);
    }
  }, []);

  const markRenderStart = useCallback(() => {
    if (gameIdRef.current) {
      markGameRenderStart(gameIdRef.current);
    }
  }, []);

  const markRenderEnd = useCallback(() => {
    if (gameIdRef.current) {
      markGameRenderEnd(gameIdRef.current);
    }
  }, []);

  // Get current session
  const currentSession = gameId ? getMobilePerformanceMonitor().getActiveSession(gameId) : undefined;

  // Analytics data functions
  const getAnalyticsData = useCallback(() => {
    return getMobileAnalytics().getStoredAnalytics();
  }, []);

  const clearAnalyticsData = useCallback(() => {
    getMobileAnalytics().clearStoredData();
  }, []);

  return {
    trackEvent,
    trackError,
    startPerformanceSession,
    endPerformanceSession,
    measureTouchLatency,
    markRenderStart,
    markRenderEnd,
    currentSession,
    getAnalyticsData,
    clearAnalyticsData,
  };
}

// Hook for PWA-specific analytics
export function usePWAAnalytics() {
  const { trackEvent, trackError } = useMobileAnalytics();

  const trackPWAInstall = useCallback((stage: 'prompt_shown' | 'installed' | 'dismissed') => {
    trackEvent('pwa_install', { stage });
  }, [trackEvent]);

  const trackPWALaunch = useCallback((mode: 'standalone' | 'browser' | 'fullscreen') => {
    trackEvent('pwa_launch', { mode });
  }, [trackEvent]);

  const trackOfflineUsage = useCallback((isOffline: boolean, availableGames?: number) => {
    trackEvent('offline_mode', { 
      status: isOffline ? 'offline' : 'online',
      availableGames: availableGames || 0,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackError,
    trackPWAInstall,
    trackPWALaunch,
    trackOfflineUsage,
  };
}