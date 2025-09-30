'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  mobileGameCompatibilityChecker, 
  GameCompatibilityInfo, 
  CompatibilityIssue, 
  GameAdaptation, 
  FallbackMechanism 
} from '@/lib/mobile-game-compatibility';

interface GameCompatibilityCheckerProps {
  gameId: string;
  onCompatibilityCheck?: (info: GameCompatibilityInfo) => void;
  showDetails?: boolean;
}

export const GameCompatibilityChecker: React.FC<GameCompatibilityCheckerProps> = ({
  gameId,
  onCompatibilityCheck,
  showDetails = false
}) => {
  const [compatibilityInfo, setCompatibilityInfo] = useState<GameCompatibilityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(showDetails);

  const checkCompatibility = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await mobileGameCompatibilityChecker.checkCompatibility(gameId);
      setCompatibilityInfo(info);
      onCompatibilityCheck?.(info);
    } catch (error) {
      console.error('Failed to check game compatibility:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, onCompatibilityCheck]);

  useEffect(() => {
    checkCompatibility();
  }, [gameId, checkCompatibility]);

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompatibilityLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Checking compatibility...</span>
      </div>
    );
  }

  if (!compatibilityInfo) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Unable to check compatibility</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compatibility Score */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            compatibilityInfo.isCompatible ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <div className="font-medium">
              {compatibilityInfo.isCompatible ? 'Compatible' : 'Not Compatible'}
            </div>
            <div className={`text-sm ${getCompatibilityColor(compatibilityInfo.compatibilityScore)}`}>
              {getCompatibilityLabel(compatibilityInfo.compatibilityScore)} 
              ({compatibilityInfo.compatibilityScore}%)
            </div>
          </div>
        </div>
        
        {compatibilityInfo.issues.length > 0 && (
          <button
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetailsPanel ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Details Panel */}
      {showDetailsPanel && (
        <div className="space-y-4">
          {/* Issues */}
          {compatibilityInfo.issues.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">Compatibility Issues</h4>
              <div className="space-y-2">
                {compatibilityInfo.issues.map((issue, index) => (
                  <IssueItem key={index} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* Adaptations */}
          {compatibilityInfo.adaptations.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">Available Adaptations</h4>
              <div className="space-y-2">
                {compatibilityInfo.adaptations.map((adaptation, index) => (
                  <AdaptationItem key={index} adaptation={adaptation} />
                ))}
              </div>
            </div>
          )}

          {/* Fallbacks */}
          {compatibilityInfo.fallbacks.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">Fallback Options</h4>
              <div className="space-y-2">
                {compatibilityInfo.fallbacks.map((fallback, index) => (
                  <FallbackItem key={index} fallback={fallback} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const IssueItem: React.FC<{ issue: CompatibilityIssue }> = ({ issue }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
        {issue.severity.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{issue.description}</div>
        {issue.solution && (
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Solution:</span> {issue.solution}
          </div>
        )}
      </div>
    </div>
  );
};

const AdaptationItem: React.FC<{ adaptation: GameAdaptation }> = ({ adaptation }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${
          adaptation.applied ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
        <div>
          <div className="text-sm font-medium text-gray-900">{adaptation.description}</div>
          <div className="text-xs text-gray-500 capitalize">{adaptation.type} adaptation</div>
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        adaptation.applied 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {adaptation.applied ? 'Applied' : 'Available'}
      </span>
    </div>
  );
};

const FallbackItem: React.FC<{ fallback: FallbackMechanism }> = ({ fallback }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${
          fallback.enabled ? 'bg-blue-500' : 'bg-gray-400'
        }`}></div>
        <div>
          <div className="text-sm font-medium text-gray-900">{fallback.description}</div>
          <div className="text-xs text-gray-500 capitalize">{fallback.type.replace('_', ' ')}</div>
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        fallback.enabled 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {fallback.enabled ? 'Enabled' : 'Available'}
      </span>
    </div>
  );
};

export default GameCompatibilityChecker;