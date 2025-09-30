import { useEffect, useRef, useCallback } from 'react';
import { TouchInputAdapter, GameConfig } from '../lib/touch-input-adapter';

export interface UseTouchInputAdapterOptions {
  gameConfig: GameConfig;
  enabled?: boolean;
  onAdaptationComplete?: () => void;
  onAdaptationError?: (error: Error) => void;
}

export function useTouchInputAdapter({
  gameConfig,
  enabled = true,
  onAdaptationComplete,
  onAdaptationError
}: UseTouchInputAdapterOptions) {
  const adapterRef = useRef<TouchInputAdapter | null>(null);
  const gameElementRef = useRef<HTMLElement | null>(null);

  // Initialize adapter
  useEffect(() => {
    if (enabled && !adapterRef.current) {
      adapterRef.current = new TouchInputAdapter();
    }

    return () => {
      if (adapterRef.current) {
        adapterRef.current.cleanup();
        adapterRef.current = null;
      }
    };
  }, [enabled]);

  // Adapt game element when config or element changes
  const adaptGameElement = useCallback((element: HTMLElement) => {
    if (!adapterRef.current || !enabled) return;

    try {
      gameElementRef.current = element;
      
      // Adapt keyboard controls to touch
      adapterRef.current.adaptKeyboardControls(element, gameConfig);
      
      // Enable touch gestures
      adapterRef.current.enableTouchGestures(element);
      
      onAdaptationComplete?.();
    } catch (error) {
      onAdaptationError?.(error as Error);
    }
  }, [gameConfig, enabled, onAdaptationComplete, onAdaptationError]);

  // Handle orientation changes
  const handleOrientationChange = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.handleOrientationChange();
    }
  }, []);

  // Optimize viewport
  const optimizeViewport = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.optimizeViewport(gameConfig);
    }
  }, [gameConfig]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.cleanup();
    }
  }, []);

  return {
    adaptGameElement,
    handleOrientationChange,
    optimizeViewport,
    cleanup,
    isEnabled: enabled && !!adapterRef.current
  };
}