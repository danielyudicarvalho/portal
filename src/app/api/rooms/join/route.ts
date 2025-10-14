import { NextRequest, NextResponse } from 'next/server';

interface JoinRoomRequest {
  roomId?: string;
  roomCode?: string;
  gameId?: string;
}

interface JoinRoomResponse {
  success: boolean;
  data?: {
    roomId: string;
    gameId: string;
    playerCount: number;
    maxPlayers: number;
    redirectUrl: string;
  };
  error?: string;
}

// Game configurations (same as in other endpoints)
const GAME_CONFIGS: Record<string, any> = {
  'snake-multiplayer': {
    id: 'snake-multiplayer',
    name: 'Snake Multiplayer',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8
  },
  'snake-multiplayer-v2': {
    id: 'snake-multiplayer-v2',
    name: 'Snake Multiplayer V2',
    roomType: 'snake_room',
    minPlayers: 2,
    maxPlayers: 8
  },
  'box-jump-multiplayer': {
    id: 'box-jump-multiplayer',
    name: 'Box Jump Multiplayer',
    roomType: 'box_jump_room',
    minPlayers: 2,
    maxPlayers: 6
  },
  'the-battle': {
    id: 'the-battle',
    name: 'The Battle',
    roomType: 'battle_room',
    minPlayers: 2,
    maxPlayers: 4
  }
};

async function joinRoomOnServer(request: JoinRoomRequest): Promise<{
  roomId: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
}> {
  try {
    // In a real implementation, this would connect to the Colyseus server
    const serverUrl = process.env.MULTIPLAYER_SERVER_URL || 'http://localhost:3002';
    
    // This would be a real HTTP request to join a room on the multiplayer server
    // const response = await fetch(`${serverUrl}/api/rooms/join`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
    // 
    // if (!response.ok) {
    //   const error = await response.json();
    //   throw new Error(error.message || 'Failed to join room');
    // }
    // 
    // const data = await response.json();
    // return data;
    
    // Simulated response for development
    if (request.roomCode) {
      // Simulate room lookup by code
      const gameId = request.gameId || 'snake-multiplayer';
      const gameConfig = GAME_CONFIGS[gameId];
      
      if (!gameConfig) {
        throw new Error('Invalid game ID');
      }
      
      return {
        roomId: `room_${request.roomCode.toLowerCase()}`,
        gameId,
        playerCount: Math.floor(Math.random() * (gameConfig.maxPlayers - 1)) + 1,
        maxPlayers: gameConfig.maxPlayers
      };
    }
    
    if (request.roomId) {
      // Simulate room lookup by ID
      const gameId = request.gameId || 'snake-multiplayer';
      const gameConfig = GAME_CONFIGS[gameId];
      
      if (!gameConfig) {
        throw new Error('Invalid game ID');
      }
      
      return {
        roomId: request.roomId,
        gameId,
        playerCount: Math.floor(Math.random() * (gameConfig.maxPlayers - 1)) + 1,
        maxPlayers: gameConfig.maxPlayers
      };
    }
    
    throw new Error('Either roomId or roomCode must be provided');
    
  } catch (error) {
    console.error('Failed to join room on server:', error);
    throw error;
  }
}

function validateJoinRequest(request: JoinRoomRequest): string | null {
  if (!request.roomId && !request.roomCode) {
    return 'Either roomId or roomCode must be provided';
  }

  if (request.roomCode && !/^[A-Z0-9]{6}$/.test(request.roomCode)) {
    return 'Invalid room code format. Must be 6 alphanumeric characters';
  }

  if (request.gameId && !GAME_CONFIGS[request.gameId]) {
    return 'Invalid game ID';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const joinRequest: JoinRoomRequest = {
      roomId: body.roomId || null,
      roomCode: body.roomCode || null,
      gameId: body.gameId || null
    };

    // Validate the join request
    const validationError = validateJoinRequest(joinRequest);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }

    // Attempt to join room on the multiplayer server
    const roomInfo = await joinRoomOnServer(joinRequest);
    
    // Generate redirect URL
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/games/${roomInfo.gameId}?mode=multiplayer&roomId=${roomInfo.roomId}`;

    const response: JoinRoomResponse = {
      success: true,
      data: {
        roomId: roomInfo.roomId,
        gameId: roomInfo.gameId,
        playerCount: roomInfo.playerCount,
        maxPlayers: roomInfo.maxPlayers,
        redirectUrl
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error joining room:', error);
    
    // Handle specific error cases
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('Room not found') || errorMessage.includes('Invalid room code')) {
        statusCode = 404;
      } else if (errorMessage.includes('Room is full')) {
        statusCode = 409;
      } else if (errorMessage.includes('Invalid')) {
        statusCode = 400;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: statusCode }
    );
  }
}

// GET endpoint for joining by room code via URL parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('code');
    const gameId = searchParams.get('gameId');

    if (!roomCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Room code is required' 
        },
        { status: 400 }
      );
    }

    // Use the same logic as POST but with URL parameters
    const joinRequest: JoinRoomRequest = {
      roomCode,
      gameId: gameId || undefined
    };

    const validationError = validateJoinRequest(joinRequest);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }

    const roomInfo = await joinRoomOnServer(joinRequest);
    
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/games/${roomInfo.gameId}?mode=multiplayer&roomId=${roomInfo.roomId}`;

    const response: JoinRoomResponse = {
      success: true,
      data: {
        roomId: roomInfo.roomId,
        gameId: roomInfo.gameId,
        playerCount: roomInfo.playerCount,
        maxPlayers: roomInfo.maxPlayers,
        redirectUrl
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error joining room via GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}