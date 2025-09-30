'use client';

import React from 'react';
import { MobileGameWrapper, type GameConfig } from '../MobileGameWrapper';

/**
 * Example usage of MobileGameWrapper component
 * This demonstrates how to configure and use the wrapper for different types of games
 */

// Example configuration for a platformer game that requires keyboard input
const platformerGameConfig: GameConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fit',
  requiresKeyboard: true,
  supportsTouch: true,
  touchControls: [
    {
      id: 'jump',
      type: 'button',
      position: { x: 650, y: 450 },
      size: { width: 80, height: 80 },
      keyMapping: ['Space', 'ArrowUp', 'w'],
      label: 'Jump',
    },
    {
      id: 'move-left',
      type: 'button',
      position: { x: 50, y: 450 },
      size: { width: 70, height: 70 },
      keyMapping: ['ArrowLeft', 'a'],
      label: '←',
    },
    {
      id: 'move-right',
      type: 'button',
      position: { x: 150, y: 450 },
      size: { width: 70, height: 70 },
      keyMapping: ['ArrowRight', 'd'],
      label: '→',
    },
    {
      id: 'action',
      type: 'button',
      position: { x: 550, y: 450 },
      size: { width: 70, height: 70 },
      keyMapping: ['Enter', 'e'],
      label: 'Action',
    },
  ],
  minScreenSize: {
    width: 320,
    height: 480,
  },
  preferredOrientation: 'landscape',
};

// Example configuration for a puzzle game that works well with touch
const puzzleGameConfig: GameConfig = {
  width: 600,
  height: 800,
  scaleMode: 'fit',
  requiresKeyboard: false,
  supportsTouch: true,
  touchControls: [], // No virtual controls needed for touch-native games
  minScreenSize: {
    width: 300,
    height: 400,
  },
  preferredOrientation: 'portrait',
};

// Example configuration for a racing game with custom controls
const racingGameConfig: GameConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fill',
  requiresKeyboard: true,
  supportsTouch: true,
  touchControls: [
    {
      id: 'accelerate',
      type: 'button',
      position: { x: 650, y: 400 },
      size: { width: 100, height: 60 },
      keyMapping: ['ArrowUp', 'w'],
      label: 'Gas',
    },
    {
      id: 'brake',
      type: 'button',
      position: { x: 650, y: 480 },
      size: { width: 100, height: 60 },
      keyMapping: ['ArrowDown', 's'],
      label: 'Brake',
    },
    {
      id: 'steer-left',
      type: 'button',
      position: { x: 50, y: 440 },
      size: { width: 80, height: 80 },
      keyMapping: ['ArrowLeft', 'a'],
      label: '↶',
    },
    {
      id: 'steer-right',
      type: 'button',
      position: { x: 150, y: 440 },
      size: { width: 80, height: 80 },
      keyMapping: ['ArrowRight', 'd'],
      label: '↷',
    },
  ],
  minScreenSize: {
    width: 480,
    height: 320,
  },
  preferredOrientation: 'landscape',
};

interface ExampleGameProps {
  gameType: 'platformer' | 'puzzle' | 'racing';
  gameUrl: string;
  gameTitle: string;
}

export function MobileGameWrapperExample({ gameType, gameUrl, gameTitle }: ExampleGameProps) {
  // Select the appropriate configuration based on game type
  const getGameConfig = (): GameConfig => {
    switch (gameType) {
      case 'platformer':
        return platformerGameConfig;
      case 'puzzle':
        return puzzleGameConfig;
      case 'racing':
        return racingGameConfig;
      default:
        return platformerGameConfig;
    }
  };

  const gameConfig = getGameConfig();

  const handleGameLoad = () => {
    console.log(`${gameTitle} loaded successfully`);
    // You can add analytics tracking here
  };

  const handleGameError = (error: Error) => {
    console.error(`${gameTitle} error:`, error);
    // You can add error reporting here
  };

  const handleFullscreenToggle = (isFullscreen: boolean) => {
    console.log(`${gameTitle} fullscreen:`, isFullscreen);
    // You can add fullscreen analytics here
  };

  return (
    <div className="h-screen w-screen bg-black">
      <MobileGameWrapper
        gameId={gameType}
        gameConfig={gameConfig}
        onGameLoad={handleGameLoad}
        onGameError={handleGameError}
        onFullscreenToggle={handleFullscreenToggle}
        className="w-full h-full"
      >
        <iframe
          src={gameUrl}
          className="w-full h-full border-0"
          title={gameTitle}
          allow="fullscreen"
        />
      </MobileGameWrapper>
    </div>
  );
}

// Usage examples:

export function PlatformerGameExample() {
  return (
    <MobileGameWrapperExample
      gameType="platformer"
      gameUrl="/games/box-jump/index.html"
      gameTitle="Box Jump - Platformer Game"
    />
  );
}

export function PuzzleGameExample() {
  return (
    <MobileGameWrapperExample
      gameType="puzzle"
      gameUrl="/games/memdot/index.html"
      gameTitle="MemDot - Memory Puzzle Game"
    />
  );
}

export function RacingGameExample() {
  return (
    <MobileGameWrapperExample
      gameType="racing"
      gameUrl="/games/circle-path/index.html"
      gameTitle="Circle Path - Racing Game"
    />
  );
}

export default MobileGameWrapperExample;