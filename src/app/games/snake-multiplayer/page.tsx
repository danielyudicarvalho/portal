'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getGameConnectionInfo, 
  clearGameConnectionInfo, 
  extractRoomInfoFromUrl,
  GameConnectionInfo 
} from '@/lib/game-navigation';
import GameLoadingScreen from '@/components/features/GameLoadingScreen';

function SnakeMultiplayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [connectionInfo, setConnectionInfo] = useState<GameConnectionInfo | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [progress, setProgress] = useState({
        step: 'connecting' as const,
        message: 'Connecting to server...'
    });

    useEffect(() => {
        // Check for room connection information
        const storedInfo = getGameConnectionInfo();
        const urlInfo = extractRoomInfoFromUrl(searchParams);
        
        const roomInfo = storedInfo || (urlInfo ? {
            ...urlInfo,
            gameId: 'snake-multiplayer',
            serverUrl: process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:3002'
        } as GameConnectionInfo : null);

        if (roomInfo) {
            setConnectionInfo(roomInfo);
            setIsConnecting(true);
            handleRoomConnection(roomInfo);
        }
    }, [searchParams]);

    const handleRoomConnection = async (info: GameConnectionInfo) => {
        try {
            setProgress({ step: 'connecting', message: 'Connecting to multiplayer server...' });
            
            // Simulate connection steps (in real implementation, this would connect to the actual game)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setProgress({ step: 'joining', message: 'Joining room...' });
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setProgress({ step: 'loading', message: 'Loading game...' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setProgress({ step: 'ready', message: 'Ready to play!' });
            
            // Store connection info for the game iframe to access
            if (typeof window !== 'undefined') {
                window.gameConnectionInfo = info;
            }
            
            setIsConnecting(false);
            clearGameConnectionInfo();
            
        } catch (error) {
            console.error('Failed to connect to room:', error);
            setConnectionError(error instanceof Error ? error.message : 'Failed to connect to room');
            setIsConnecting(false);
        }
    };

    const handleCancelConnection = () => {
        setIsConnecting(false);
        setConnectionInfo(null);
        clearGameConnectionInfo();
        router.push('/games/snake-multiplayer/rooms');
    };

    const handleRetryConnection = () => {
        if (connectionInfo) {
            setConnectionError(null);
            setIsConnecting(true);
            handleRoomConnection(connectionInfo);
        }
    };

    const buildGameUrl = () => {
        // Use the Colyseus-enabled v2 client so joining the same room puts
        // all players into the same Colyseus session
        let gameUrl = '/games/snake-multiplayer-v2/index.html';
        
        if (connectionInfo) {
            const params = new URLSearchParams();
            if (connectionInfo.roomId) params.set('roomId', connectionInfo.roomId);
            if (connectionInfo.roomCode) params.set('roomCode', connectionInfo.roomCode);
            if (connectionInfo.connectionType) params.set('connectionType', connectionInfo.connectionType);
            if (connectionInfo.serverUrl) params.set('serverUrl', connectionInfo.serverUrl);
            
            const queryString = params.toString();
            if (queryString) {
                gameUrl += `?${queryString}`;
            }
        }
        
        return gameUrl;
    };

    // Show loading screen if connecting to a room
    if (connectionInfo && (isConnecting || connectionError)) {
        return (
            <GameLoadingScreen
                connectionInfo={connectionInfo}
                onCancel={handleCancelConnection}
                onRetry={connectionError ? handleRetryConnection : undefined}
                error={connectionError}
                isConnecting={isConnecting}
                progress={progress}
            />
        );
    }

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
                            src={buildGameUrl()}
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

                {/* Action Buttons */}
                <div className="text-center mt-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/games/snake-multiplayer/rooms"
                            className="inline-flex items-center px-6 py-3 bg-gaming-accent hover:bg-gaming-accent/80 text-white font-semibold rounded-lg transition-colors"
                        >
                            🏛️ View Rooms
                        </a>
                        <a
                            href="/games"
                            className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
                        >
                            ← Back to Games
                        </a>
                    </div>
                    
                    {connectionInfo && (
                        <div className="text-sm text-gaming-accent">
                            🎮 Connected to room: {connectionInfo.roomCode || connectionInfo.roomId?.slice(-6)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SnakeMultiplayerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-accent mx-auto mb-4"></div>
                    <p className="text-white">Loading game...</p>
                </div>
            </div>
        }>
            <SnakeMultiplayerContent />
        </Suspense>
    );
}
