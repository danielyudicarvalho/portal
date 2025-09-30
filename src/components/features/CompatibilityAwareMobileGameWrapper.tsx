'use client';

import React, { useEffect, useState } from 'react';
import { useGameCompatibility, useGameAdaptation } from '@/hooks/useGameCompatibility';
import { GameCompatibilityChecker } from './GameCompatibilityChecker';
import { MobileGameWrapper } from './MobileGameWrapper';
import { GameCompatibilityInfo } from '@/lib/mobile-game-compatibility';

interface CompatibilityAwareMobileGameWrapperProps {
  gameId: string;
  gameSrc: string;
  title: string;
  onGameLoad?: () => void;
  onGameError?: (error: Error) => void;
  showCompatibilityInfo?: boolean;
  autoAdapt?: boolean;
}

export const CompatibilityAwareMobileGameWrapper: React.FC<CompatibilityAwareMobileGameWrapperProps> = ({
  gameId,
  gameSrc,
  title,
  onGameLoad,
  onGameError,
  showCompatibilityInfo = true,
  autoAdapt = true
}) => {

  const [, setGameLoaded] = useState(false);
  const [showCompatibilityPanel, setShowCompatibilityPanel] = useState(false);
  const [adaptationApplied, setAdaptationApplied] = useState(false);

  const { 
    compatibilityInfo, 
    isLoading: compatibilityLoading,
    error: compatibilityError 
  } = useGameCompatibility(gameId);

  const {
    isAdapted,
    adaptationConfig,
    adaptationError,
    resetAdaptation
  } = useGameAdaptation(gameId);

  // Handle game load
  const handleGameLoad = async () => {
    setGameLoaded(true);
    
    if (autoAdapt && !isAdapted) {
      try {
        // Auto-adaptation will be handled by the MobileGameWrapper internally
        setAdaptationApplied(true);
      } catch (error) {
        console.error('Failed to apply game adaptations:', error);
      }
    }
    
    onGameLoad?.();
  };

  // Handle game error
  const handleGameError = (error: Error) => {
    console.error('Game loading error:', error);
    onGameError?.(error);
  };

  // Handle compatibility check result
  const handleCompatibilityCheck = (info: GameCompatibilityInfo) => {
    // Show compatibility panel if there are issues
    if (info.issues.length > 0 && showCompatibilityInfo) {
      setShowCompatibilityPanel(true);
    }
  };

  // Reset adaptation when game changes
  useEffect(() => {
    resetAdaptation();
    setAdaptationApplied(false);
    setGameLoaded(false);
  }, [gameId, resetAdaptation]);

  const shouldShowGame = !compatibilityLoading && 
    (compatibilityInfo?.isCompatible || compatibilityInfo?.compatibilityScore >= 40);

  return (
    <div className="space-y-4">
      {/* Compatibility Information */}
      {showCompatibilityInfo && compatibilityInfo && (
        <GameCompatibilityChecker
          gameId={gameId}
          onCompatibilityCheck={handleCompatibilityCheck}
          showDetails={showCompatibilityPanel}
        />
      )}

      {/* Compatibility Error */}
      {compatibilityError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-red-500">⚠️</div>
            <div className="text-sm text-red-700">
              Compatibility check failed: {compatibilityError}
            </div>
          </div>
        </div>
      )}

      {/* Adaptation Status */}
      {adaptationApplied && adaptationConfig && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-blue-500">✓</div>
            <div className="text-sm text-blue-700">
              Game adapted for mobile with {adaptationConfig.touchControls.length} touch controls
            </div>
          </div>
        </div>
      )}

      {/* Adaptation Error */}
      {adaptationError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-yellow-500">⚠️</div>
            <div className="text-sm text-yellow-700">
              Adaptation warning: {adaptationError}
            </div>
          </div>
        </div>
      )}

      {/* Game Loading State */}
      {compatibilityLoading && (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Checking game compatibility...</span>
          </div>
        </div>
      )}

      {/* Incompatible Game Warning */}
      {compatibilityInfo && !compatibilityInfo.isCompatible && compatibilityInfo.compatibilityScore < 40 && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto text-red-500 text-2xl">⚠️</div>
            <div className="text-lg font-medium text-red-900">Game Not Compatible</div>
            <div className="text-sm text-red-700 max-w-md mx-auto">
              This game may not work properly on your device due to compatibility issues. 
              You can try to play it anyway, but the experience may be poor.
            </div>
            <div className="flex justify-center space-x-3 mt-4">
              <button
                onClick={() => setShowCompatibilityPanel(true)}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                View Issues
              </button>
              <button
                onClick={() => {/* Force load game */}}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Try Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Container */}
      {shouldShowGame && (
        <MobileGameWrapper
          gameId={gameId}
          gameConfig={{
            width: 800,
            height: 600,
            scaleMode: 'fit',
            touchControls: [],
            preferredOrientation: 'any'
          }}
          onGameLoad={handleGameLoad}
          onGameError={handleGameError}
          className="compatibility-aware-game"
        >
          <iframe
            src={gameSrc}
            title={title}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </MobileGameWrapper>
      )}

      {/* Fallback Options */}
      {compatibilityInfo && compatibilityInfo.fallbacks.length > 0 && (
        <div className="mt-4">
          <FallbackOptionsPanel 
            gameId={gameId}
            fallbacks={compatibilityInfo.fallbacks}
            onFallbackEnabled={(fallback) => {
              console.log('Fallback enabled:', fallback);
            }}
          />
        </div>
      )}
    </div>
  );
};

interface FallbackOptionsPanelProps {
  gameId: string;
  fallbacks: Array<{ type: string; description: string; enabled: boolean; config?: Record<string, unknown> }>;
  onFallbackEnabled?: (fallback: { type: string; description: string; enabled: boolean; config?: Record<string, unknown> }) => void;
}

const FallbackOptionsPanel: React.FC<FallbackOptionsPanelProps> = ({
  fallbacks,
  onFallbackEnabled
}) => {
  const [expandedFallbacks, setExpandedFallbacks] = useState<Set<number>>(new Set());

  const toggleFallback = (index: number) => {
    const newExpanded = new Set(expandedFallbacks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFallbacks(newExpanded);
  };

  const enableFallback = (fallback: { type: string; description: string; enabled: boolean; config?: Record<string, unknown> }) => {
    fallback.enabled = true;
    onFallbackEnabled?.(fallback);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Available Fallback Options</h4>
      <div className="space-y-2">
        {fallbacks.map((fallback, index) => (
          <div key={index} className="border rounded-lg">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleFallback(index)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  fallback.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {fallback.description}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {fallback.type.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!fallback.enabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      enableFallback(fallback);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    Enable
                  </button>
                )}
                <div className={`transform transition-transform ${
                  expandedFallbacks.has(index) ? 'rotate-180' : ''
                }`}>
                  ▼
                </div>
              </div>
            </div>
            
            {expandedFallbacks.has(index) && fallback.config && (
              <div className="px-3 pb-3 border-t bg-gray-50">
                <div className="text-xs text-gray-600 mt-2">
                  <strong>Configuration:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(fallback.config, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompatibilityAwareMobileGameWrapper;