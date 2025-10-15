import { NextRequest, NextResponse } from 'next/server';

interface RoomCreationOptions {
  gameId: string;
  isPrivate: boolean;
  maxPlayers: number;
  settings?: Record<string, any>;
  roomName?: string;
}

interface RoomCreationResponse {
  success: boolean;
  data?: {
    roomId: string;
    roomCode: string;
    inviteLink: string;
    gameId: string;
  };
  error?: string;
}

// Game configurations (same as in the other endpoint)
const GAME_CONFIGS: Record<string, any> = {
  'snake-multiplayer': {
    id: 'snake-multiplayer',
    name: 'Snake Multiplayer',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Classic snake game with multiplayer action'
  },
  'snake-multiplayer-v2': {
    id: 'snake-multiplayer-v2',
    name: 'Snake Multiplayer V2',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8,
    description: 'Enhanced snake game with improved multiplayer features'
  },
  'box-jump-multiplayer': {
    id: 'box-jump-multiplayer',
    name: 'Box Jump Multiplayer',
    roomType: 'box_jump_room',
    minPlayers: 2,
    maxPlayers: 6,
    description: 'Competitive box jumping with multiplayer racing'
  },
  'the-battle': {
    id: 'the-battle',
    name: 'The Battle',
    roomType: 'battle_room',
    minPlayers: 2,
    maxPlayers: 4,
    description: 'Strategic battle game with multiplayer combat'
  }
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createRoomOnServer(options: RoomCreationOptions): Promise<{
  roomId: string;
  roomCode: string;
}> {
  try {
    // In a real implementation, this would connect to the Colyseus server
    const serverUrl = process.env.MULTIPLAYER_SERVER_URL || 'http://localhost:3002';
    
    // This would be a real HTTP request to create a room on the multiplayer server
    // const response = await fetch(`${serverUrl}/api/rooms/create`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(options)
    // });
    // const data = await response.json();
    // return { roomId: data.roomId, roomCode: data.roomCode };
    
    // Simulated response for development
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomCode = generateRoomCode();
    
    return { roomId, roomCode };
  } catch (error) {
    console.error('Failed to create room on server:', error);
    throw new Error('Failed to create room on multiplayer server');
  }
}

function validateRoomOptions(options: RoomCreationOptions): string | null {
  if (!options.gameId) {
    return 'Game ID is required';
  }

  const gameConfig = GAME_CONFIGS[options.gameId];
  if (!gameConfig) {
    return 'Invalid game ID';
  }

  if (options.maxPlayers < gameConfig.minPlayers) {
    return `Minimum ${gameConfig.minPlayers} players required for ${gameConfig.name}`;
  }

  if (options.maxPlayers > gameConfig.maxPlayers) {
    return `Maximum ${gameConfig.maxPlayers} players allowed for ${gameConfig.name}`;
  }

  if (options.roomName && options.roomName.length > 50) {
    return 'Room name must be 50 characters or less';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const options: RoomCreationOptions = {
      gameId: body.gameId,
      isPrivate: body.isPrivate || false,
      maxPlayers: body.maxPlayers || 8,
      settings: body.settings || {},
      roomName: body.roomName || null
    };

    // Validate the room creation options
    const validationError = validateRoomOptions(options);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }

    // Create room on the multiplayer server
    const { roomId, roomCode } = await createRoomOnServer(options);
    
    // Generate invite link
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/games/${options.gameId}/rooms?join=${roomCode}`;

    const response: RoomCreationResponse = {
      success: true,
      data: {
        roomId,
        roomCode,
        inviteLink,
        gameId: options.gameId
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}