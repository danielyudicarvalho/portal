'use client';

import React from 'react';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { GameScoreDisplay } from '@/components/features/GameScoreDisplay';
import GameCostDisplay from '@/components/features/GameCostDisplay';
import { PlayIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';

export default function MemdotPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <StarIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                Memory Dots
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Test your memory skills! Remember the colored circles and click them when they turn white. 
              Score points and compete on the leaderboard!
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Game Area */}
            <div className="lg:col-span-2">
              <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gaming-accent/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Play Memdot
                    </h2>
                    <GameCostDisplay 
                      gameId="memdot" 
                      gameMode="standard"
                      onPlayClick={() => {
                        // Game will start after credit is spent
                        console.log('Starting Memdot game...')
                      }}
                    />
                  </div>
                </div>
                
                <div className="aspect-[2/3] bg-black">
                  <iframe
                    src="/games/memdot/index.html"
                    className="w-full h-full border-0"
                    title="Memory Dots"
                    allow="fullscreen; gamepad; microphone; camera"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              </div>

              {/* Game Instructions */}
              <div className="mt-6 bg-gaming-dark border border-gaming-accent/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">How to Play</h3>
                  <a
                    href="/games/memdot/championship"
                    className="inline-flex items-center px-3 py-1 bg-gaming-accent hover:bg-gaming-accent/80 text-white rounded text-sm transition-colors"
                  >
                    <TrophyIcon className="h-4 w-4 mr-1" />
                    Championship
                  </a>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Objective</h4>
                    <ul className="space-y-1">
                      <li>• Remember the colored circles</li>
                      <li>• Click circles that match the background color</li>
                      <li>• Complete levels to increase difficulty</li>
                      <li>• Avoid clicking wrong circles</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Scoring</h4>
                    <ul className="space-y-1">
                      <li>• 50 points per correct circle</li>
                      <li>• Time bonus for quick completion</li>
                      <li>• Level bonus increases with difficulty</li>
                      <li>• Score multiplier every 3 levels</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Score and Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Game Score */}
              <div className="order-1 lg:order-none">
                <GameScoreDisplay />
              </div>

              {/* Leaderboard */}
              <div className="order-2 lg:order-none">
                <GameLeaderboard gameId="memdot" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}