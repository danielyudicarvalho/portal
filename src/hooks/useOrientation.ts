'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getOrientationManager, 
  type Orientation, 
  type OrientationChangeEvent,
  type ViewportConfig 
} from '@/lib/orientation-manager';

export interface UseOrientationOptions {
  viewportConfig?: ViewportConfig;
  lockOrientation?: Orientation;
  onOrientationChange?: (event: OrientationChangeEvent) => void;
}

export interface UseOrientationReturn {
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  dimensions: { width: number; height: number };
  lockOrientation: (orientation: Orientation) => Promise<boolean>;
  unlockOrientation: () => void;
  setViewportConfig: (config: ViewportConfig) => void;
  resetViewport: () => void;
}

export const useOrientation = (options: UseOrientationOptions = {}): UseOrientationReturn => {
  const { viewportConfig, lockOrientation: initialLockOrientation, onOrientationChange } = options;
  const orientationManager = getOrientationManager();
  
  const [orientation, setOrientation] = useState<Orientation>(
    orientationManager.getCurrentOrientation()
  );
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const handleOrientationChange = useCallback((event: OrientationChangeEvent) => {
    setOrientation(event.orientation);
    setDimensions({ width: event.width, height: event.height });
    onOrientationChange?.(event);
  }, [onOrientationChange]);

  const lockOrientation = useCallback(async (targetOrientation: Orientation): Promise<boolean> => {
    return await orientationManager.lockOrientation(targetOrientation);
  }, [orientationManager]);

  const unlockOrientation = useCallback(() => {
    orientationManager.unlockOrientation();
  }, [orientationManager]);

  const setViewportConfig = useCallback((config: ViewportConfig) => {
    orientationManager.setViewportConfig(config);
  }, [orientationManager]);

  const resetViewport = useCallback(() => {
    orientationManager.resetViewport();
  }, [orientationManager]);

  useEffect(() => {
    // Apply initial viewport config
    if (viewportConfig) {
      orientationManager.setViewportConfig(viewportConfig);
    }

    // Lock orientation if specified
    if (initialLockOrientation) {
      orientationManager.lockOrientation(initialLockOrientation);
    }

    // Listen for orientation changes
    const unsubscribe = orientationManager.addOrientationListener(handleOrientationChange);

    return () => {
      unsubscribe();
      
      // Clean up on unmount
      if (viewportConfig) {
        orientationManager.resetViewport();
      }
      
      if (initialLockOrientation) {
        orientationManager.unlockOrientation();
      }
    };
  }, [orientationManager, viewportConfig, initialLockOrientation, handleOrientationChange]);

  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    dimensions,
    lockOrientation,
    unlockOrientation,
    setViewportConfig,
    resetViewport
  };
};