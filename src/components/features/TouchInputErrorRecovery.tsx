'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface TouchInputError {
  type: 'calibration' | 'responsiveness' | 'gesture' | 'orientation' | 'general';
  message: string;
  timestamp: number;
  gameId?: string;
}

interface TouchInputErrorRecoveryProps {
  gameElement?: HTMLElement | null;
  gameId?: string;
  onRecoveryComplete?: () => void;
  onFallbackMode?: () => void;
}

export const TouchInputErrorRecovery: React.FC<TouchInputErrorRecoveryProps> = ({
  gameElement,
  gameId,
  onRecoveryComplete,
  onFallbackMode,
}) => {
  const [errors, setErrors] = useState<TouchInputError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecoveryUI, setShowRecoveryUI] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [touchCalibrationData, setTouchCalibrationData] = useState<{
    x: number;
    y: number;
    timestamp: number;
  }[]>([]);

  // Monitor touch input errors
  useEffect(() => {
    if (!gameElement) return;

    const handleTouchError = (event: Event) => {
      const customEvent = event as CustomEvent<TouchInputError>;
      const error = customEvent.detail;

      setErrors(prev => [...prev, error]);

      // Show recovery UI if we have multiple errors or critical errors
      if (errors.length >= 2 || error.type === 'calibration') {
        setShowRecoveryUI(true);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      // Monitor for unresponsive touches
      const touch = event.touches[0];
      if (touch) {
        const startTime = Date.now();

        const handleTouchEnd = () => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // If touch duration is too short, it might be an accidental touch
          if (duration < 50) {
            const error: TouchInputError = {
              type: 'responsiveness',
              message: 'Touch input appears unresponsive',
              timestamp: Date.now(),
              gameId,
            };
            setErrors(prev => [...prev, error]);
          }

          gameElement.removeEventListener('touchend', handleTouchEnd);
        };

        gameElement.addEventListener('touchend', handleTouchEnd, { once: true });
      }
    };

    const handleOrientationChange = () => {
      // Give the game time to adapt to orientation change
      setTimeout(() => {
        const rect = gameElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          const error: TouchInputError = {
            type: 'orientation',
            message: 'Game layout broken after orientation change',
            timestamp: Date.now(),
            gameId,
          };
          setErrors(prev => [...prev, error]);
          setShowRecoveryUI(true);
        }
      }, 1000);
    };

    gameElement.addEventListener('touchinputerror', handleTouchError);
    gameElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    if (typeof window !== 'undefined') {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    return () => {
      gameElement.removeEventListener('touchinputerror', handleTouchError);
      gameElement.removeEventListener('touchstart', handleTouchStart);
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, [gameElement, gameId, errors.length]);



  const calibrateTouchInput = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      if (!gameElement) {
        resolve();
        return;
      }

      const calibrationPoints: { x: number; y: number; timestamp: number }[] = [];
      let pointsCollected = 0;
      const requiredPoints = 4;

      const handleCalibrationTouch = (event: TouchEvent) => {
        event.preventDefault();
        const touch = event.touches[0];
        if (touch && pointsCollected < requiredPoints) {
          const rect = gameElement.getBoundingClientRect();
          calibrationPoints.push({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            timestamp: Date.now(),
          });
          pointsCollected++;
          setTouchCalibrationData([...calibrationPoints]);

          if (pointsCollected >= requiredPoints) {
            gameElement.removeEventListener('touchstart', handleCalibrationTouch);
            resolve();
          }
        }
      };

      gameElement.addEventListener('touchstart', handleCalibrationTouch, { passive: false });

      // Auto-resolve after 10 seconds if user doesn't complete calibration
      setTimeout(() => {
        gameElement.removeEventListener('touchstart', handleCalibrationTouch);
        resolve();
      }, 10000);
    });
  }, [gameElement]);

  const resetGameViewport = useCallback(async (): Promise<void> => {
    if (!gameElement) return;

    // Reset viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
    }

    // Force layout recalculation
    gameElement.style.transform = 'translateZ(0)';
    void gameElement.offsetHeight; // Force reflow
    gameElement.style.transform = '';

    await new Promise(resolve => setTimeout(resolve, 300));
  }, [gameElement]);

  const reinitializeTouchControls = useCallback(async (): Promise<void> => {
    if (!gameElement) return;

    // Dispatch custom event to reinitialize touch controls
    const event = new CustomEvent('reinitialize-touch-controls', {
      detail: { calibrationData: touchCalibrationData }
    });
    gameElement.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 500));
  }, [gameElement, touchCalibrationData]);

  const startRecovery = useCallback(async () => {
    setIsRecovering(true);
    setRecoveryStep(0);

    try {
      // Step 1: Clear existing touch event listeners
      setRecoveryStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Recalibrate touch input
      setRecoveryStep(2);
      await calibrateTouchInput();

      // Step 3: Reset game viewport
      setRecoveryStep(3);
      await resetGameViewport();

      // Step 4: Reinitialize touch controls
      setRecoveryStep(4);
      await reinitializeTouchControls();

      // Recovery complete
      setRecoveryStep(5);
      setErrors([]);
      setShowRecoveryUI(false);
      onRecoveryComplete?.();
    } catch (error) {
      console.error('Touch input recovery failed:', error);
      // Fallback to alternative input mode
      onFallbackMode?.();
    } finally {
      setIsRecovering(false);
    }
  }, [onRecoveryComplete, onFallbackMode, calibrateTouchInput, reinitializeTouchControls, resetGameViewport]);

  const enableFallbackMode = () => {
    // Enable keyboard fallback or simplified controls
    if (gameElement) {
      gameElement.classList.add('touch-fallback-mode');
      const event = new CustomEvent('enable-fallback-controls');
      gameElement.dispatchEvent(event);
    }

    setShowRecoveryUI(false);
    onFallbackMode?.();
  };

  const dismissErrors = () => {
    setErrors([]);
    setShowRecoveryUI(false);
  };

  if (!showRecoveryUI) return null;

  const getRecoveryStepMessage = () => {
    switch (recoveryStep) {
      case 1: return 'Clearing touch event listeners...';
      case 2: return 'Calibrating touch input...';
      case 3: return 'Resetting game viewport...';
      case 4: return 'Reinitializing touch controls...';
      case 5: return 'Recovery complete!';
      default: return 'Preparing recovery...';
    }
  };

  const latestError = errors[errors.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Touch Input Issue Detected
            </h2>

            <p className="text-gray-600 text-sm mb-4">
              {latestError?.message || 'Touch controls are not responding properly.'}
            </p>
          </div>

          {isRecovering ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-8 h-8 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {getRecoveryStepMessage()}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(recoveryStep / 5) * 100}%` }}
                ></div>
              </div>
              {recoveryStep === 2 && touchCalibrationData.length < 4 && (
                <p className="text-xs text-gray-500 mt-2">
                  Tap {4 - touchCalibrationData.length} more points to calibrate
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={startRecovery}
                className="w-full"
                variant="primary"
              >
                Fix Touch Controls
              </Button>

              <Button
                onClick={enableFallbackMode}
                className="w-full"
                variant="secondary"
              >
                Use Simplified Controls
              </Button>

              <Button
                onClick={dismissErrors}
                className="w-full"
                variant="outline"
              >
                Dismiss
              </Button>
            </div>
          )}

          {errors.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {errors.length} touch input issues detected
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TouchInputErrorRecovery;