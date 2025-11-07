'use client';

import React from 'react';
import { Layout } from '@/components/layout';
import { GameLeaderboard } from '@/components/features/GameLeaderboard';
import { GameScoreDisplay } from '@/components/features/GameScoreDisplay';
import { PlayIcon, TrophyIcon, CalculatorIcon } from '@heroicons/react/24/outline';

export default function NumbersPage() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CalculatorIcon className="h-10 w-10 text-gaming-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-white">
                123 Math Challenge
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Test your mental math skills! Solve arithmetic expressions quickly and accurately. 
              Choose the correct result (1, 2, or 3) before time runs out!
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
                      Play 123 Math Challenge
                    </h2>
                    <div className="text-sm text-gray-400">
                      Math Puzzle
                    </div>
                  </div>
                </div>
                
                <div className="aspect-square bg-black">
                  <iframe
                    src="/games/123/index.html"
                    className="w-full h-full border-0"
                    title="123 Math Challenge"
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
                    href="/games/123/championship"
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
                      <li>• Solve arithmetic expressions quickly</li>
                      <li>• Choose the correct result: 1, 2, or 3</li>
                      <li>• Answer before the time bar runs out</li>
                      <li>• Build up your score with consecutive correct answers</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gaming-accent mb-2">Scoring</h4>
                    <ul className="space-y-1">
                      <li>• Points based on answer speed</li>
                      <li>• Faster answers = higher scores</li>
                      <li>• Difficulty increases with score</li>
                      <li>• Compete for the highest score!</li>
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
                <GameLeaderboard gameId="123" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}