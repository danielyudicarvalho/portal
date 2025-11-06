'use client';

import React from 'react';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { GameScoreDisplay } from '@/components/features/GameScoreDisplay';
import { PlayIcon, TrophyIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';

export default function FillTheHolesPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <PuzzlePieceIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                Fill the Holes
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              A challenging puzzle game where you need to fill all the holes to complete each level. 
              Use strategy and timing to achieve the best score!
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
                      Play Fill the Holes
                    </h2>
                    <div className="text-sm text-gray-400">
                      Puzzle Challenge
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[5/4] bg-black">
                  <iframe
                    src="/games/fill-the-holes/index.html"
                    className="w-full h-full border-0"
                    title="Fill the Holes"
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
                    href="/games/fill-the-holes/championship"
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
                      <li>• Click boxes to move them in different directions</li>
                      <li>• Fill all holes with boxes to complete levels</li>
                      <li>• Use walls strategically to stop boxes</li>
                      <li>• Complete all levels with minimal clicks</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Scoring</h4>
                    <ul className="space-y-1">
                      <li>• 100 points per level completed</li>
                      <li>• Efficiency bonus for fewer clicks</li>
                      <li>• Time bonus for quick completion</li>
                      <li>• Perfect level bonus for optimal solutions</li>
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
                <GameLeaderboard gameId="fill-the-holes" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}