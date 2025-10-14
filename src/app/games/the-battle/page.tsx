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

function TheBattleContent() {
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
            gameId: 'the-battle',
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
        router.push('/games/the-battle/rooms');
    };

    const handleRetryConnection = () => {
        if (connectionInfo) {
            setConnectionError(null);
            setIsConnecting(true);
            handleRoomConnection(connectionInfo);
        }
    };

    const buildGameUrl = () => {
        let gameUrl = '/games/the-battle/index.html';
        
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
              src={buildGameUrl()}
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

        {/* Action Buttons */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/games/the-battle/rooms"
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

export default function TheBattlePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-accent mx-auto mb-4"></div>
                    <p className="text-white">Loading game...</p>
                </div>
            </div>
        }>
            <TheBattleContent />
        </Suspense>
    );
}
