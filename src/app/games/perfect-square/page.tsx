'use client';

import React from 'react';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { GameScoreDisplay } from '@/components/features/GameScoreDisplay';
import { PlayIcon, TrophyIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

export default function PerfectSquarePage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Square3Stack3DIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                Perfect Square
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Master the art of precision timing! Grow your square to the perfect size and land it in the target area. 
              Test your timing and accuracy to achieve the highest score!
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
                      Play Perfect Square
                    </h2>
                    <div className="text-sm text-gray-400">
                      Precision Challenge
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[5/4] bg-black">
                  <iframe
                    src="/games/perfect-square/index.html"
                    className="w-full h-full border-0"
                    title="Perfect Square"
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
                    href="/games/perfect-square/championship"
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
                      <li>• Tap and hold to grow your square</li>
                      <li>• Release to drop it in the target area</li>
                      <li>• Land within the inner target for perfect bonus</li>
                      <li>• Complete up to 10 levels without missing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Scoring</h4>
                    <ul className="space-y-1">
                      <li>• 100 points base score per level</li>
                      <li>• Level bonus: 10 × level number</li>
                      <li>• Perfect landing bonus: 50 points</li>
                      <li>• Completion bonus: 200 × levels completed</li>
                      <li>• Accuracy bonus: up to 500 points</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Score and Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Game Score */}
              <div className="order-1 lg:order-none">
                <GameScoreDisplay gameId="perfect-square" />
              </div>

              {/* Leaderboard */}
              <div className="order-2 lg:order-none">
                <GameLeaderboard gameId="perfect-square" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}