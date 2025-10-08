'use client';

import React from 'react';

export default function BoxJumpMultiplayerPage() {
    return (
        <div className="min-h-screen bg-gaming-dark">
            <div className="container mx-auto px-4 py-8">
                {/* Game Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-gaming font-bold text-white mb-4">
                        📦 Multiplayer Box Jump
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Turn-based multiplayer platformer! At least 5 players take turns attempting each level. 
                        Only those who complete a level can advance to the next one.
                    </p>
                </div>

                {/* Game Instructions */}
                <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                    <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                        <div>
                            <h3 className="text-lg font-semibold text-gaming-accent mb-2">Game Rules</h3>
                            <ul className="space-y-2 text-sm">
                                <li><span className="text-gaming-accent">Minimum Players:</span> 5 players needed to start</li>
                                <li><span className="text-gaming-accent">Turn-Based:</span> Players take turns attempting levels</li>
                                <li><span className="text-gaming-accent">Level Progression:</span> Complete current level to advance</li>
                                <li><span className="text-gaming-accent">Spectating:</span> Watch others when it's not your turn</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gaming-accent mb-2">Controls</h3>
                            <ul className="space-y-2 text-sm">
                                <li><span className="text-gaming-accent">Space Bar:</span> Jump over obstacles</li>
                                <li><span className="text-gaming-accent">Objective:</span> Reach the end without hitting red cubes</li>
                                <li><span className="text-gaming-accent">Death:</span> Hitting cubes resets you to start</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                        <h3 className="text-lg font-semibold text-purple-400 mb-2">Winning Conditions</h3>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>• Complete the most levels to win</li>
                            <li>• In case of tie, player with fewer deaths wins</li>
                            <li>• 20 challenging levels with increasing difficulty</li>
                            <li>• Real-time spectating of other players</li>
                        </ul>
                    </div>
                </div>

                {/* Game Container */}
                <div className="flex justify-center">
                    <div className="bg-gaming-darker border border-gaming-accent/30 rounded-lg overflow-hidden shadow-2xl">
                        <iframe
                            src="/games/box-jump-multiplayer/index.html"
                            width="1200"
                            height="800"
                            className="border-0 max-w-full"
                            title="Multiplayer Box Jump"
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                aspectRatio: '3/2'
                            }}
                        />
                    </div>
                </div>

                {/* Game Features */}
                <div className="mt-8 max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">👥</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Turn-Based Multiplayer</h3>
                            <p className="text-gray-400 text-sm">5+ players take turns attempting each challenging level</p>
                        </div>
                        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">👀</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Live Spectating</h3>
                            <p className="text-gray-400 text-sm">Watch other players attempt levels in real-time</p>
                        </div>
                        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">🏆</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Competitive Progression</h3>
                            <p className="text-gray-400 text-sm">Only successful players advance to harder levels</p>
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