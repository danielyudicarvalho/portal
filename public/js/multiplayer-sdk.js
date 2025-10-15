/**
 * Multiplayer SDK for Game Portal
 * Provides a unified interface for all multiplayer games using Colyseus
 */

class MultiplayerSDK {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'ws://localhost:3002';
    this.client = null;
    this.room = null;
    this.lobby = null;
    this.playerId = null;
    this.isHost = false;
    this.gameState = null;
    
    // Event handlers
    this.eventHandlers = {
      'connected': [],
      'disconnected': [],
      'room_joined': [],
      'room_left': [],
      'player_joined': [],
      'player_left': [],
      'player_ready': [],
      'game_started': [],
      'game_ended': [],
      'game_update': [],
      'countdown_started': [],
      'countdown_tick': [],
      'error': [],
      'rooms_updated': [],
      'room_created': [],
      'room_state_changed': []
    };
    
    this.initializeColyseus();
  }

  async initializeColyseus() {
    try {
      // Import Colyseus client
      if (typeof window !== 'undefined') {
        // Browser environment
        if (!window.Colyseus) {
          console.error('Colyseus client not loaded. Please include colyseus.js');
          return;
        }
        this.client = new window.Colyseus.Client(this.serverUrl);
      } else {
        // Node.js environment
        const { Client } = require('colyseus.js');
        this.client = new Client(this.serverUrl);
      }
      
      this.emit('connected');
      console.log('🔌 Connected to multiplayer server');
      
    } catch (error) {
      console.error('Failed to initialize Colyseus:', error);
      this.emit('error', { message: 'Failed to connect to server' });
    }
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  emit(event, data = {}) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Room discovery and management
  async connectToLobby() {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      this.lobby = await this.client.joinOrCreate('lobby');
      this.setupLobbyHandlers();
      console.log('🏠 Connected to lobby');
      return this.lobby;
    } catch (error) {
      console.error('Failed to connect to lobby:', error);
      this.emit('error', { message: 'Failed to connect to lobby' });
      throw error;
    }
  }

  async disconnectFromLobby() {
    if (this.lobby) {
      this.lobby.leave();
      this.lobby = null;
      console.log('👋 Disconnected from lobby');
    }
  }

  async getActiveRooms(gameId) {
    if (!this.lobby) {
      await this.connectToLobby();
    }

    return new Promise((resolve, reject) => {
      this.lobby.send('get_active_rooms', { gameId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting active rooms'));
      }, 5000);

      const handleRoomsResponse = (data) => {
        clearTimeout(timeout);
        this.lobby.off('active_rooms', handleRoomsResponse);
        resolve(data.rooms || []);
      };

      this.lobby.onMessage('active_rooms', handleRoomsResponse);
    });
  }

  async createRoomWithOptions(gameId, options = {}) {
    if (!this.lobby) {
      await this.connectToLobby();
    }

    return new Promise((resolve, reject) => {
      const roomOptions = {
        gameId,
        isPrivate: options.isPrivate || false,
        maxPlayers: options.maxPlayers || 8,
        settings: options.settings || {},
        roomName: options.roomName || null,
        ...options
      };

      this.lobby.send('create_room', roomOptions);
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout creating room'));
      }, 10000);

      const handleRoomCreated = async (data) => {
        clearTimeout(timeout);
        this.lobby.off('room_created', handleRoomCreated);
        this.lobby.off('error', handleError);
        
        try {
          // Join the created room
          await this.joinRoom(data.roomId);
          this.emit('room_created', data);
          resolve({
            roomId: data.roomId,
            roomCode: data.roomCode,
            inviteLink: `${window.location.origin}/games/${gameId}/rooms?join=${data.roomCode}`
          });
        } catch (error) {
          reject(error);
        }
      };

      const handleError = (error) => {
        clearTimeout(timeout);
        this.lobby.off('room_created', handleRoomCreated);
        this.lobby.off('error', handleError);
        reject(new Error(error.message || 'Failed to create room'));
      };

      this.lobby.onMessage('room_created', handleRoomCreated);
      this.lobby.onMessage('error', handleError);
    });
  }

  async joinRoomByCode(roomCode) {
    if (!this.lobby) {
      await this.connectToLobby();
    }

    return new Promise((resolve, reject) => {
      this.lobby.send('join_by_code', { roomCode });
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout joining room by code'));
      }, 10000);

      const handleJoinSuccess = async (data) => {
        clearTimeout(timeout);
        this.lobby.off('join_room_success', handleJoinSuccess);
        this.lobby.off('error', handleError);
        
        try {
          await this.joinRoom(data.roomId);
          resolve(data.roomId);
        } catch (error) {
          reject(error);
        }
      };

      const handleError = (error) => {
        clearTimeout(timeout);
        this.lobby.off('join_room_success', handleJoinSuccess);
        this.lobby.off('error', handleError);
        reject(new Error(error.message || 'Failed to join room'));
      };

      this.lobby.onMessage('join_room_success', handleJoinSuccess);
      this.lobby.onMessage('error', handleError);
    });
  }

  setupLobbyHandlers() {
    if (!this.lobby) return;

    this.lobby.onMessage('rooms_updated', (data) => {
      this.emit('rooms_updated', data);
    });

    this.lobby.onMessage('room_state_changed', (data) => {
      this.emit('room_state_changed', data);
    });

    this.lobby.onError((code, message) => {
      console.error(`❌ Lobby error (${code}): ${message}`);
      this.emit('error', { code, message });
    });

    this.lobby.onLeave((code) => {
      console.log(`🔌 Disconnected from lobby (code: ${code})`);
      this.lobby = null;
    });
  }

  // Room management
  async createRoom(gameId, options = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const gameInfo = await this.getGameInfo(gameId);
      if (!gameInfo) {
        throw new Error('Invalid game ID');
      }

      const roomOptions = {
        gameId,
        isPrivate: options.isPrivate || false,
        minPlayers: options.minPlayers || gameInfo.minPlayers,
        maxPlayers: options.maxPlayers || gameInfo.maxPlayers,
        settings: options.settings || {},
        ...options
      };

      this.room = await this.client.joinOrCreate(gameInfo.roomType, roomOptions);
      this.setupRoomHandlers();
      
      console.log(`🏗️ Created/joined room: ${this.room.id}`);
      return this.room.id;
      
    } catch (error) {
      console.error('Failed to create room:', error);
      this.emit('error', { message: 'Failed to create room' });
      throw error;
    }
  }

  async joinRoom(roomId, options = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      this.room = await this.client.joinById(roomId, options);
      this.setupRoomHandlers();
      
      console.log(`🚪 Joined room: ${roomId}`);
      return roomId;
      
    } catch (error) {
      console.error('Failed to join room:', error);
      this.emit('error', { message: 'Failed to join room' });
      throw error;
    }
  }

  async joinPrivateRoom(roomCode, options = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      // First join lobby to get room info
      const lobby = await this.client.joinOrCreate('lobby');
      
      return new Promise((resolve, reject) => {
        lobby.send('join_private_room', { roomCode });
        
        lobby.onMessage('join_room', async ({ roomId }) => {
          lobby.leave();
          try {
            await this.joinRoom(roomId, options);
            resolve(roomId);
          } catch (error) {
            reject(error);
          }
        });
        
        lobby.onMessage('error', ({ message }) => {
          lobby.leave();
          reject(new Error(message));
        });
        
        setTimeout(() => {
          lobby.leave();
          reject(new Error('Timeout joining private room'));
        }, 10000);
      });
      
    } catch (error) {
      console.error('Failed to join private room:', error);
      this.emit('error', { message: 'Failed to join private room' });
      throw error;
    }
  }

  async quickMatch(gameId, options = {}) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const gameInfo = await this.getGameInfo(gameId);
      if (!gameInfo) {
        throw new Error('Invalid game ID');
      }

      // Try to join existing room, create if none available
      this.room = await this.client.joinOrCreate(gameInfo.roomType, {
        gameId,
        isPrivate: false,
        minPlayers: gameInfo.minPlayers,
        maxPlayers: gameInfo.maxPlayers,
        ...options
      });
      
      this.setupRoomHandlers();
      
      console.log(`⚡ Quick match joined room: ${this.room.id}`);
      return this.room.id;
      
    } catch (error) {
      console.error('Quick match failed:', error);
      this.emit('error', { message: 'Quick match failed' });
      throw error;
    }
  }

  leaveRoom() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.playerId = null;
      this.isHost = false;
      this.gameState = null;
      this.emit('room_left');
      console.log('👋 Left room');
    }
  }

  // Game actions
  setReady(ready = true) {
    if (this.room) {
      this.room.send('ready', { ready });
    }
  }

  startGame() {
    if (this.room && this.isHost) {
      this.room.send('start_game');
    }
  }

  rematch() {
    if (this.room) {
      this.room.send('rematch');
    }
  }

  // Game-specific actions
  sendGameMessage(type, data = {}) {
    if (this.room) {
      this.room.send(type, data);
    }
  }

  // Utility methods
  async getAvailableGames() {
    try {
      const response = await fetch(`${this.serverUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/games`);
      const data = await response.json();
      return data.games;
    } catch (error) {
      console.error('Failed to get available games:', error);
      return [];
    }
  }

  async getGameInfo(gameId) {
    const games = await this.getAvailableGames();
    return games.find(game => game.id === gameId);
  }

  getPlayerCount() {
    return this.gameState ? Object.keys(this.gameState.players).length : 0;
  }

  getPlayers() {
    return this.gameState ? Object.values(this.gameState.players) : [];
  }

  getPlayer(playerId = null) {
    if (!this.gameState) return null;
    const id = playerId || this.playerId;
    return this.gameState.players[id] || null;
  }

  isGameHost() {
    return this.isHost;
  }

  getGameState() {
    return this.gameState;
  }

  getRoomCode() {
    return this.gameState ? this.gameState.roomCode : null;
  }

  // Private methods
  setupRoomHandlers() {
    if (!this.room) return;

    // Handle state changes
    this.room.onStateChange((state) => {
      this.gameState = this.serializeState(state);
      this.emit('game_update', this.gameState);
    });

    // Handle room messages
    this.room.onMessage('welcome', ({ playerId, roomCode, isHost }) => {
      this.playerId = playerId;
      this.isHost = isHost;
      this.emit('room_joined', { playerId, roomCode, isHost });
    });

    this.room.onMessage('player_joined', (data) => {
      this.emit('player_joined', data);
    });

    this.room.onMessage('player_left', (data) => {
      this.emit('player_left', data);
    });

    this.room.onMessage('player_ready', (data) => {
      this.emit('player_ready', data);
    });

    this.room.onMessage('countdown_started', (data) => {
      this.emit('countdown_started', data);
    });

    this.room.onMessage('countdown_tick', (data) => {
      this.emit('countdown_tick', data);
    });

    this.room.onMessage('game_started', (data) => {
      this.emit('game_started', data);
    });

    this.room.onMessage('game_ended', (data) => {
      this.emit('game_ended', data);
    });

    this.room.onMessage('error', (data) => {
      this.emit('error', data);
    });

    // Handle disconnection
    this.room.onLeave((code) => {
      console.log(`🔌 Disconnected from room (code: ${code})`);
      this.emit('disconnected', { code });
    });

    // Handle errors
    this.room.onError((code, message) => {
      console.error(`❌ Room error (${code}): ${message}`);
      this.emit('error', { code, message });
    });
  }

  serializeState(state) {
    // Convert Colyseus state to plain object
    const serialized = {};
    
    for (const key in state) {
      const value = state[key];
      
      if (value && typeof value.toJSON === 'function') {
        serialized[key] = value.toJSON();
      } else if (value && value.constructor && value.constructor.name === 'MapSchema') {
        serialized[key] = {};
        value.forEach((item, itemKey) => {
          serialized[key][itemKey] = item && typeof item.toJSON === 'function' ? item.toJSON() : item;
        });
      } else if (value && value.constructor && value.constructor.name === 'ArraySchema') {
        serialized[key] = value.map(item => 
          item && typeof item.toJSON === 'function' ? item.toJSON() : item
        );
      } else {
        serialized[key] = value;
      }
    }
    
    return serialized;
  }

  // Room statistics and info
  async getRoomStatistics(gameId) {
    if (!this.lobby) {
      await this.connectToLobby();
    }

    return new Promise((resolve, reject) => {
      this.lobby.send('get_room_statistics', { gameId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting room statistics'));
      }, 5000);

      const handleStatsResponse = (data) => {
        clearTimeout(timeout);
        this.lobby.off('room_statistics', handleStatsResponse);
        resolve(data);
      };

      this.lobby.onMessage('room_statistics', handleStatsResponse);
    });
  }

  async findSimilarRooms(gameId, playerCount = null) {
    const rooms = await this.getActiveRooms(gameId);
    
    return rooms.filter(room => {
      // Filter out full rooms
      if (room.playerCount >= room.maxPlayers) return false;
      
      // If playerCount specified, find rooms with similar player counts
      if (playerCount !== null) {
        const difference = Math.abs(room.playerCount - playerCount);
        return difference <= 2; // Within 2 players
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by player count (fuller rooms first, but not full)
      return b.playerCount - a.playerCount;
    });
  }

  // Enhanced room operations
  async quickMatchWithPreferences(gameId, preferences = {}) {
    try {
      // First try to find a suitable existing room
      const similarRooms = await this.findSimilarRooms(gameId, preferences.preferredPlayerCount);
      
      if (similarRooms.length > 0) {
        const bestRoom = similarRooms[0];
        await this.joinRoom(bestRoom.roomId);
        return bestRoom.roomId;
      }
      
      // If no suitable room found, create one
      return await this.createRoomWithOptions(gameId, {
        isPrivate: false,
        maxPlayers: preferences.maxPlayers || 8,
        settings: preferences.settings || {}
      });
      
    } catch (error) {
      console.error('Enhanced quick match failed:', error);
      // Fallback to regular quick match
      return await this.quickMatch(gameId, preferences);
    }
  }

  // Cleanup
  disconnect() {
    this.leaveRoom();
    this.disconnectFromLobby();
    if (this.client) {
      // Colyseus client doesn't have explicit disconnect method
      this.client = null;
    }
    this.emit('disconnected');
  }
}

// Game-specific SDK extensions
class SnakeMultiplayerSDK extends MultiplayerSDK {
  move(direction) {
    this.sendGameMessage('move', { direction });
  }

  shoot() {
    this.sendGameMessage('shoot');
  }

  activateArmor() {
    this.sendGameMessage('activate_armor');
  }
}

class BoxJumpMultiplayerSDK extends MultiplayerSDK {
  levelCompleted() {
    this.sendGameMessage('level_completed');
  }

  playerDied() {
    this.sendGameMessage('player_died');
  }

  finishTurn() {
    this.sendGameMessage('turn_finished');
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = { 
    MultiplayerSDK, 
    SnakeMultiplayerSDK, 
    BoxJumpMultiplayerSDK 
  };
} else {
  // Browser
  window.MultiplayerSDK = MultiplayerSDK;
  window.SnakeMultiplayerSDK = SnakeMultiplayerSDK;
  window.BoxJumpMultiplayerSDK = BoxJumpMultiplayerSDK;
}