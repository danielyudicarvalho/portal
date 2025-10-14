/**
 * Game Navigation Utilities
 * Handles navigation to games with room information and connection details
 */

export interface GameNavigationOptions {
  roomId?: string;
  roomCode?: string;
  gameId: string;
  isQuickMatch?: boolean;
  connectionType?: 'join' | 'create' | 'quick_match' | 'join_by_code';
}

export interface GameConnectionInfo {
  roomId?: string;
  roomCode?: string;
  gameId: string;
  serverUrl?: string;
  connectionType: 'join' | 'create' | 'quick_match' | 'join_by_code';
  timestamp: number;
}

/**
 * Stores game connection information in sessionStorage for the game to access
 */
export function storeGameConnectionInfo(info: GameConnectionInfo): void {
  try {
    const connectionData = {
      ...info,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('gameConnectionInfo', JSON.stringify(connectionData));
    console.log('🎮 Stored game connection info:', connectionData);
  } catch (error) {
    console.error('Failed to store game connection info:', error);
  }
}

/**
 * Retrieves and clears game connection information from sessionStorage
 */
export function getGameConnectionInfo(): GameConnectionInfo | null {
  try {
    const stored = sessionStorage.getItem('gameConnectionInfo');
    if (!stored) return null;
    
    const info = JSON.parse(stored) as GameConnectionInfo;
    
    // Check if the connection info is still valid (within 5 minutes)
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - info.timestamp > maxAge) {
      sessionStorage.removeItem('gameConnectionInfo');
      return null;
    }
    
    return info;
  } catch (error) {
    console.error('Failed to retrieve game connection info:', error);
    return null;
  }
}

/**
 * Clears game connection information from sessionStorage
 */
export function clearGameConnectionInfo(): void {
  try {
    sessionStorage.removeItem('gameConnectionInfo');
  } catch (error) {
    console.error('Failed to clear game connection info:', error);
  }
}

/**
 * Navigates to a game with room connection information
 */
export function navigateToGameWithRoom(
  router: any, 
  options: GameNavigationOptions
): void {
  const connectionInfo: GameConnectionInfo = {
    roomId: options.roomId,
    roomCode: options.roomCode,
    gameId: options.gameId,
    serverUrl: process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:3002',
    connectionType: options.connectionType || 'join',
    timestamp: Date.now()
  };
  
  // Store connection info for the game to access
  storeGameConnectionInfo(connectionInfo);
  
  // Navigate to the game page
  const gameUrl = `/games/${options.gameId}`;
  router.push(gameUrl);
  
  console.log(`🎮 Navigating to ${gameUrl} with room info:`, connectionInfo);
}

/**
 * Builds URL parameters for game connection (alternative approach)
 */
export function buildGameUrlWithRoom(gameId: string, options: Partial<GameNavigationOptions>): string {
  const params = new URLSearchParams();
  
  if (options.roomId) params.set('roomId', options.roomId);
  if (options.roomCode) params.set('roomCode', options.roomCode);
  if (options.connectionType) params.set('type', options.connectionType);
  if (options.isQuickMatch) params.set('quickMatch', 'true');
  
  const queryString = params.toString();
  return `/games/${gameId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Extracts room information from URL parameters
 */
export function extractRoomInfoFromUrl(searchParams: URLSearchParams): Partial<GameConnectionInfo> | null {
  const roomId = searchParams.get('roomId');
  const roomCode = searchParams.get('roomCode');
  const connectionType = searchParams.get('type') as GameConnectionInfo['connectionType'];
  const isQuickMatch = searchParams.get('quickMatch') === 'true';
  
  if (!roomId && !roomCode && !isQuickMatch) {
    return null;
  }
  
  return {
    roomId: roomId || undefined,
    roomCode: roomCode || undefined,
    connectionType: connectionType || 'join',
    timestamp: Date.now()
  };
}

/**
 * Game ID mapping for URL to internal game ID conversion
 */
export const GAME_ID_MAPPING: Record<string, string> = {
  'snake-multiplayer': 'snake-multiplayer',
  'box-jump-multiplayer': 'box-jump-multiplayer', 
  'the-battle': 'the-battle'
};

/**
 * Gets the internal game ID from URL game ID
 */
export function getInternalGameId(urlGameId: string): string {
  return GAME_ID_MAPPING[urlGameId] || urlGameId;
}

/**
 * Checks if a game supports multiplayer rooms
 */
export function isMultiplayerGame(gameId: string): boolean {
  return Object.keys(GAME_ID_MAPPING).includes(gameId);
}