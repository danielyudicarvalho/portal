'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTouchInputAdapter } from '../../hooks/useTouchInputAdapter';
import { 
  detectDevice, 
  getGameAdaptationConfig, 
  createGameConfig, 
  meetsMinimumRequirements,
  getTouchControlStyles,
  type DeviceInfo 
} from '../../lib/mobile-detection';

export interface TouchAdaptedGameProps {
  gameId: string;
  gameWidth?: number;
  gameHeight?: number;
  children: React.ReactNode;
  onAdaptationComplete?: () => void;
  onAdaptationError?: (error: Error) => void;
  className?: string;
}

export function TouchAdaptedGame({
  gameId,
  gameWidth = 800,
  gameHeight = 600,
  children,
  onAdaptationComplete,
  onAdaptationError,
  className = ''
}: TouchAdaptedGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isAdapted, setIsAdapted] = useState(false);
  const [adaptationError, setAdaptationError] = useState<string | null>(null);

  // Detect device on mount
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    
    // Inject touch control styles
    const styleId = 'touch-control-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = getTouchControlStyles(device);
      document.head.appendChild(style);
    }
  }, []);

  // Create game configuration
  const gameConfig = deviceInfo ? (() => {
    const adaptationConfig = getGameAdaptationConfig(gameId, deviceInfo);
    return createGameConfig(gameId, adaptationConfig, gameWidth, gameHeight);
  })() : null;

  // Initialize touch input adapter
  const {
    adaptGameElement,
    handleOrientationChange,
    cleanup,
    isEnabled
  } = useTouchInputAdapter({
    gameConfig: gameConfig || {
      width: gameWidth,
      height: gameHeight,
      scaleMode: 'fit',
      touchControls: []
    },
    enabled: deviceInfo?.isMobile || deviceInfo?.isTouch || false,
    onAdaptationComplete: () => {
      setIsAdapted(true);
      onAdaptationComplete?.();
    },
    onAdaptationError: (error) => {
      setAdaptationError(error.message);
      onAdaptationError?.(error);
    }
  });

  // Adapt game when container is ready
  useEffect(() => {
    if (gameContainerRef.current && gameConfig && deviceInfo && isEnabled) {
      // Check minimum requirements
      if (!meetsMinimumRequirements(gameConfig, deviceInfo)) {
        setAdaptationError('Device does not meet minimum requirements for this game');
        return;
      }

      // Find the game element (usually an iframe or canvas)
      const gameElement = gameContainerRef.current.querySelector('iframe, canvas, .game-content') as HTMLElement;
      
      if (gameElement) {
        adaptGameElement(gameElement);
      } else {
        // If no specific game element found, adapt the container
        adaptGameElement(gameContainerRef.current);
      }
    }
  }, [gameConfig, deviceInfo, isEnabled, adaptGameElement]);

  // Handle orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (deviceInfo && isEnabled) {
        // Update device info on resize/orientation change
        const newDeviceInfo = detectDevice();
        setDeviceInfo(newDeviceInfo);
        handleOrientationChange();
      }
    };

    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [deviceInfo, isEnabled, handleOrientationChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Show error state if adaptation failed
  if (adaptationError) {
    return (
      <div className={`touch-adapted-game error ${className}`}>
        <div className="adaptation-error">
          <h3>Game Adaptation Error</h3>
          <p>{adaptationError}</p>
          <button 
            onClick={() => {
              setAdaptationError(null);
              window.location.reload();
            }}
            className="retry-button"
          >
            Retry
          </button>
        </div>
        <style jsx>{`
          .adaptation-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid rgba(255, 0, 0, 0.3);
            border-radius: 8px;
            margin: 1rem;
          }
          
          .retry-button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          
          .retry-button:hover {
            background: #0056b3;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      ref={gameContainerRef}
      className={`touch-adapted-game ${isAdapted ? 'adapted' : 'adapting'} ${className}`}
      data-game-id={gameId}
      data-device-type={deviceInfo?.isMobile ? 'mobile' : deviceInfo?.isTablet ? 'tablet' : 'desktop'}
      data-orientation={deviceInfo?.orientation}
    >
      {children}
      
      {/* Loading indicator while adapting */}
      {isEnabled && !isAdapted && (
        <div className="adaptation-overlay">
          <div className="adaptation-spinner"></div>
          <p>Optimizing for your device...</p>
        </div>
      )}

      {/* Touch control instructions for first-time users */}
      {isAdapted && deviceInfo?.isMobile && (
        <div className="touch-instructions" id="touch-instructions">
          <p>Touch controls are now active. Tap anywhere to dismiss.</p>
        </div>
      )}

      <style jsx>{`
        .touch-adapted-game {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .adaptation-overlay {
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
          z-index: 9999;
        }
        
        .adaptation-spinner {
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
        
        .touch-instructions {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          z-index: 1001;
          animation: fadeInOut 4s ease-in-out;
          pointer-events: none;
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          20%, 80% { opacity: 1; }
        }
        
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .touch-adapted-game {
            height: 100vh;
            height: 100dvh; /* Dynamic viewport height for mobile */
          }
        }
        
        /* Landscape mobile styles */
        @media (max-width: 768px) and (orientation: landscape) {
          .touch-adapted-game {
            height: 100vh;
            height: 100dvh;
          }
        }
        
        /* Hide instructions on tap */
        .touch-instructions:active {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default TouchAdaptedGame;