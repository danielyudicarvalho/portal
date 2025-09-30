'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui';

export interface FullscreenManagerProps {
  children: React.ReactNode;
  gameId: string;
  gameTitle?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  showFullscreenButton?: boolean;
  className?: string;
}

export function FullscreenManager({
  children,
  gameId,
  onFullscreenChange,
  showFullscreenButton = true,
  className = '',
}: FullscreenManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check fullscreen API support
  useEffect(() => {
    const checkSupport = () => {
      const element = document.documentElement;
      const supported = !!(
        element.requestFullscreen ||
        (element as any).webkitRequestFullscreen ||
        (element as any).mozRequestFullScreen ||
        (element as any).msRequestFullscreen
      );
      setIsSupported(supported);
    };

    checkSupport();
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      onFullscreenChange?.(isCurrentlyFullscreen);
      
      // Clear any previous errors when fullscreen state changes
      if (error) {
        setError(null);
      }
    };

    const handleFullscreenError = (event: Event) => {
      console.error('Fullscreen error:', event);
      setError('Failed to enter fullscreen mode');
      setIsFullscreen(false);
    };

    // Add event listeners for different browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    document.addEventListener('fullscreenerror', handleFullscreenError);
    document.addEventListener('webkitfullscreenerror', handleFullscreenError);
    document.addEventListener('mozfullscreenerror', handleFullscreenError);
    document.addEventListener('MSFullscreenError', handleFullscreenError);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('webkitfullscreenerror', handleFullscreenError);
      document.removeEventListener('mozfullscreenerror', handleFullscreenError);
      document.removeEventListener('MSFullscreenError', handleFullscreenError);
    };
  }, [onFullscreenChange, error]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
      setError('Failed to exit fullscreen mode');
      return false;
    }
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (!containerRef.current || !isSupported) return false;

    try {
      const element = containerRef.current;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      return true;
    } catch (err) {
      console.error('Failed to request fullscreen:', err);
      setError('Failed to enter fullscreen mode');
      return false;
    }
  }, [isSupported]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await requestFullscreen();
    }
  }, [isFullscreen, requestFullscreen, exitFullscreen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 or F key for fullscreen toggle
      if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey)) {
        event.preventDefault();
        toggleFullscreen();
      }
      
      // Escape key to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen, exitFullscreen]);

  // Auto-hide cursor in fullscreen after inactivity
  useEffect(() => {
    if (!isFullscreen) return;

    let timeoutId: NodeJS.Timeout;
    const hideCursor = () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'none';
      }
    };

    const showCursor = () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideCursor, 3000);
    };

    const handleMouseMove = () => showCursor();
    const handleMouseLeave = () => hideCursor();

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
      
      // Start the timer
      showCursor();
    }

    return () => {
      clearTimeout(timeoutId);
      const container = containerRef.current;
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.style.cursor = 'default';
      }
    };
  }, [isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`fullscreen-manager ${isFullscreen ? 'fullscreen-active' : ''} ${className}`}
      data-game-id={gameId}
    >
      {/* Fullscreen Controls */}
      {showFullscreenButton && isSupported && (
        <div className="fullscreen-controls">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="fullscreen-toggle-btn"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F11)'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </Button>
        </div>
      )}

      {/* Game Content */}
      <div className="fullscreen-content">
        {children}
      </div>

      {/* Fullscreen Instructions */}
      {isFullscreen && (
        <div className="fullscreen-instructions">
          <div className="instruction-text">
            Press <kbd>Esc</kbd> to exit fullscreen
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fullscreen-error">
          <span className="error-text">{error}</span>
          <button 
            className="error-dismiss"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <style jsx>{`
        .fullscreen-manager {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }

        .fullscreen-manager.fullscreen-active {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }

        .fullscreen-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }

        .fullscreen-controls:hover {
          opacity: 1;
        }

        .fullscreen-toggle-btn {
          background: rgba(0, 0, 0, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: white !important;
          font-size: 18px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          backdrop-filter: blur(4px);
        }

        .fullscreen-toggle-btn:hover {
          background: rgba(0, 0, 0, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }

        .fullscreen-content {
          width: 100%;
          height: 100%;
        }

        .fullscreen-instructions {
          position: absolute;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          opacity: 0;
          animation: fadeInOut 4s ease-in-out;
        }

        .instruction-text {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 14px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .instruction-text kbd {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
          font-size: 12px;
          margin: 0 0.2rem;
        }

        .fullscreen-error {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(220, 38, 38, 0.9);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 1001;
          backdrop-filter: blur(4px);
        }

        .error-text {
          font-size: 14px;
        }

        .error-dismiss {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .error-dismiss:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .fullscreen-controls {
            top: env(safe-area-inset-top, 0.5rem);
            right: env(safe-area-inset-right, 0.5rem);
          }

          .fullscreen-toggle-btn {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }

          .fullscreen-instructions {
            top: env(safe-area-inset-top, 0.5rem);
          }

          .instruction-text {
            font-size: 12px;
            padding: 0.4rem 0.8rem;
          }
        }

        /* Hide controls in very small screens when in fullscreen */
        @media (max-height: 400px) {
          .fullscreen-active .fullscreen-controls {
            opacity: 0.3;
          }
          
          .fullscreen-active .fullscreen-instructions {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default FullscreenManager;