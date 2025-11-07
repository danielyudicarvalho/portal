'use client';

import React from 'react';
import GameChampionshipPage from '@/components/features/GameChampionshipPage';

export default function Game123ChampionshipPage() {
  return (
    <GameChampionshipPage
      gameSlug="123"
      gameTitle="123"
      gameDescription="A numbers-based puzzle game that challenges your mathematical thinking and logic skills. Compete in championship mode to prove your numerical prowess!"
      gameInstructions={{
        objective: [
          'Solve number-based puzzles',
          'Use mathematical logic and reasoning',
          'Complete sequences and patterns'
        ],
        scoring: [
          'Points per correct solution',
          'Speed bonus for quick answers',
          'Streak bonus for consecutive correct answers',
          'Difficulty multiplier for harder levels'
        ]
      }}
      gameId="123"
    />
  );
}