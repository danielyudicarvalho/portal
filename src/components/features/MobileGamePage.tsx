'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MobileGameWrapper, type GameConfig } from './MobileGameWrapper';
import { FullscreenManager } from './FullscreenManager';
import { detectDevice } from '../../lib/mobile-detection';
import { Button } from '../ui';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export interface MobileGamePageProps {
  gameId: string;
  gameTitle: string;
  gameUrl: string;
  gameConfig?: Partial<GameConfig>;
  enableFullscreen?: boolean;
  showGameInfo?: boolean;
  customControls?: React.ReactNode;
  children?: React.ReactNode;
}

// Default game configurations for different game types
const getDefaultGameConfig = (gameId: string): GameConfig => {
  const baseConfig: GameConfig = {
    width: 800,
    height: 600,
    scaleMode: 'fit',
    touchControls: [],
    minScreenSize: {
      width: 320,
      height: 480,
    },
    preferredOrientation: 'landscape',
    requiresKeyboard: false,
    supportsTouch: true,
  };

  // Game-specific configurations
  const gameConfigs: Record<string, Partial<GameConfig>> = {
    'box-jump': {
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'jump',
          type: 'button',
          position: { x: 300, y: 500 },
          size: { width: 80, height: 80 },
          keyMapping: ['Space', 'ArrowUp'],
          label: 'Jump',
        },
        {
          id: 'move-left',
          type: 'button',
          position: { x: 50, y: 500 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowLeft', 'a'],
          label: '←',
        },
        {
          id: 'move-right',
          type: 'button',
          position: { x: 150, y: 500 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowRight', 'd'],
          label: '→',
        },
      ],
    },
    'doodle-jump': {
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'move-left',
          type: 'button',
          position: { x: 50, y: 500 },
          size: { width: 80, height: 80 },
          keyMapping: ['ArrowLeft', 'a'],
          label: '←',
        },
        {
          id: 'move-right',
          type: 'button',
          position: { x: 200, y: 500 },
          size: { width: 80, height: 80 },
          keyMapping: ['ArrowRight', 'd'],
          label: '→',
        },
      ],
    },
    'fill-the-holes': {
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'move-up',
          type: 'button',
          position: { x: 100, y: 400 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowUp', 'w'],
          label: '↑',
        },
        {
          id: 'move-down',
          type: 'button',
          position: { x: 100, y: 540 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowDown', 's'],
          label: '↓',
        },
        {
          id: 'move-left',
          type: 'button',
          position: { x: 30, y: 470 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowLeft', 'a'],
          label: '←',
        },
        {
          id: 'move-right',
          type: 'button',
          position: { x: 170, y: 470 },
          size: { width: 70, height: 70 },
          keyMapping: ['ArrowRight', 'd'],
          label: '→',
        },
      ],
    },
    'endless-scale': {
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'action',
          type: 'button',
          position: { x: 300, y: 500 },
          size: { width: 100, height: 80 },
          keyMapping: ['Space'],
          label: 'Action',
        },
      ],
    },
    'memdot': {
      requiresKeyboard: false,
      supportsTouch: true,
      preferredOrientation: 'any',
    },
    'circle-path': {
      requiresKeyboard: false,
      supportsTouch: true,
      touchControls: [
        {
          id: 'tap',
          type: 'button',
          position: { x: 350, y: 300 },
          size: { width: 100, height: 100 },
          keyMapping: ['Space'],
          label: 'Tap',
        },
      ],
    },
    'boom-dots': {
      requiresKeyboard: false,
      supportsTouch: true,
      touchControls: [
        {
          id: 'shoot',
          type: 'button',
          position: { x: 350, y: 500 },
          size: { width: 80, height: 80 },
          keyMapping: ['Space'],
          label: 'Shoot',
        },
      ],
    },
    'clocks': {
      requiresKeyboard: false,
      supportsTouch: true,
      preferredOrientation: 'any',
    },
    '123': {
      requiresKeyboard: false,
      supportsTouch: true,
      preferredOrientation: 'any',
    },
  };

  return {
    ...baseConfig,
    ...gameConfigs[gameId],
  };
};

export function MobileGamePage({
  gameId,
  gameTitle,
  gameUrl,
  gameConfig: customGameConfig,
  enableFullscreen = true,
  showGameInfo = false,
  customControls,
  children,
}: MobileGamePageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [showControls, setShowControls] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Merge default config with custom config
  const gameConfig = {
    ...getDefaultGameConfig(gameId),
    ...customGameConfig,
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const device = detectDevice();
      setDeviceInfo(device);
      
      // Show controls by default on mobile if game requires keyboard
      if (device.isMobile && gameConfig.requiresKeyboard) {
        setShowControls(true);
      }
    }
  }, [gameConfig.requiresKeyboard]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (showMobileMenu) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showMobileMenu]);

  const handleGameLoad = useCallback(() => {
    setGameLoaded(true);
    setGameError(null);
  }, []);

  const handleGameError = useCallback((error: Error) => {
    setGameError(error.message);
    setGameLoaded(false);
  }, []);

  const handleFullscreenToggle = useCallback((fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  }, []);

  const handleRetryGame = useCallback(() => {
    setGameError(null);
    setGameLoaded(false);
    // Force iframe reload
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const iframe = document.querySelector(`iframe[title="${gameTitle}"]`) as HTMLIFrameElement;
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  }, [gameTitle]);

  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu(!showMobileMenu);
  }, [showMobileMenu]);

  const closeMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  return (
    <div className="mobile-game-page">
      {/* Navigation Header - Always visible except in fullscreen */}
      {!isFullscreen && (
        <div className="navigation-header">
          <div className="nav-content">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="menu-toggle-btn"
              aria-label="Toggle navigation menu"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Game Title */}
            <h1 className="nav-game-title">{gameTitle}</h1>

            {/* Back Button */}
            <Link href="/games" className="back-btn">
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Games</span>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {showMobileMenu && !isFullscreen && (
        <>
          {/* Overlay */}
          <div 
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel */}
          <div className="mobile-menu-panel">
            <nav className="mobile-nav">
              <Link href="/" onClick={closeMobileMenu} className="nav-link">
                <HomeIcon className="h-5 w-5" />
                Home
              </Link>
              <Link href="/games" onClick={closeMobileMenu} className="nav-link">
                All Games
              </Link>
              <Link href="/games/memdot" onClick={closeMobileMenu} className="nav-link">
                Memory Game
              </Link>
              <Link href="/games/clocks" onClick={closeMobileMenu} className="nav-link">
                Clocks
              </Link>
              <Link href="/games/box-jump" onClick={closeMobileMenu} className="nav-link">
                Box Jump
              </Link>
              <Link href="/games/doodle-jump" onClick={closeMobileMenu} className="nav-link">
                Doodle Jump
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Game Header - Hidden in fullscreen */}
      {!isFullscreen && showGameInfo && (
        <div className="game-header">
          <div className="game-info">
            <h1 className="game-title">{gameTitle}</h1>
            {deviceInfo?.isMobile && (
              <div className="mobile-hints">
                {gameConfig.requiresKeyboard && (
                  <span className="hint">Touch controls available</span>
                )}
                {enableFullscreen && (
                  <span className="hint">Tap fullscreen for better experience</span>
                )}
              </div>
            )}
          </div>
          
          {customControls && (
            <div className="custom-controls">
              {customControls}
            </div>
          )}
        </div>
      )}

      {/* Game Container with Fullscreen Support */}
      <div className="game-container">
        <FullscreenManager
          gameId={gameId}
          gameTitle={gameTitle}
          onFullscreenChange={handleFullscreenToggle}
          showFullscreenButton={enableFullscreen}
          className="w-full h-full"
        >
          <MobileGameWrapper
            gameId={gameId}
            gameConfig={gameConfig}
            onGameLoad={handleGameLoad}
            onGameError={handleGameError}
            onFullscreenToggle={handleFullscreenToggle}
            className="w-full h-full"
            enablePreloading={true}
            enablePerformanceMonitoring={true}
          >
            {children ? (
              children
            ) : (
              <iframe
                src={gameUrl}
                className="w-full h-full border-0"
                title={gameTitle}
                allow="fullscreen"
                loading="lazy"
              />
            )}
          </MobileGameWrapper>
        </FullscreenManager>
      </div>

      {/* Mobile-specific UI overlays */}
      {deviceInfo?.isMobile && !isFullscreen && (
        <div className="mobile-ui-overlay">
          {/* Quick Actions */}
          {gameConfig.requiresKeyboard && (
            <div className="quick-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowControls(!showControls)}
                className="controls-toggle-btn"
              >
                🎮 {showControls ? 'Hide' : 'Show'} Controls
              </Button>
            </div>
          )}

          {/* Game Status */}
          {!gameLoaded && !gameError && (
            <div className="game-status loading">
              <div className="status-indicator">
                <div className="loading-spinner"></div>
                <span>Loading {gameTitle}...</span>
              </div>
            </div>
          )}

          {gameError && (
            <div className="game-status error">
              <div className="status-indicator">
                <span className="error-icon">⚠️</span>
                <span>Failed to load game</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRetryGame}
                  className="retry-btn"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .mobile-game-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          background: #000;
          position: relative;
        }

        .navigation-header {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 100%;
        }

        .menu-toggle-btn {
          color: white;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-game-title {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
          text-align: center;
          padding: 0 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .back-btn {
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 0.875rem;
        }

        .back-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 150;
        }

        .mobile-menu-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 200;
          padding-top: 4rem;
          overflow-y: auto;
        }

        .mobile-nav {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.8);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          text-decoration: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .game-header {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 100;
        }

        .game-info {
          flex: 1;
        }

        .game-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 0 0.5rem 0;
        }

        .mobile-hints {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .hint {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .custom-controls {
          display: flex;
          gap: 0.5rem;
        }

        .game-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }



        .mobile-ui-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 200;
        }

        .quick-actions {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
          pointer-events: auto;
        }

        .game-status {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: auto;
        }

        .status-indicator {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 1.25rem;
        }

        .retry-btn {
          margin-left: 0.5rem;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .game-header {
            padding: 0.75rem;
          }

          .game-title {
            font-size: 1.25rem;
          }

          .mobile-hints {
            font-size: 0.75rem;
          }

          .quick-actions {
            top: env(safe-area-inset-top, 0.5rem);
            left: env(safe-area-inset-left, 0.5rem);
          }

          .game-status {
            bottom: env(safe-area-inset-bottom, 1rem);
          }
        }

        /* Landscape mobile styles */
        @media (max-width: 768px) and (orientation: landscape) {
          .game-header {
            padding: 0.5rem 1rem;
          }

          .game-title {
            font-size: 1.125rem;
          }

          .mobile-hints {
            display: none;
          }

          .quick-actions {
            top: 0.5rem;
            left: 0.5rem;
          }
        }

        /* Hide header in very small screens */
        @media (max-height: 500px) {
          .game-header {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default MobileGamePage;