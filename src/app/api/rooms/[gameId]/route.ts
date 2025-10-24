import { NextRequest, NextResponse } from 'next/server';

interface ActiveRoom {
  roomId: string;
  roomCode: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  state: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS' | 'RESET';
  isPrivate: boolean;
  createdAt: number;
  phaseStartedAt?: number;
  phaseEndsAt?: number;
  countdown?: number;
}

interface RoomStatistics {
  totalRooms: number;
  publicRooms: number;
  privateRooms: number;
  totalPlayers: number;
  averagePlayersPerRoom: number;
  roomsByState: {
    LOBBY: number;
    COUNTDOWN: number;
    PLAYING: number;
    RESULTS: number;
    RESET: number;
  };
}

interface GameInfo {
  id: string;
  name: string;
  roomType: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
  features: string[];
}

// Game configurations
const GAME_CONFIGS: Record<string, GameInfo> = {
  'snake-multiplayer': {
    id: 'snake-multiplayer',
    name: 'Snake Multiplayer',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game with multiplayer action',
    features: ['Real-time multiplayer', 'Power-ups', 'Leaderboard']
  },
  'snake-multiplayer-v2': {
    id: 'snake-multiplayer-v2',
    name: 'Snake Multiplayer V2',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Enhanced snake game with improved multiplayer features',
    features: ['Real-time multiplayer', 'Power-ups', 'Leaderboard', 'Enhanced graphics']
  },
  'box-jump-multiplayer': {
    id: 'box-jump-multiplayer',
    name: 'Box Jump Multiplayer',
    roomType: 'box_jump_room',
    minPlayers: 2,
    maxPlayers: 6,
    description: 'Competitive box jumping with multiplayer racing',
    features: ['Real-time racing', 'Level progression', 'Competitive scoring']
  },
  'the-battle': {
    id: 'the-battle',
    name: 'The Battle',
    roomType: 'battle_room',
    minPlayers: 2,
    maxPlayers: 4,
    description: 'Strategic battle game with multiplayer combat',
    features: ['Turn-based combat', 'Strategy elements', 'Power-ups']
  }
};

async function fetchRoomsFromServer(gameId: string): Promise<ActiveRoom[]> {
  try {
    // In a real implementation, this would connect to the Colyseus server
    // For now, we'll simulate the response
    const serverUrl = process.env.MULTIPLAYER_SERVER_URL || 'http://localhost:3002';
    
    // This would be a real HTTP request to the multiplayer server
    // const response = await fetch(`${serverUrl}/api/rooms/${gameId}`);
    // const data = await response.json();
    // return data.rooms;
    
    // Simulated response for development
    return [];
  } catch (error) {
    console.error('Failed to fetch rooms from server:', error);
    return [];
  }
}

async function calculateRoomStatistics(rooms: ActiveRoom[]): Promise<RoomStatistics> {
  const totalRooms = rooms.length;
  const publicRooms = rooms.filter(room => !room.isPrivate).length;
  const privateRooms = rooms.filter(room => room.isPrivate).length;
  const totalPlayers = rooms.reduce((sum, room) => sum + room.playerCount, 0);
  const averagePlayersPerRoom = totalRooms > 0 ? totalPlayers / totalRooms : 0;
  
  const roomsByState = {
    LOBBY: rooms.filter(room => room.state === 'LOBBY').length,
    COUNTDOWN: rooms.filter(room => room.state === 'COUNTDOWN').length,
    PLAYING: rooms.filter(room => room.state === 'PLAYING').length,
    RESULTS: rooms.filter(room => room.state === 'RESULTS').length,
    RESET: rooms.filter(room => room.state === 'RESET').length
  };

  return {
    totalRooms,
    publicRooms,
    privateRooms,
    totalPlayers,
    averagePlayersPerRoom: Math.round(averagePlayersPerRoom * 100) / 100,
    roomsByState
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    
    // Validate game ID
    const gameInfo = GAME_CONFIGS[gameId];
    if (!gameInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid game ID',
          availableGames: Object.keys(GAME_CONFIGS)
        },
        { status: 400 }
      );
    }

    // Fetch active rooms from the multiplayer server
    const rooms = await fetchRoomsFromServer(gameId);
    
    // Calculate statistics
    const statistics = await calculateRoomStatistics(rooms);

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        statistics,
        gameInfo
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}