'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  UserGroupIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import { GameConnectionInfo } from '@/lib/game-navigation';

interface GameLoadingScreenProps {
  connectionInfo: GameConnectionInfo;
  onCancel: () => void;
  onRetry?: () => void;
  error?: string | null;
  isConnecting?: boolean;
  progress?: {
    step: 'connecting' | 'joining' | 'loading' | 'ready';
    message: string;
  };
}

const GameLoadingScreen: React.FC<GameLoadingScreenProps> = ({
  connectionInfo,
  onCancel,
  onRetry,
  error = null,
  isConnecting = true,
  progress = { step: 'connecting', message: 'Connecting to server...' }
}) => {
  const [dots, setDots] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Animated dots for loading
  useEffect(() => {
    if (!isConnecting) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, [isConnecting]);

  // Track time elapsed
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getConnectionTypeLabel = () => {
    switch (connectionInfo.connectionType) {
      case 'join':
        return `Joining Room ${connectionInfo.roomCode || connectionInfo.roomId?.slice(-6)}`;
      case 'join_by_code':
        return `Joining Private Room ${connectionInfo.roomCode}`;
      case 'create':
        return 'Creating New Room';
      case 'quick_match':
        return 'Finding Quick Match';
      default:
        return 'Connecting to Game';
    }
  };

  const getStepIcon = () => {
    switch (progress.step) {
      case 'connecting':
        return <WifiIcon className="h-8 w-8 text-gaming-accent animate-pulse" />;
      case 'joining':
        return <UserGroupIcon className="h-8 w-8 text-gaming-accent animate-bounce" />;
      case 'loading':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gaming-accent"></div>;
      case 'ready':
        return <PlayIcon className="h-8 w-8 text-green-400" />;
      default:
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gaming-accent"></div>;
    }
  };

  const getProgressPercentage = () => {
    switch (progress.step) {
      case 'connecting': return 25;
      case 'joining': return 50;
      case 'loading': return 75;
      case 'ready': return 100;
      default: return 0;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-400 text-6xl mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Connection Failed</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Connection Details</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p><span className="text-gaming-accent">Type:</span> {getConnectionTypeLabel()}</p>
              <p><span className="text-gaming-accent">Game:</span> {connectionInfo.gameId}</p>
              {connectionInfo.roomId && (
                <p><span className="text-gaming-accent">Room ID:</span> {connectionInfo.roomId.slice(-8)}</p>
              )}
              {connectionInfo.roomCode && (
                <p><span className="text-gaming-accent">Room Code:</span> {connectionInfo.roomCode}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            {onRetry && (
              <Button
                variant="primary"
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-6xl mb-4">🎮</div>
            <div className="absolute -top-2 -right-2">
              {getStepIcon()}
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          {getConnectionTypeLabel()}
        </h1>
        
        {/* Progress Message */}
        <p className="text-gaming-accent text-lg mb-6">
          {progress.message}{dots}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className="bg-gaming-accent h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Connection Details */}
        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 space-y-2">
            <div className="flex justify-between">
              <span>Game:</span>
              <span className="text-white font-medium">{connectionInfo.gameId}</span>
            </div>
            {connectionInfo.roomCode && (
              <div className="flex justify-between">
                <span>Room Code:</span>
                <span className="text-gaming-accent font-mono">{connectionInfo.roomCode}</span>
              </div>
            )}
            {connectionInfo.roomId && (
              <div className="flex justify-between">
                <span>Room ID:</span>
                <span className="text-gray-300 font-mono">{connectionInfo.roomId.slice(-8)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="text-white">{timeElapsed}s</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={progress.step === 'ready'}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        {/* Help Text */}
        <div className="mt-6 text-xs text-gray-500">
          <p>This may take a few moments while we connect you to the game.</p>
          {timeElapsed > 10 && (
            <p className="text-yellow-400 mt-2">
              Taking longer than usual? Check your internet connection.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLoadingScreen;