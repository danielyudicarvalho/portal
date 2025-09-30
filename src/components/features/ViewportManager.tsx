'use client';

import React, { useEffect } from 'react';
import { getOrientationManager, type ViewportConfig } from '@/lib/orientation-manager';

export interface ViewportManagerProps {
  config?: ViewportConfig;
  gameId?: string;
  children?: React.ReactNode;
}

/**
 * ViewportManager - Manages viewport meta tag for different games and orientations
 */
export const ViewportManager: React.FC<ViewportManagerProps> = ({
  config,
  children
}) => {
  const orientationManager = getOrientationManager();

  useEffect(() => {
    if (!config) return;

    // Apply viewport configuration
    orientationManager.setViewportConfig(config);

    // Lock orientation if specified
    if (config.lockOrientation) {
      orientationManager.lockOrientation(config.lockOrientation);
    }

    return () => {
      // Reset viewport on cleanup
      orientationManager.resetViewport();
      
      // Unlock orientation if it was locked
      if (config.lockOrientation) {
        orientationManager.unlockOrientation();
      }
    };
  }, [config, orientationManager]);

  // This component doesn't render anything visible
  return children ? <>{children}</> : null;
};

/**
 * Predefined viewport configurations for common game types
 */
export const ViewportConfigs = {
  // Standard mobile game - fits to screen
  mobile: {
    scaleMode: 'fit' as const,
    minWidth: 320,
    minHeight: 480
  },
  
  // Landscape-oriented games
  landscape: {
    scaleMode: 'fit' as const,
    lockOrientation: 'landscape' as const,
    minWidth: 480,
    minHeight: 320
  },
  
  // Portrait-oriented games
  portrait: {
    scaleMode: 'fit' as const,
    lockOrientation: 'portrait' as const,
    minWidth: 320,
    minHeight: 480
  },
  
  // Full screen games
  fullscreen: {
    scaleMode: 'fill' as const,
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667
  },
  
  // Fixed aspect ratio games
  fixedAspect: {
    scaleMode: 'fit' as const,
    width: 800,
    height: 600
  }
} as const;