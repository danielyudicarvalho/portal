'use client';

import React from 'react';

export default function SnakeMultiplayerPage() {
    return (
        <div className="min-h-screen bg-gaming-dark">
            <div className="container mx-auto px-4 py-8">
                {/* Game Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-gaming font-bold text-white mb-4">
                        🐍 Multiplayer Snake Battle
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Real-time multiplayer snake game inspired by Slither.io! Battle up to 8 players online with special abilities,
                        different food types, and intense snake-on-snake combat.
                    </p>
                </div>

                {/* Game Instructions */}
                <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                    <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                        <div>
                            <h3 className="text-lg font-semibold text-gaming-accent mb-2">Controls</h3>
                            <ul className="space-y-2 text-sm">
                                <li><span className="text-gaming-accent">WASD or Arrow Keys:</span> Move your snake</li>
                                <li><span className="text-gaming-accent">X:</span> Shoot projectile (costs 5 points)</li>
                                <li><span className="text-gaming-accent">Z:</span> Activate armor (costs 5 points, lasts 10s)</li>
                                <li><span className="text-gaming-accent">R:</span> Respawn when dead</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gaming-accent mb-2">Food Types</h3>
                            <ul className="space-y-2 text-sm">
                                <li><span className="text-purple-400">⚡ Purple:</span> +5 points, +1 shot</li>
                                <li><span className="text-gray-400">🛡️ Gray:</span> +5 points, +1 armor</li>
                                <li><span className="text-red-600">☠️ Dark Red:</span> Poison! Avoid at all costs!</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Combat Rules</h3>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>• Bigger snakes kill smaller snakes on collision</li>
                            <li>• Earn 2 points per segment of defeated opponents</li>
                            <li>• Sessions last 5 minutes, then auto-restart</li>
                            <li>• Up to 8 players can battle simultaneously</li>
                        </ul>
                    </div>
                </div>

                {/* Game Container */}
                <div className="flex justify-center">
                    <div className="bg-gaming-darker border border-gaming-accent/30 rounded-lg overflow-hidden shadow-2xl">
                        <iframe
                            src="/games/snake-multiplayer/index.html"
                            width="1600"
                            height="1000"
                            className="border-0 max-w-full"
                            title="Multiplayer Snake Battle"
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
                            <div className="text-3xl mb-3">🌐</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Online Multiplayer</h3>
                            <p className="text-gray-400 text-sm">Battle up to 8 players from different computers in real-time</p>
                        </div>
                        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">⚔️</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Combat System</h3>
                            <p className="text-gray-400 text-sm">Shooting, armor, and strategic snake-vs-snake battles</p>
                        </div>
                        <div className="bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">🍎</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Dynamic Food</h3>
                            <p className="text-gray-400 text-sm">Multiple food types including dangerous poison food</p>
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