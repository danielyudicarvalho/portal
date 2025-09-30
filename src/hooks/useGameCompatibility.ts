'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  mobileGameCompatibilityChecker, 
  GameCompatibilityInfo, 
  FallbackMechanism 
} from '@/lib/mobile-game-compatibility';
import { GameConfig } from '@/lib/touch-input-adapter';

export interface UseGameCompatibilityReturn {
  compatibilityInfo: GameCompatibilityInfo | null;
  isLoading: boolean;
  error: string | null;
  checkCompatibility: (gameId: string) => Promise<void>;
  adaptGame: (gameId: string, gameElement: HTMLElement) => Promise<GameConfig | null>;
  isFeatureSupported: (feature: string) => boolean;
  getFallbackOptions: (gameId: string) => FallbackMechanism[];
  getDeviceOptimizations: (gameId: string) => any;
}

/**
 * Hook for managing game compatibility checking and adaptation
 */
export const useGameCompatibility = (initialGameId?: string): UseGameCompatibilityReturn => {
  const [compatibilityInfo, setCompatibilityInfo] = useState<GameCompatibilityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Checks compatibility for a specific game
   */
  const checkCompatibility = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const info = await mobileGameCompatibilityChecker.checkCompatibility(gameId);
      setCompatibilityInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check compatibility';
      setError(errorMessage);
      console.error('Game compatibility check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Adapts a game for the current device
   */
  const adaptGame = useCallback(async (gameId: string, gameElement: HTMLElement): Promise<GameConfig | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const gameConfig = await mobileGameCompatibilityChecker.adaptGame(gameId, gameElement);
      
      // Update compatibility info after adaptation
      const updatedInfo = await mobileGameCompatibilityChecker.checkCompatibility(gameId);
      setCompatibilityInfo(updatedInfo);
      
      return gameConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adapt game';
      setError(errorMessage);
      console.error('Game adaptation failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Checks if a specific feature is supported
   */
  const isFeatureSupported = useCallback((feature: string): boolean => {
    return mobileGameCompatibilityChecker.isFeatureSupported(feature);
  }, []);

  /**
   * Gets fallback options for a game
   */
  const getFallbackOptions = useCallback((gameId: string): FallbackMechanism[] => {
    return mobileGameCompatibilityChecker.getFallbackOptions(gameId);
  }, []);

  /**
   * Gets device-specific optimizations for a game
   */
  const getDeviceOptimizations = useCallback((gameId: string): any => {
    return mobileGameCompatibilityChecker.getDeviceOptimizations(gameId);
  }, []);

  // Check compatibility for initial game ID
  useEffect(() => {
    if (initialGameId) {
      checkCompatibility(initialGameId);
    }
  }, [initialGameId, checkCompatibility]);

  return {
    compatibilityInfo,
    isLoading,
    error,
    checkCompatibility,
    adaptGame,
    isFeatureSupported,
    getFallbackOptions,
    getDeviceOptimizations
  };
};

/**
 * Hook for checking if the current device meets minimum requirements for gaming
 */
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState<{
    webgl: boolean;
    audio: boolean;
    gamepad: boolean;
    fullscreen: boolean;
    orientationLock: boolean;
    vibration: boolean;
    touch: boolean;
    accelerometer: boolean;
  } | null>(null);

  useEffect(() => {
    const checkCapabilities = () => {
      setCapabilities({
        webgl: mobileGameCompatibilityChecker.isFeatureSupported('webgl'),
        audio: mobileGameCompatibilityChecker.isFeatureSupported('audio'),
        gamepad: mobileGameCompatibilityChecker.isFeatureSupported('gamepad'),
        fullscreen: mobileGameCompatibilityChecker.isFeatureSupported('fullscreen'),
        orientationLock: mobileGameCompatibilityChecker.isFeatureSupported('orientation_lock'),
        vibration: mobileGameCompatibilityChecker.isFeatureSupported('vibration'),
        touch: mobileGameCompatibilityChecker.isFeatureSupported('touch'),
        accelerometer: mobileGameCompatibilityChecker.isFeatureSupported('accelerometer')
      });
    };

    checkCapabilities();
  }, []);

  return capabilities;
};

/**
 * Hook for managing game adaptation state
 */
export const useGameAdaptation = (gameId: string) => {
  const [isAdapted, setIsAdapted] = useState(false);
  const [adaptationConfig, setAdaptationConfig] = useState<GameConfig | null>(null);
  const [adaptationError, setAdaptationError] = useState<string | null>(null);

  const { adaptGame, compatibilityInfo } = useGameCompatibility(gameId);

  /**
   * Applies adaptations to a game element
   */
  const applyAdaptations = useCallback(async (gameElement: HTMLElement) => {
    setAdaptationError(null);
    
    try {
      const config = await adaptGame(gameId, gameElement);
      if (config) {
        setAdaptationConfig(config);
        setIsAdapted(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply adaptations';
      setAdaptationError(errorMessage);
    }
  }, [gameId, adaptGame]);

  /**
   * Resets adaptation state
   */
  const resetAdaptation = useCallback(() => {
    setIsAdapted(false);
    setAdaptationConfig(null);
    setAdaptationError(null);
  }, []);

  return {
    isAdapted,
    adaptationConfig,
    adaptationError,
    compatibilityInfo,
    applyAdaptations,
    resetAdaptation
  };
};

export default useGameCompatibility;