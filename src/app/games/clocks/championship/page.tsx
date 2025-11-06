'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function ClocksChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="clocks"
      gameTitle="Clocks"
      gameDescription="A time-based puzzle game where you need to manage and synchronize different clocks. Test your timing skills in championship mode!"
      gameInstructions={{
        objective: [
          'Synchronize multiple clocks',
          'Manage time-based puzzles',
          'Complete timing challenges'
        ],
        scoring: [
          'Points per synchronized clock',
          'Accuracy bonus for precise timing',
          'Speed bonus for quick solutions',
          'Perfect synchronization bonus'
        ]
      }}
      gameId="clocks"
    />
  );
}