'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function CirclePathChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="circle-path"
      gameTitle="Circle Path"
      gameDescription="Navigate through challenging circular paths with precision and timing. Master the art of path-finding in this championship mode!"
      gameInstructions={{
        objective: [
          'Navigate through circular paths',
          'Avoid obstacles and barriers',
          'Reach the end of each path successfully'
        ],
        scoring: [
          'Points per path completed',
          'Time bonus for fast completion',
          'Precision bonus for smooth navigation',
          'Level progression multiplier'
        ]
      }}
      gameId="circle-path"
    />
  );
}