'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function PerfectSquareChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="perfect-square"
      gameTitle="Perfect Square"
      gameDescription="Test your timing and precision! Grow your square to the perfect size and land it in the target area. Compete for the highest score and climb the leaderboards!"
      gameInstructions={{
        objective: [
          'Grow your square to the perfect size',
          'Time your release perfectly',
          'Land in the target area for maximum points'
        ],
        scoring: [
          'Perfect size bonus',
          'Target accuracy multiplier',
          'Consecutive perfect shots bonus',
          'Level completion rewards'
        ]
      }}
      gameId="perfect-square"
    />
  );
}