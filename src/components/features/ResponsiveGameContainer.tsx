'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getOrientationManager, type OrientationChangeEvent, type ViewportConfig } from '@/lib/orientation-manager';

export interface ResponsiveGameContainerProps {
  children: React.ReactNode;
  gameId: string;
  viewportConfig?: ViewportConfig;
  className?: string;
  onOrientationChange?: (event: OrientationChangeEvent) => void;
}

export const ResponsiveGameContainer: React.FC<ResponsiveGameContainerProps> = ({
  children,
  gameId,
  viewportConfig,
  className = '',
  onOrientationChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const orientationManager = getOrientationManager();

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = orientationManager.getOptimalViewport();
    setDimensions({ width, height });
  }, [orientationManager]);

  const handleOrientationChange = useCallback((event: OrientationChangeEvent) => {
    setOrientation(event.orientation);
    setDimensions({ width: event.width, height: event.height });
    
    // Apply viewport configuration if provided
    if (viewportConfig) {
      orientationManager.setViewportConfig(viewportConfig);
    }

    // Notify parent component
    onOrientationChange?.(event);
  }, [orientationManager, viewportConfig, onOrientationChange]);

  useEffect(() => {
    // Initial setup
    updateDimensions();
    setOrientation(orientationManager.getCurrentOrientation());

    // Apply initial viewport config
    if (viewportConfig) {
      orientationManager.setViewportConfig(viewportConfig);
    }

    // Listen for orientation changes
    const unsubscribe = orientationManager.addOrientationListener(handleOrientationChange);

    return () => {
      unsubscribe();
      // Reset viewport on cleanup
      orientationManager.resetViewport();
    };
  }, [orientationManager, viewportConfig, handleOrientationChange, updateDimensions]);

  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    if (!viewportConfig) return baseStyle;

    const { scaleMode, width: configWidth, height: configHeight } = viewportConfig;
    
    if (configWidth && configHeight) {
      const scaleFactor = orientationManager.calculateScaleFactor(
        configWidth,
        configHeight,
        scaleMode
      );

      return {
        ...baseStyle,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center'
      };
    }

    return baseStyle;
  };

  const getGameStyle = (): React.CSSProperties => {
    if (!viewportConfig?.width || !viewportConfig?.height) {
      return {
        width: '100%',
        height: '100%'
      };
    }

    return {
      width: `${viewportConfig.width}px`,
      height: `${viewportConfig.height}px`,
      maxWidth: '100%',
      maxHeight: '100%'
    };
  };

  return (
    <div
      ref={containerRef}
      className={`responsive-game-container ${orientation} ${className}`}
      style={getContainerStyle()}
      data-game-id={gameId}
      data-orientation={orientation}
      data-testid="responsive-game-container"
    >
      <div
        className="game-content"
        style={getGameStyle()}
        data-testid="game-content-wrapper"
      >
        {children}
      </div>
      
      <style jsx>{`
        .responsive-game-container {
          transition: transform 0.3s ease-in-out;
        }
        
        .responsive-game-container.landscape {
          --container-orientation: landscape;
        }
        
        .responsive-game-container.portrait {
          --container-orientation: portrait;
        }
        
        .game-content {
          transition: width 0.3s ease-in-out, height 0.3s ease-in-out;
        }
        
        @media (max-width: 768px) {
          .responsive-game-container {
            padding: 0;
          }
        }
        
        @media (orientation: landscape) and (max-height: 500px) {
          .responsive-game-container {
            height: 100vh;
          }
        }
      `}</style>
    </div>
  );
};