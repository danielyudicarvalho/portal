import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GameInfo {
  id: string;
  name: string;
  roomType: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
}

interface ActiveRoom {
  roomId: string;
  roomCode: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  state: string;
  isPrivate: boolean;
}

interface MultiplayerGameCardProps {
  gameId: string;
  title: string;
  description: string;
  image: string;
  href: string;
  isMultiplayer?: boolean;
}

export default function MultiplayerGameCard({
  gameId,
  title,
  description,
  image,
  href,
  isMultiplayer = false
}: MultiplayerGameCardProps) {
  const router = useRouter();
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);

  useEffect(() => {
    if (isMultiplayer) {
      fetchGameInfo();
      fetchActiveRooms();
    }
  }, [isMultiplayer, gameId]);

  const fetchGameInfo = async () => {
    try {
      const response = await fetch('http://localhost:3002/games');
      const data = await response.json();
      const game = data.games.find((g: GameInfo) => g.id === gameId);
      setGameInfo(game || null);
    } catch (error) {
      console.error('Failed to fetch game info:', error);
    }
  };

  const fetchActiveRooms = async () => {
    try {
      // This would be implemented with a proper lobby connection
      // For now, we'll simulate it
      setActiveRooms([]);
    } catch (error) {
      console.error('Failed to fetch active rooms:', error);
    }
  };

  const handleQuickMatch = async () => {
    setIsLoading(true);
    try {
      // Redirect to the multiplayer version of the game with quick match parameter
      router.push(`${href}?mode=quickmatch`);
    } catch (error) {
      console.error('Quick match failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      // Redirect to the multiplayer version of the game with create room parameter
      router.push(`${href}?mode=create`);
    } catch (error) {
      console.error('Create room failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`${href}?mode=join&roomId=${roomId}`);
  };

  const handlePlaySolo = () => {
    router.push(href);
  };

  const handleViewRooms = () => {
    router.push(`/games/${gameId}/rooms`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/game-placeholder.png';
          }}
        />
        {isMultiplayer && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
            MULTIPLAYER
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        
        {isMultiplayer && gameInfo && (
          <div className="mb-4 text-xs text-gray-500">
            <div>Players: {gameInfo.minPlayers}-{gameInfo.maxPlayers}</div>
            {activeRooms.length > 0 && (
              <div>Active rooms: {activeRooms.length}</div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {isMultiplayer ? (
            <>
              <button
                onClick={handleViewRooms}
                className="w-full bg-gaming-accent hover:bg-gaming-accent/80 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                🏠 View Rooms
              </button>
              
              <button
                onClick={handleQuickMatch}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                {isLoading ? 'Connecting...' : '⚡ Quick Match'}
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  🏗️ Create Room
                </button>
                
                <button
                  onClick={() => setShowRoomModal(true)}
                  disabled={isLoading || activeRooms.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  🚪 Join Room
                </button>
              </div>
              
              <button
                onClick={handlePlaySolo}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                🎮 Play Solo
              </button>
            </>
          ) : (
            <button
              onClick={handlePlaySolo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              Play Game
            </button>
          )}
        </div>
      </div>

      {/* Room Selection Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Join Active Room</h3>
            
            {activeRooms.length === 0 ? (
              <p className="text-gray-600 mb-4">No active rooms available. Create one instead!</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {activeRooms.map((room) => (
                  <div
                    key={room.roomId}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleJoinRoom(room.roomId)}
                  >
                    <div>
                      <div className="font-medium">Room {room.roomCode}</div>
                      <div className="text-sm text-gray-600">
                        {room.playerCount}/{room.maxPlayers} players • {room.state}
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRoomModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRoomModal(false);
                  handleCreateRoom();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}