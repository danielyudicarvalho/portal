const { Room } = require('colyseus');
const { Schema, type, MapSchema, ArraySchema } = require('@colyseus/schema');

class GameInfo extends Schema {
  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.roomType = '';
    this.minPlayers = 2;
    this.maxPlayers = 8;
    this.description = '';
  }
}

class ActiveRoom extends Schema {
  constructor() {
    super();
    this.roomId = '';
    this.roomCode = '';
    this.gameId = '';
    this.playerCount = 0;
    this.maxPlayers = 8;
    this.state = 'LOBBY';
    this.isPrivate = false;
    this.createdAt = Date.now();
  }
}

class LobbyState extends Schema {
  constructor() {
    super();
    this.availableGames = new MapSchema();
    this.activeRooms = new MapSchema();
    this.playerCount = 0;
  }
}

// Define schema types
type('string')(GameInfo.prototype, 'id');
type('string')(GameInfo.prototype, 'name');
type('string')(GameInfo.prototype, 'roomType');
type('number')(GameInfo.prototype, 'minPlayers');
type('number')(GameInfo.prototype, 'maxPlayers');
type('string')(GameInfo.prototype, 'description');

type('string')(ActiveRoom.prototype, 'roomId');
type('string')(ActiveRoom.prototype, 'roomCode');
type('string')(ActiveRoom.prototype, 'gameId');
type('number')(ActiveRoom.prototype, 'playerCount');
type('number')(ActiveRoom.prototype, 'maxPlayers');
type('string')(ActiveRoom.prototype, 'state');
type('boolean')(ActiveRoom.prototype, 'isPrivate');
type('number')(ActiveRoom.prototype, 'createdAt');

type({ map: GameInfo })(LobbyState.prototype, 'availableGames');
type({ map: ActiveRoom })(LobbyState.prototype, 'activeRooms');
type('number')(LobbyState.prototype, 'playerCount');

class GameLobby extends Room {
  onCreate() {
    console.log('🏛️ Creating Game Lobby');
    
    this.setState(new LobbyState());
    this.maxClients = 1000; // High limit for lobby
    
    // Initialize available games
    this.initializeGames();
    // Subscribe to cross-room notifications via presence (works with RedisPresence)
    this.subscribeToRoomEvents();
    
    // Register message handlers
    this.onMessage('create_room', (client, message) => {
      console.log('📨 Received create_room message:', message);
      this.handleCreateRoom(client, message).catch(error => {
        console.error('Error in handleCreateRoom:', error);
        client.send('error', { 
          message: 'Failed to create room',
          code: 'ROOM_CREATION_FAILED'
        });
      });
    });

    this.onMessage('join_room', (client, message) => {
      this.handleJoinRoom(client, message);
    });

    this.onMessage('join_private_room', (client, message) => {
      this.handleJoinPrivateRoom(client, message);
    });

    this.onMessage('quick_match', (client, message) => {
      this.handleQuickMatch(client, message);
    });

    this.onMessage('refresh_rooms', (client, message) => {
      this.handleRefreshRooms(client);
    });

    this.onMessage('get_room_stats', (client, message) => {
      this.handleGetRoomStats(client, message);
    });

    this.onMessage('room_disposed', (client, message) => {
      this.handleRoomDisposed(message);
    });
    
    // Set up room monitoring
    this.setupRoomMonitoring();
  }

  // Map UI/game ids to actual Colyseus room names
  getRoomNameForGameId(gameId) {
    switch (gameId) {
      case 'snake': return 'snake_game';
      case 'box_jump': return 'box_jump_game';
      case 'the-battle': return 'battle_game';
      default: return undefined;
    }
  }

  subscribeToRoomEvents() {
    try {
      if (!this.presence || typeof this.presence.subscribe !== 'function') return;
      // Single channel for room lifecycle/state events
      this.presence.subscribe('lobby:events', (raw) => {
        try {
          const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!msg || !msg.type) return;
          if (msg.type === 'room_disposed') {
            this.handleRoomDisposed(msg.data);
          } else if (msg.type === 'room_state_changed') {
            const { roomId, newState, additionalData = {} } = msg.data || {};
            if (roomId && newState) {
              this.broadcastRoomStateUpdate(roomId, newState, additionalData);
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse lobby event:', e.message);
        }
      });
    } catch (err) {
      console.warn('⚠️ Could not subscribe to lobby events:', err.message);
    }
  }

  initializeGames() {
    const games = [
      {
        id: 'snake',
        name: 'Snake Battle',
        roomType: 'snake_game',
        minPlayers: 2,
        maxPlayers: 8,
        description: 'Classic snake game with multiplayer combat and power-ups'
      },
      {
        id: 'box_jump',
        name: 'Box Jump Challenge',
        roomType: 'box_jump_game',
        minPlayers: 5,
        maxPlayers: 10,
        description: 'Turn-based platformer challenge with 20 levels'
      },
      // Add The Battle game so the lobby recognizes and can create rooms for it
      {
        id: 'the-battle',
        name: 'The Battle',
        roomType: 'battle_game',
        minPlayers: 2,
        maxPlayers: 8,
        description: 'Real-time multiplayer tank battle with rock-paper-scissors mechanics'
      }
    ];

    games.forEach(gameData => {
      const game = new GameInfo();
      Object.assign(game, gameData);
      this.state.availableGames.set(gameData.id, game);
    });

    console.log(`📋 Initialized ${games.length} available games`);
  }

  onJoin(client, options = {}) {
    console.log(`👤 Player ${client.sessionId} joined lobby`);
    this.state.playerCount++;
    
    client.send('lobby_joined', {
      availableGames: Array.from(this.state.availableGames.values()),
      activeRooms: Array.from(this.state.activeRooms.values()).filter(room => !room.isPrivate)
    });
  }

  onLeave(client) {
    console.log(`👋 Player ${client.sessionId} left lobby`);
    this.state.playerCount = Math.max(0, this.state.playerCount - 1);
  }



  async handleCreateRoom(client, { gameId, isPrivate = false, settings = {} }) {
    try {
      const gameInfo = this.state.availableGames.get(gameId);
      if (!gameInfo) {
        client.send('error', { 
          message: 'Invalid game type',
          code: 'INVALID_GAME_TYPE'
        });
        return;
      }

      // Generate unique room code (Requirement 3.2)
      const roomCode = this.generateRoomCode();

      const roomOptions = {
        gameId,
        isPrivate,
        minPlayers: gameInfo.minPlayers,
        maxPlayers: gameInfo.maxPlayers,
        settings,
        roomCode
      };

      // Create room via matchMaker - use the global matchMaker
      const { matchMaker } = require('colyseus');
      const createdRoom = await matchMaker.createRoom(gameInfo.roomType, roomOptions);
      
      // Track the room with proper room code
      this.trackRoom(createdRoom.roomId, gameId, gameInfo.maxPlayers, isPrivate, roomCode);
      
      client.send('room_created', {
        roomId: createdRoom.roomId,
        roomCode: roomCode,
        gameId: gameId,
        isPrivate: isPrivate
      });

      console.log(`🏗️ Created ${isPrivate ? 'private' : 'public'} ${gameId} room: ${createdRoom.roomId} (${roomCode})`);
      
    } catch (error) {
      console.error('Failed to create room:', error);
      client.send('error', { 
        message: 'Failed to create room',
        code: 'ROOM_CREATION_FAILED'
      });
    }
  }

  async handleJoinRoom(client, { roomId }) {
    try {
      // Check if room exists in our tracking
      const trackedRoom = this.state.activeRooms.get(roomId);
      if (!trackedRoom) {
        client.send('error', { 
          message: 'Room not found',
          code: 'ROOM_NOT_FOUND'
        });
        return;
      }

      // Enhanced capacity management (Requirement 3.5)
      if (trackedRoom.playerCount >= trackedRoom.maxPlayers) {
        console.log(`🚫 Room ${trackedRoom.roomCode} is full: ${trackedRoom.playerCount}/${trackedRoom.maxPlayers}`);
        client.send('error', { 
          message: 'Room is full',
          code: 'ROOM_FULL',
          details: {
            playerCount: trackedRoom.playerCount,
            maxPlayers: trackedRoom.maxPlayers,
            roomCode: trackedRoom.roomCode,
            gameId: trackedRoom.gameId
          }
        });
        
        // Suggest alternative rooms
        const alternativeRooms = Array.from(this.state.activeRooms.values())
          .filter(room => 
            room.gameId === trackedRoom.gameId && 
            !room.isPrivate && 
            room.state === 'LOBBY' &&
            room.playerCount < room.maxPlayers &&
            room.roomId !== roomId
          )
          .slice(0, 3); // Suggest up to 3 alternatives
        
        if (alternativeRooms.length > 0) {
          client.send('room_alternatives', {
            message: 'Room is full, but here are some alternatives',
            alternatives: alternativeRooms.map(room => ({
              roomId: room.roomId,
              roomCode: room.roomCode,
              playerCount: room.playerCount,
              maxPlayers: room.maxPlayers
            }))
          });
        }
        
        return;
      }

      // Double-check room capacity via matchMaker query (best-effort)
      try {
        const { matchMaker } = require('colyseus');
        const roomName = this.getRoomNameForGameId(trackedRoom.gameId);
        const rooms = typeof matchMaker.query === 'function'
          ? await matchMaker.query(roomName ? { name: roomName } : {})
          : [];
        const liveRoom = rooms?.find?.((r) => r.roomId === roomId);
        if (liveRoom && liveRoom.clients >= liveRoom.maxClients) {
          console.log(`🚫 Room ${trackedRoom.roomCode} is full (verified): ${liveRoom.clients}/${liveRoom.maxClients}`);
          client.send('error', { 
            message: 'Room is full (verified)',
            code: 'ROOM_FULL_VERIFIED',
            details: {
              playerCount: liveRoom.clients,
              maxPlayers: liveRoom.maxClients
            }
          });
          return;
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify room capacity:', verifyError.message);
      }

      client.send('join_room', { 
        roomId: roomId,
        roomCode: trackedRoom.roomCode,
        gameId: trackedRoom.gameId
      });
      
      console.log(`🚪 Directing player to room: ${roomId} (${trackedRoom.roomCode}) - ${trackedRoom.playerCount + 1}/${trackedRoom.maxPlayers}`);
      
    } catch (error) {
      console.error('Failed to join room:', error);
      client.send('error', { 
        message: 'Failed to join room',
        code: 'JOIN_ROOM_FAILED'
      });
    }
  }

  async handleJoinPrivateRoom(client, { roomCode }) {
    try {
      // Validate room code format (Requirement 3.4)
      if (!roomCode || typeof roomCode !== 'string' || roomCode.length !== 6) {
        client.send('error', { 
          message: 'Invalid room code format. Room codes must be 6 characters.',
          code: 'INVALID_ROOM_CODE_FORMAT'
        });
        return;
      }

      const normalizedCode = roomCode.toUpperCase();

      // Find room by code in our tracked rooms
      const trackedRoom = Array.from(this.state.activeRooms.values())
        .find(room => room.roomCode === normalizedCode);

      if (!trackedRoom) {
        client.send('error', { 
          message: 'Room not found. Please check the room code.',
          code: 'ROOM_NOT_FOUND'
        });
        return;
      }

      // Enhanced capacity management for private rooms (Requirement 3.5)
      if (trackedRoom.playerCount >= trackedRoom.maxPlayers) {
        console.log(`🚫 Private room ${trackedRoom.roomCode} is full: ${trackedRoom.playerCount}/${trackedRoom.maxPlayers}`);
        client.send('error', { 
          message: 'Private room is full',
          code: 'ROOM_FULL',
          details: {
            playerCount: trackedRoom.playerCount,
            maxPlayers: trackedRoom.maxPlayers,
            roomCode: trackedRoom.roomCode,
            gameId: trackedRoom.gameId,
            isPrivate: true
          }
        });
        return;
      }

      client.send('join_room', { 
        roomId: trackedRoom.roomId,
        roomCode: trackedRoom.roomCode,
        gameId: trackedRoom.gameId
      });
      
      console.log(`🔑 Directing player to private room: ${normalizedCode} (${trackedRoom.roomId})`);
      
    } catch (error) {
      console.error('Failed to join private room:', error);
      client.send('error', { 
        message: 'Failed to join private room',
        code: 'JOIN_PRIVATE_ROOM_FAILED'
      });
    }
  }

  async handleQuickMatch(client, { gameId }) {
    try {
      const gameInfo = this.state.availableGames.get(gameId);
      if (!gameInfo) {
        client.send('error', { 
          message: 'Invalid game type',
          code: 'INVALID_GAME_TYPE'
        });
        return;
      }

      // Find available public rooms for this game (Requirement 3.1)
      const availableRooms = Array.from(this.state.activeRooms.values())
        .filter(room => 
          room.gameId === gameId && 
          !room.isPrivate && 
          room.state === 'LOBBY' &&
          room.playerCount < room.maxPlayers
        )
        .sort((a, b) => b.playerCount - a.playerCount); // Prefer fuller rooms

      if (availableRooms.length > 0) {
        // Join existing room
        const room = availableRooms[0];
        client.send('join_room', { 
          roomId: room.roomId,
          roomCode: room.roomCode,
          gameId: room.gameId,
          isQuickMatch: true
        });
        console.log(`⚡ Quick match: joining existing room ${room.roomId} (${room.roomCode})`);
      } else {
        // Create new room (Requirement 3.1)
        const roomCode = this.generateRoomCode();
        const roomOptions = {
          gameId,
          isPrivate: false,
          minPlayers: gameInfo.minPlayers,
          maxPlayers: gameInfo.maxPlayers,
          roomCode
        };

        const { matchMaker } = require('colyseus');
        const createdRoom = await matchMaker.createRoom(gameInfo.roomType, roomOptions);
        this.trackRoom(createdRoom.roomId, gameId, gameInfo.maxPlayers, false, roomCode);
        
        client.send('join_room', { 
          roomId: createdRoom.roomId,
          roomCode: roomCode,
          gameId: gameId,
          isQuickMatch: true
        });
        console.log(`⚡ Quick match: created new room ${createdRoom.roomId} (${roomCode})`);
      }
      
    } catch (error) {
      console.error('Quick match failed:', error);
      client.send('error', { 
        message: 'Quick match failed',
        code: 'QUICK_MATCH_FAILED'
      });
    }
  }

  handleRefreshRooms(client) {
    const publicRooms = Array.from(this.state.activeRooms.values())
      .filter(room => !room.isPrivate);
    
    client.send('rooms_updated', {
      activeRooms: publicRooms,
      totalRooms: this.state.activeRooms.size,
      publicRooms: publicRooms.length,
      privateRooms: this.state.activeRooms.size - publicRooms.length,
      totalPlayers: publicRooms.reduce((sum, room) => sum + room.playerCount, 0)
    });
  }

  trackRoom(roomId, gameId, maxPlayers, isPrivate, roomCode) {
    const activeRoom = new ActiveRoom();
    activeRoom.roomId = roomId;
    activeRoom.roomCode = roomCode || this.generateRoomCode();
    activeRoom.gameId = gameId;
    activeRoom.maxPlayers = maxPlayers;
    activeRoom.isPrivate = isPrivate;
    activeRoom.playerCount = 0;
    activeRoom.state = 'LOBBY';
    activeRoom.createdAt = Date.now();
    
    this.state.activeRooms.set(roomId, activeRoom);
    
    console.log(`📊 Tracking room: ${roomId} (${activeRoom.roomCode}) - ${gameId} ${isPrivate ? 'private' : 'public'}`);
  }

  setupRoomMonitoring() {
    // Monitor room changes every 3 seconds for better responsiveness (Requirement 12.1)
    this.roomMonitorInterval = setInterval(async () => {
      try {
        const { matchMaker } = require('colyseus');
        const currentRooms = typeof matchMaker.query === 'function' ? await matchMaker.query({}) : [];
        const currentRoomIds = new Set(currentRooms.map(r => r.roomId));
        
        // Remove rooms that no longer exist (Requirement 3.6)
        const trackedRoomIds = Array.from(this.state.activeRooms.keys());
        let removedCount = 0;
        let emptyRoomsDisposed = 0;
        
        trackedRoomIds.forEach(roomId => {
          if (!currentRoomIds.has(roomId)) {
            const removedRoom = this.state.activeRooms.get(roomId);
            this.state.activeRooms.delete(roomId);
            removedCount++;
            console.log(`🗑️ Removed inactive room: ${roomId} (${removedRoom?.roomCode || 'unknown'})`);
          }
        });

        // Update room info and handle capacity management (Requirement 3.5)
        let updatedCount = 0;
        let capacityWarnings = 0;
        
        currentRooms.forEach(room => {
          const trackedRoom = this.state.activeRooms.get(room.roomId);
          if (trackedRoom) {
            const oldPlayerCount = trackedRoom.playerCount;
            const oldState = trackedRoom.state;
            
            // Update room information
            trackedRoom.playerCount = room.clients;
            
            if (room.metadata) {
              trackedRoom.roomCode = room.metadata.roomCode || trackedRoom.roomCode;
              trackedRoom.state = room.metadata.state || 'LOBBY';
              trackedRoom.gameId = room.metadata.gameId || trackedRoom.gameId;
            }
            
            // Check for capacity issues (Requirement 3.5)
            if (trackedRoom.playerCount >= trackedRoom.maxPlayers) {
              capacityWarnings++;
              if (oldPlayerCount < trackedRoom.maxPlayers) {
                console.log(`⚠️ Room ${trackedRoom.roomCode} is now full (${trackedRoom.playerCount}/${trackedRoom.maxPlayers})`);
              }
            }
            
            // Check for empty rooms that should be disposed (Requirement 3.6)
            if (trackedRoom.playerCount === 0 && oldPlayerCount > 0) {
              console.log(`📊 Room ${trackedRoom.roomCode} is now empty, will be disposed automatically`);
              emptyRoomsDisposed++;
            }
            
            // Track changes for broadcasting
            if (oldPlayerCount !== room.clients || oldState !== trackedRoom.state) {
              updatedCount++;
            }
          } else {
            // Room exists but not tracked - add it to tracking
            console.log(`⚠️ Found untracked room: ${room.roomId}, adding to tracking`);
            this.trackRoom(
              room.roomId, 
              room.metadata?.gameId || 'unknown',
              room.maxClients || 8,
              room.metadata?.isPrivate || false,
              room.metadata?.roomCode
            );
            updatedCount++;
          }
        });

        // Broadcast room updates to all lobby clients if there were changes (Requirement 12.1)
        if (removedCount > 0 || updatedCount > 0) {
          const publicRooms = Array.from(this.state.activeRooms.values())
            .filter(room => !room.isPrivate);
          
          this.broadcast('rooms_updated', {
            activeRooms: publicRooms,
            totalRooms: this.state.activeRooms.size,
            publicRooms: publicRooms.length,
            privateRooms: this.state.activeRooms.size - publicRooms.length,
            totalPlayers: Array.from(this.state.activeRooms.values())
              .reduce((sum, room) => sum + room.playerCount, 0),
            stats: {
              removedRooms: removedCount,
              updatedRooms: updatedCount,
              fullRooms: capacityWarnings,
              emptyRoomsDisposed: emptyRoomsDisposed
            }
          });
        }

        // Log monitoring summary for debugging (Requirement 12.1)
        if (removedCount > 0 || updatedCount > 0 || capacityWarnings > 0 || emptyRoomsDisposed > 0) {
          console.log(`📊 Room monitoring update: ${removedCount} removed, ${updatedCount} updated, ${capacityWarnings} full, ${emptyRoomsDisposed} empty`);
        }
        
      } catch (error) {
        console.error('❌ Room monitoring error:', error);
        // Broadcast error to monitoring systems
        this.broadcast('monitoring_error', {
          error: error.message,
          timestamp: Date.now()
        });
      }
    }, 3000); // Reduced interval for better real-time monitoring
  }

  generateRoomCode() {
    // Generate 6-character room code (Requirement 3.2)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness by checking existing room codes (only if state is initialized)
    if (this.state && this.state.activeRooms) {
      const existingCodes = Array.from(this.state.activeRooms.values())
        .map(room => room.roomCode);
      
      if (existingCodes.includes(result)) {
        // Recursively generate until unique (very unlikely to need this)
        return this.generateRoomCode();
      }
    }
    
    return result;
  }

  // Method to remove a room from tracking (called by game rooms when they dispose)
  removeRoom(roomId) {
    const room = this.state.activeRooms.get(roomId);
    if (room) {
      this.state.activeRooms.delete(roomId);
      console.log(`🗑️ Manually removed room: ${roomId} (${room.roomCode})`);
      
      // Broadcast update
      this.broadcast('rooms_updated', {
        activeRooms: Array.from(this.state.activeRooms.values())
          .filter(room => !room.isPrivate),
        totalRooms: this.state.activeRooms.size,
        publicRooms: Array.from(this.state.activeRooms.values())
          .filter(room => !room.isPrivate).length
      });
    }
  }

  // Get active rooms for a specific game
  getActiveRooms(gameId = null) {
    const rooms = Array.from(this.state.activeRooms.values());
    if (gameId) {
      return rooms.filter(room => room.gameId === gameId);
    }
    return rooms;
  }

  handleGetRoomStats(client, { gameId } = {}) {
    const allRooms = Array.from(this.state.activeRooms.values());
    const filteredRooms = gameId ? allRooms.filter(room => room.gameId === gameId) : allRooms;
    
    // Enhanced room statistics (Requirement 12.1)
    const stats = {
      timestamp: Date.now(),
      totalRooms: filteredRooms.length,
      publicRooms: filteredRooms.filter(room => !room.isPrivate).length,
      privateRooms: filteredRooms.filter(room => room.isPrivate).length,
      totalPlayers: filteredRooms.reduce((sum, room) => sum + room.playerCount, 0),
      roomsByState: {
        LOBBY: filteredRooms.filter(room => room.state === 'LOBBY').length,
        COUNTDOWN: filteredRooms.filter(room => room.state === 'COUNTDOWN').length,
        PLAYING: filteredRooms.filter(room => room.state === 'PLAYING').length,
        RESULTS: filteredRooms.filter(room => room.state === 'RESULTS').length
      },
      capacityStats: {
        fullRooms: filteredRooms.filter(room => room.playerCount >= room.maxPlayers).length,
        emptyRooms: filteredRooms.filter(room => room.playerCount === 0).length,
        nearFullRooms: filteredRooms.filter(room => 
          room.playerCount >= room.maxPlayers * 0.8 && room.playerCount < room.maxPlayers
        ).length,
        averageCapacity: filteredRooms.length > 0 ? 
          Math.round((filteredRooms.reduce((sum, room) => sum + (room.playerCount / room.maxPlayers), 0) / filteredRooms.length) * 100) : 0
      },
      roomsByGame: {}
    };

    // Calculate detailed stats by game type
    this.state.availableGames.forEach((game, gameId) => {
      const gameRooms = filteredRooms.filter(room => room.gameId === gameId);
      stats.roomsByGame[gameId] = {
        totalRooms: gameRooms.length,
        totalPlayers: gameRooms.reduce((sum, room) => sum + room.playerCount, 0),
        averagePlayersPerRoom: gameRooms.length > 0 ? 
          Math.round((gameRooms.reduce((sum, room) => sum + room.playerCount, 0) / gameRooms.length) * 10) / 10 : 0,
        fullRooms: gameRooms.filter(room => room.playerCount >= room.maxPlayers).length,
        emptyRooms: gameRooms.filter(room => room.playerCount === 0).length,
        roomsByState: {
          LOBBY: gameRooms.filter(room => room.state === 'LOBBY').length,
          COUNTDOWN: gameRooms.filter(room => room.state === 'COUNTDOWN').length,
          PLAYING: gameRooms.filter(room => room.state === 'PLAYING').length,
          RESULTS: gameRooms.filter(room => room.state === 'RESULTS').length
        }
      };
    });

    client.send('room_stats', stats);
    console.log(`📊 Room stats requested for ${gameId || 'all games'}: ${stats.totalRooms} rooms, ${stats.totalPlayers} players`);
  }

  // Enhanced room state broadcasting (Requirement 12.1)
  broadcastRoomStateUpdate(roomId, newState, additionalData = {}) {
    const trackedRoom = this.state.activeRooms.get(roomId);
    if (trackedRoom) {
      const oldState = trackedRoom.state;
      trackedRoom.state = newState;
      
      // Broadcast state change to all lobby clients
      this.broadcast('room_state_changed', {
        roomId,
        roomCode: trackedRoom.roomCode,
        gameId: trackedRoom.gameId,
        oldState,
        newState,
        playerCount: trackedRoom.playerCount,
        maxPlayers: trackedRoom.maxPlayers,
        timestamp: Date.now(),
        ...additionalData
      });
      
      console.log(`📡 Broadcasting room state change: ${trackedRoom.roomCode} ${oldState} → ${newState}`);
    }
  }

  // Method for game rooms to update their status in the lobby
  updateRoomStatus(roomId, updates) {
    const trackedRoom = this.state.activeRooms.get(roomId);
    if (trackedRoom) {
      const oldData = { ...trackedRoom };
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        if (trackedRoom.hasOwnProperty(key)) {
          trackedRoom[key] = updates[key];
        }
      });
      
      // Broadcast update if there were significant changes
      const significantChanges = ['state', 'playerCount'].some(key => 
        updates.hasOwnProperty(key) && oldData[key] !== updates[key]
      );
      
      if (significantChanges) {
        this.broadcast('room_updated', {
          roomId,
          roomCode: trackedRoom.roomCode,
          gameId: trackedRoom.gameId,
          updates,
          timestamp: Date.now()
        });
      }
    }
  }

  // Get comprehensive monitoring data (Requirement 12.1)
  getMonitoringData() {
    const allRooms = Array.from(this.state.activeRooms.values());
    
    return {
      timestamp: Date.now(),
      lobby: {
        connectedClients: this.clients.length,
        maxClients: this.maxClients,
        playerCount: this.state.playerCount
      },
      rooms: {
        total: allRooms.length,
        public: allRooms.filter(room => !room.isPrivate).length,
        private: allRooms.filter(room => room.isPrivate).length,
        byState: {
          LOBBY: allRooms.filter(room => room.state === 'LOBBY').length,
          COUNTDOWN: allRooms.filter(room => room.state === 'COUNTDOWN').length,
          PLAYING: allRooms.filter(room => room.state === 'PLAYING').length,
          RESULTS: allRooms.filter(room => room.state === 'RESULTS').length
        },
        capacity: {
          full: allRooms.filter(room => room.playerCount >= room.maxPlayers).length,
          empty: allRooms.filter(room => room.playerCount === 0).length,
          total_players: allRooms.reduce((sum, room) => sum + room.playerCount, 0),
          total_capacity: allRooms.reduce((sum, room) => sum + room.maxPlayers, 0)
        }
      },
      games: Object.fromEntries(
        Array.from(this.state.availableGames.entries()).map(([gameId, game]) => {
          const gameRooms = allRooms.filter(room => room.gameId === gameId);
          return [gameId, {
            rooms: gameRooms.length,
            players: gameRooms.reduce((sum, room) => sum + room.playerCount, 0),
            capacity: gameRooms.reduce((sum, room) => sum + room.maxPlayers, 0)
          }];
        })
      )
    };
  }

  // Handle room disposal notifications (Requirement 3.6)

  handleRoomDisposed({ roomId, roomCode, gameId, reason, timestamp }) {
    const removedRoom = this.state.activeRooms.get(roomId);
    if (removedRoom) {
      this.state.activeRooms.delete(roomId);
      
      console.log(`🗑️ Room disposed notification: ${roomCode} (${gameId}) - Reason: ${reason}`);
      
      // Broadcast room disposal to all lobby clients
      this.broadcast('room_disposed', {
        roomId,
        roomCode,
        gameId,
        reason,
        timestamp
      });
    }
  }

  onDispose() {
    console.log('🗑️ Disposing Game Lobby');
    
    // Clear monitoring interval
    if (this.roomMonitorInterval) {
      clearInterval(this.roomMonitorInterval);
      this.roomMonitorInterval = null;
    }
  }
}

module.exports = { GameLobby };
