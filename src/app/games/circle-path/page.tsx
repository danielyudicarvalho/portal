'use client';

import React from 'react';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { GameScoreDisplay } from '@/components/features/GameScoreDisplay';
import { PlayIcon, TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function CirclePathPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ArrowPathIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                Circle Path
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Navigate through circular paths in this challenging arcade-style game. 
              Test your reflexes, timing, and precision to achieve the highest score!
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
                      Play Circle Path
                    </h2>
                    <div className="text-sm text-gray-400">
                      Arcade Challenge
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[5/4] bg-black">
                  <iframe
                    src="/games/circle-path/index.html"
                    className="w-full h-full border-0"
                    title="Circle Path"
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
                    href="/games/circle-path/championship"
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
                      <li>• Tap to switch the rotating ball</li>
                      <li>• Hit targets by switching at the right moment</li>
                      <li>• Stay close to target centers for bonus points</li>
                      <li>• Build streaks for score multipliers</li>
                      <li>• Survive as long as possible</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Scoring</h4>
                    <ul className="space-y-1">
                      <li>• 100 points base score per target</li>
                      <li>• Distance bonus for accurate hits</li>
                      <li>• Perfect hit bonus: 50 points</li>
                      <li>• Streak multiplier: up to 5x</li>
                      <li>• Survival bonus: 10 × targets hit</li>
                      <li>• Accuracy bonus: up to 1000 points</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Score and Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Game Score */}
              <div className="order-1 lg:order-none">
                <GameScoreDisplay gameId="circle-path" />
              </div>

              {/* Leaderboard */}
              <div className="order-2 lg:order-none">
                <GameLeaderboard gameId="circle-path" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}