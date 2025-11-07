'use client';

import React, { useState, useEffect } from 'react';
import { StarIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';

interface GameScoreDisplayProps {
  gameId?: string;
  className?: string;
}

interface GameState {
  score: number;
  level: number;
  multiplier: number;
  isPlaying: boolean;
  gameStartTime: number | null;
}

interface PersonalBest {
  score: number;
  level: number;
}

export function GameScoreDisplay({ gameId = 'memdot', className = '' }: GameScoreDisplayProps) {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    multiplier: 1,
    isPlaying: false,
    gameStartTime: null
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [personalBest, setPersonalBest] = useState<PersonalBest>({ score: 0, level: 1 });

  useEffect(() => {
    // Load personal best from localStorage
    const savedBest = localStorage.getItem(`${gameId}-personal-best`);
    if (savedBest) {
      setPersonalBest(JSON.parse(savedBest));
    }

    // Listen for game state updates from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      // Handle different game message types
      if (event.data.type === 'GAME_STATE_UPDATE' || 
          event.data.type === 'PERFECT_SQUARE_STATE' ||
          event.data.type === 'FILL_THE_HOLES_STATE' ||
          event.data.type === 'CIRCLE_PATH_STATE') {
        const newGameState = event.data.gameState || event.data;
        setGameState(newGameState);
        
        // Update personal best if current score is higher
        if (newGameState.score > personalBest.score) {
          const newBest = { score: newGameState.score, level: newGameState.level };
          setPersonalBest(newBest);
          localStorage.setItem(`${gameId}-personal-best`, JSON.stringify(newBest));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [personalBest.score, gameId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.isPlaying && gameState.gameStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameState.gameStartTime!) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isPlaying, gameState.gameStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <StarIcon className="h-6 w-6 text-gaming-accent mr-2" />
        <h3 className="text-xl font-semibold text-white">Current Game</h3>
      </div>

      <div className="space-y-4">
        {/* Score */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Score</span>
          <div className="flex items-center text-gaming-accent font-bold text-lg">
            <StarIcon className="h-5 w-5 mr-1" />
            {gameState.score.toLocaleString()}
          </div>
        </div>

        {/* Level */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Level</span>
          <div className="flex items-center text-white font-semibold">
            <TrophyIcon className="h-5 w-5 mr-1 text-yellow-500" />
            {gameState.level}
          </div>
        </div>

        {/* Multiplier */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Multiplier</span>
          <div className="text-gaming-accent font-bold">
            x{gameState.multiplier}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Time</span>
          <div className="flex items-center text-white">
            <ClockIcon className="h-5 w-5 mr-1" />
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* Game Status */}
        <div className="pt-2 border-t border-gaming-accent/20">
          <div className="flex items-center justify-center">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              gameState.isPlaying 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {gameState.isPlaying ? '🎮 Playing' : '⏸️ Ready to Play'}
            </div>
          </div>
        </div>

        {/* Personal Best */}
        {personalBest.score > 0 && (
          <div className="pt-2 border-t border-gaming-accent/20">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Personal Best</div>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center text-yellow-500">
                  <StarIcon className="h-4 w-4 mr-1" />
                  {personalBest.score.toLocaleString()}
                </div>
                <div className="flex items-center text-gray-300">
                  <TrophyIcon className="h-4 w-4 mr-1" />
                  Level {personalBest.level}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational message when not playing */}
        {!gameState.isPlaying && gameState.score === 0 && (
          <div className="text-center text-gray-400 text-sm mt-4">
            Start playing to see your live score here!
          </div>
        )}
      </div>
    </div>
  );
}