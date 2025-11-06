'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function FillTheHolesChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="fill-the-holes"
      gameTitle="Fill the Holes"
      gameDescription="A challenging puzzle game where you need to fill all the holes to complete each level. Test your logic and strategy skills in championship mode!"
      gameInstructions={{
        objective: [
          'Fill all the holes in each level',
          'Use strategic thinking to solve puzzles',
          'Complete levels efficiently for bonus points'
        ],
        scoring: [
          'Points per hole filled',
          'Time bonus for quick completion',
          'Level completion bonus',
          'Perfect level bonus for optimal solutions'
        ]
      }}
      gameId="fill-the-holes"
    />
  );
}