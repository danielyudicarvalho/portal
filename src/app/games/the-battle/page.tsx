'use client';

import React from 'react';

export default function TheBattlePage() {
  return (
    <div className="min-h-screen bg-gaming-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-gaming font-bold text-white mb-4">
            The Battle
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real-time multiplayer tank battle with rock-paper-scissors mechanics! 
            Each tank type has unique strengths and weaknesses. Battle other players online!
          </p>
        </div>

        {/* Game Instructions */}
        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-gaming-accent mb-2">Tank Types</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-red-400">🗿 Rock Tank:</span> High damage, slow movement, beats Scissors</li>
                <li><span className="text-blue-400">📄 Paper Tank:</span> Balanced stats, beats Rock</li>
                <li><span className="text-green-400">✂️ Scissors Tank:</span> Fast movement, rapid fire, beats Paper</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gaming-accent mb-2">Controls</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gaming-accent">Arrow Keys:</span> Move and rotate</li>
                <li><span className="text-gaming-accent">Spacebar:</span> Shoot</li>
                <li><span className="text-gaming-accent">Strategy:</span> Hunt your target type, avoid your counter!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="flex justify-center">
          <div className="bg-gaming-darker border border-gaming-accent/30 rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src="/games/the-battle/index.html"
              width="1600"
              height="1000"
              className="border-0 max-w-full"
              title="The Battle - Multiplayer Tank Game"
              style={{
                maxWidth: '100%',
                height: 'auto',
                aspectRatio: '16/10'
              }}
            />
          </div>
        </div>

        {/* Game Features */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Multiplayer</h3>
              <p className="text-gray-400 text-sm">Battle other players online with seamless real-time gameplay</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">Strategic Combat</h3>
              <p className="text-gray-400 text-sm">Rock-paper-scissors mechanics create strategic depth</p>
            </div>
            <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-white mb-2">Dynamic Gameplay</h3>
              <p className="text-gray-400 text-sm">Auto-transformations and power-ups keep battles exciting</p>
            </div>
          </div>
        </div>

        {/* Back to Games */}
        <div className="text-center mt-8">
          <a
            href="/games"
            className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Games
          </a>
        </div>
      </div>
    </div>
  );
}
