'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function MemdotChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="memdot"
      gameTitle="Memdot"
      gameDescription="Test your memory skills in championship mode! Remember the colored circles and click them when they turn white. Compete for the highest score and climb the leaderboards!"
      gameInstructions={{
        objective: [
          'Remember the colored circles',
          'Click circles that match the background color',
          'Complete levels to increase difficulty'
        ],
        scoring: [
          '50 points per correct circle',
          'Time bonus for quick completion',
          'Level bonus increases with difficulty',
          'Score multiplier every 3 levels'
        ]
      }}
      gameId="memdot"
    />
  );
}