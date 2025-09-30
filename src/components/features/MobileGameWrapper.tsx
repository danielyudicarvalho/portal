'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TouchAdaptedGame } from './TouchAdaptedGame';
import { detectDevice, type DeviceInfo } from '../../lib/mobile-detection';
import { useMobilePerformance, usePreloadProgress } from '../../hooks/useMobilePerformance';
import { useMobileAnalytics } from '../../hooks/useMobileAnalytics';

export interface GameConfig {
  width: number;
  height: number;
  scaleMode: 'fit' | 'fill' | 'stretch';
  touchControls: TouchControlConfig[];
  minScreenSize?: {
    width: number;
    height: number;
  };
  preferredOrientation?: 'portrait' | 'landscape' | 'any';
  requiresKeyboard?: boolean;
  supportsTouch?: boolean;
}

export interface TouchControlConfig {
  id: string;
  type: 'button' | 'joystick' | 'dpad' | 'swipe';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  keyMapping?: string[];
  label?: string;
  icon?: string;
}

export interface MobileGameWrapperProps {
  gameId: string;
  gameConfig: GameConfig;
  children: React.ReactNode;
  onGameLoad?: () => void;
  onGameError?: (error: Error) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  className?: string;
  optimizationStrategy?: 'aggressive' | 'conservative' | 'adaptive';
  enablePreloading?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export function MobileGameWrapper({
  gameId,
  gameConfig,
  children,
  onGameLoad,
  onGameError,
  onFullscreenToggle,
  className = '',
  optimizationStrategy = 'adaptive',
  enablePreloading = true,
  enablePerformanceMonitoring = true
}: MobileGameWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameElementRef = useRef<HTMLElement | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [touchControlsVisible, setTouchControlsVisible] = useState(false);
  const [gameScale, setGameScale] = useState(1);
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 });

  // Mobile performance optimization
  const {
    isOptimizing,
    metrics,
    stopOptimization
  } = useMobilePerformance({
    gameId,
    autoStart: true,
    strategy: optimizationStrategy,
    enablePreloading,
    enableMonitoring: enablePerformanceMonitoring,
    enableImageOptimization: true
  });

  // Preload progress tracking
  const preloadProgress = usePreloadProgress(gameId);

  // Mobile analytics integration
  const {
    trackEvent,
    trackError
  } = useMobileAnalytics({
    gameId,
    trackTouchEvents: true,
    trackPerformance: enablePerformanceMonitoring,
    autoStartSession: enablePerformanceMonitoring
  });

  // Update viewport dimensions
  const updateViewportDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportDimensions({ width, height });
    }
    
    // Calculate optimal scale for the game
    if (gameConfig) {
      const scaleX = width / gameConfig.width;
      const scaleY = height / gameConfig.height;
      
      let scale = 1;
      switch (gameConfig.scaleMode) {
        case 'fit':
          scale = Math.min(scaleX, scaleY);
          break;
        case 'fill':
          scale = Math.max(scaleX, scaleY);
          break;
        case 'stretch':
          // For stretch mode, we'll use CSS transform instead of uniform scaling
          scale = 1;
          break;
        default:
          scale = Math.min(scaleX, scaleY);
      }
      
      setGameScale(Math.max(0.5, Math.min(scale, 3))); // Clamp between 0.5x and 3x
    }
  }, [gameConfig]);

  // Initialize device detection
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    updateViewportDimensions();
  }, [updateViewportDimensions]);

  // Handle window resize and orientation changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        updateViewportDimensions();
        
        // Update device info on orientation change
        const newDevice = detectDevice();
        const orientationChanged = deviceInfo?.orientation !== newDevice.orientation;
        
        setDeviceInfo(newDevice);
        
        // Track orientation changes
        if (orientationChanged && deviceInfo) {
          trackEvent('orientation_change', {
            from: deviceInfo.orientation,
            to: newDevice.orientation,
            gameId,
            newDimensions: {
              width: newDevice.screenSize.width,
              height: newDevice.screenSize.height
            }
          });
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [updateViewportDimensions, deviceInfo, trackEvent, gameId]);

  // Apply game scaling based on viewport and device
  const applyGameScaling = useCallback((gameElement: HTMLElement) => {
    if (!gameElement || !deviceInfo) return;

    const { width, height } = viewportDimensions;
    
    // Apply scaling based on scale mode
    if (gameConfig.scaleMode === 'stretch') {
      // Stretch to fill viewport
      gameElement.style.width = '100%';
      gameElement.style.height = '100%';
      gameElement.style.transform = 'none';
    } else {
      // Use uniform scaling
      gameElement.style.width = `${gameConfig.width}px`;
      gameElement.style.height = `${gameConfig.height}px`;
      gameElement.style.transform = `scale(${gameScale})`;
      gameElement.style.transformOrigin = 'center center';
    }

    // Center the game
    gameElement.style.position = 'absolute';
    gameElement.style.top = '50%';
    gameElement.style.left = '50%';
    gameElement.style.marginTop = `${-gameConfig.height * gameScale / 2}px`;
    gameElement.style.marginLeft = `${-gameConfig.width * gameScale / 2}px`;

    // Ensure game is contained within viewport
    if (gameConfig.scaleMode !== 'stretch') {
      const scaledWidth = gameConfig.width * gameScale;
      const scaledHeight = gameConfig.height * gameScale;
      
      if (scaledWidth > width || scaledHeight > height) {
        const newScale = Math.min(width / gameConfig.width, height / gameConfig.height) * 0.95;
        setGameScale(newScale);
      }
    }
  }, [deviceInfo, viewportDimensions, gameScale, gameConfig]);

  // Handle game loading
  const handleGameLoad = useCallback(() => {
    setIsLoading(false);
    
    // Track game load completion
    trackEvent('game_start', {
      gameId,
      loadTime: performance.now(),
      deviceType: deviceInfo?.isMobile ? 'mobile' : deviceInfo?.isTablet ? 'tablet' : 'desktop',
      platform: deviceInfo?.platform,
      orientation: deviceInfo?.orientation,
      scaleMode: gameConfig.scaleMode,
      touchControlsEnabled: gameConfig.requiresKeyboard && deviceInfo?.isMobile
    });
    
    // Find the actual game element (iframe, canvas, etc.)
    if (wrapperRef.current) {
      const gameElement = wrapperRef.current.querySelector('iframe, canvas, .game-content') as HTMLElement;
      if (gameElement) {
        gameElementRef.current = gameElement;
        
        // Apply scaling and viewport optimizations
        applyGameScaling(gameElement);
        
        // Show touch controls if needed
        if (deviceInfo?.isMobile && gameConfig.requiresKeyboard) {
          setTouchControlsVisible(true);
          trackEvent('game_start', { touchControlsShown: true });
        }

        // Stop performance optimization when game is loaded
        if (enablePerformanceMonitoring) {
          stopOptimization();
        }
      }
    }
    
    onGameLoad?.();
  }, [deviceInfo, gameConfig, onGameLoad, enablePerformanceMonitoring, stopOptimization, trackEvent, gameId, applyGameScaling]);

  // Handle game errors
  const handleGameError = useCallback((error: Error) => {
    setGameError(error.message);
    setIsLoading(false);
    
    // Track game error
    trackError({
      type: 'game_load',
      message: error.message,
      stack: error.stack,
      gameId
    });
    
    onGameError?.(error);
  }, [onGameError, trackError, gameId]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;

    try {
      if (!isFullscreen) {
        if (wrapperRef.current.requestFullscreen) {
          await wrapperRef.current.requestFullscreen();
        } else if ((wrapperRef.current as any).webkitRequestFullscreen) {
          await (wrapperRef.current as any).webkitRequestFullscreen();
        } else if ((wrapperRef.current as any).msRequestFullscreen) {
          await (wrapperRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
        trackEvent('game_start', { fullscreenEntered: true, gameId });
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
        trackEvent('game_start', { fullscreenExited: true, gameId });
      }
      
      onFullscreenToggle?.(isFullscreen);
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
      trackError({
        type: 'game_load',
        message: `Fullscreen toggle failed: ${error}`,
        gameId
      });
    }
  }, [isFullscreen, onFullscreenToggle, trackEvent, trackError, gameId]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      onFullscreenToggle?.(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenToggle]);

  // Check if device meets minimum requirements
  const meetsRequirements = deviceInfo && gameConfig.minScreenSize ? 
    deviceInfo.screenSize.width >= gameConfig.minScreenSize.width &&
    deviceInfo.screenSize.height >= gameConfig.minScreenSize.height : true;

  // Show error if device doesn't meet requirements
  if (deviceInfo && !meetsRequirements) {
    return (
      <div className={`mobile-game-wrapper error ${className}`}>
        <div className="requirements-error">
          <h3>Device Requirements Not Met</h3>
          <p>This game requires a minimum screen size of {gameConfig.minScreenSize?.width}x{gameConfig.minScreenSize?.height} pixels.</p>
          <p>Your device: {deviceInfo.screenSize.width}x{deviceInfo.screenSize.height} pixels</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={wrapperRef}
      className={`mobile-game-wrapper ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      data-game-id={gameId}
      data-scale-mode={gameConfig.scaleMode}
      data-orientation={deviceInfo?.orientation}
    >
      {/* Game Controls Bar */}
      {deviceInfo?.isMobile && (
        <div className="game-controls-bar">
          <button 
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
          
          {gameConfig.requiresKeyboard && (
            <button 
              className="touch-controls-btn"
              onClick={() => setTouchControlsVisible(!touchControlsVisible)}
              aria-label={touchControlsVisible ? 'Hide touch controls' : 'Show touch controls'}
            >
              🎮
            </button>
          )}

          {/* Performance indicator */}
          {enablePerformanceMonitoring && metrics && (
            <div className="performance-indicator" title={`FPS: ${Math.round(metrics.averageFPS)} | Load: ${Math.round(metrics.gameLoadTime)}ms`}>
              <span className={`fps-indicator ${metrics.averageFPS >= 30 ? 'good' : 'poor'}`}>
                {Math.round(metrics.averageFPS)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Game Content with Touch Adaptation */}
      <TouchAdaptedGame
        gameId={gameId}
        gameWidth={gameConfig.width}
        gameHeight={gameConfig.height}
        onAdaptationComplete={handleGameLoad}
        onAdaptationError={handleGameError}
        className="game-content"
      >
        {children}
      </TouchAdaptedGame>

      {/* Touch Control Overlays */}
      {touchControlsVisible && gameConfig.touchControls.length > 0 && (
        <div className="touch-controls-overlay">
          {gameConfig.touchControls.map((control) => (
            <TouchControl
              key={control.id}
              config={control}
              gameScale={gameScale}
              onInput={() => {
                // Simulate keyboard input for the game
                if (control.keyMapping && gameElementRef.current) {
                  control.keyMapping.forEach(key => {
                    const event = new KeyboardEvent('keydown', { key });
                    gameElementRef.current?.dispatchEvent(event);
                  });
                }
              }}
              onTouchLatency={(latency) => {
                // Track touch latency for performance monitoring
                if (latency > 50) { // Only track if latency is concerning
                  trackError({
                    type: 'touch_input',
                    message: `High touch control latency: ${latency.toFixed(2)}ms`,
                    gameId
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Loading Overlay */}
      {(isLoading || isOptimizing) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          {isOptimizing ? (
            <div className="optimization-status">
              <p>Optimizing for mobile...</p>
              {preloadProgress && (
                <div className="preload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${preloadProgress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {preloadProgress.loaded}/{preloadProgress.total} assets loaded
                  </p>
                  {preloadProgress.currentAsset && (
                    <p className="current-asset">Loading: {preloadProgress.currentAsset}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p>Loading game...</p>
          )}
        </div>
      )}

      {/* Error Overlay */}
      {gameError && (
        <div className="error-overlay">
          <h3>Game Error</h3>
          <p>{gameError}</p>
          <button onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}>
            Reload Game
          </button>
        </div>
      )}

      <style jsx>{`
        .mobile-game-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }

        .mobile-game-wrapper.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }

        .game-controls-bar {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }

        .game-controls-bar button {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .game-controls-bar button:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .game-controls-bar button:active {
          transform: scale(0.95);
        }

        .performance-indicator {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 12px;
          color: white;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .fps-indicator {
          font-weight: bold;
        }

        .fps-indicator.good {
          color: #4ade80;
        }

        .fps-indicator.poor {
          color: #f87171;
        }

        .game-content {
          width: 100%;
          height: 100%;
        }

        .touch-controls-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 999;
        }

        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 1001;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-overlay button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .requirements-error {
          padding: 2rem;
          text-align: center;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 8px;
          margin: 1rem;
          color: white;
        }

        .optimization-status {
          text-align: center;
        }

        .preload-progress {
          margin-top: 1rem;
          width: 250px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #4ade80;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          margin: 0.5rem 0;
        }

        .current-asset {
          font-size: 12px;
          opacity: 0.8;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .mobile-game-wrapper {
            height: 100vh;
            height: 100dvh;
          }

          .game-controls-bar {
            top: env(safe-area-inset-top, 10px);
            right: env(safe-area-inset-right, 10px);
          }
        }

        /* Landscape mobile styles */
        @media (max-width: 768px) and (orientation: landscape) {
          .game-controls-bar {
            top: 5px;
            right: 5px;
          }

          .game-controls-bar button {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

// Touch Control Component
interface TouchControlProps {
  config: TouchControlConfig;
  gameScale: number;
  onInput: (input: string) => void;
  onTouchLatency?: (latency: number) => void;
}

function TouchControl({ config, gameScale, onInput, onTouchLatency }: TouchControlProps) {
  const [isPressed, setIsPressed] = useState(false);
  const touchStartTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchStartTimeRef.current = performance.now();
    setIsPressed(true);
    onInput(config.id);
  }, [config.id, onInput]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    
    // Measure touch latency
    if (touchStartTimeRef.current > 0 && onTouchLatency) {
      const latency = performance.now() - touchStartTimeRef.current;
      onTouchLatency(latency);
    }
  }, [onTouchLatency]);

  const style = {
    position: 'absolute' as const,
    left: `${config.position.x * gameScale}px`,
    top: `${config.position.y * gameScale}px`,
    width: `${config.size.width * gameScale}px`,
    height: `${config.size.height * gameScale}px`,
    pointerEvents: 'auto' as const,
    touchAction: 'none' as const,
  };

  return (
    <div
      className={`touch-control touch-control-${config.type} ${isPressed ? 'pressed' : ''}`}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {config.label && <span className="control-label">{config.label}</span>}
      {config.icon && <span className="control-icon">{config.icon}</span>}
      
      <style jsx>{`
        .touch-control {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
          user-select: none;
          transition: all 0.1s ease;
        }

        .touch-control.pressed {
          background: rgba(255, 255, 255, 0.4);
          border-color: rgba(255, 255, 255, 0.8);
          transform: scale(0.95);
        }

        .touch-control-button {
          border-radius: 50%;
        }

        .touch-control-dpad {
          border-radius: 4px;
        }

        .control-label {
          font-size: 12px;
        }

        .control-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

export default MobileGameWrapper;