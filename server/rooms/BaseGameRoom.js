const { Room } = require('colyseus');
const { BaseGameState, Player, GameResult } = require('../schemas/BaseGameState');

const GAME_STATES = Object.freeze({
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  RESULTS: 'RESULTS',
  RESET: 'RESET',
});

const VALID_TRANSITIONS = {
  [GAME_STATES.LOBBY]: [GAME_STATES.COUNTDOWN],
  [GAME_STATES.COUNTDOWN]: [GAME_STATES.PLAYING, GAME_STATES.LOBBY],
  [GAME_STATES.PLAYING]: [GAME_STATES.RESULTS],
  [GAME_STATES.RESULTS]: [GAME_STATES.RESET, GAME_STATES.LOBBY],
  [GAME_STATES.RESET]: [GAME_STATES.LOBBY],
};

class BaseGameRoom extends Room {
  constructor() {
    super();
    this.maxClients = 8;
    this.autoDispose = true;
    this.afkCheckInterval = null;
    this.countdownInterval = null;
    this.gameLoopInterval = null;
    this.autoResetTimeout = null;
    this.reconnectTimeouts = new Map();
    this.lifecycleTimings = {
      countdown: 5000,
      results: 30000,
      reset: 2000,
    };
    this.resetPhaseTimeout = null;
  }

  onCreate(options = {}) {
    console.log(`🎮 Creating ${this.constructor.name} with options:`, options);

    this.setState(new BaseGameState());

    // Set room configuration
    this.state.gameId = options.gameId || 'unknown';
    this.state.roomCode = options.roomCode || this.generateRoomCode();
    this.state.isPrivate = options.isPrivate || false;
    this.state.minPlayers = options.minPlayers || 2;
    this.state.maxPlayers = options.maxPlayers || 8;
    this.state.state = GAME_STATES.LOBBY;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = 0;
    this.state.createdAt = Date.now();
    this.state.lastUpdate = Date.now();
    this.maxClients = this.state.maxPlayers;

    // Apply game-specific settings
    if (options.settings) {
      this.state.settings = JSON.stringify({ ...JSON.parse(this.state.settings), ...options.settings });
    }

    // Set up periodic AFK checking
    this.setupAFKCheck();

    this.updateRoomMetadata();

    console.log(`✅ Room created: ${this.state.roomCode} (${this.state.gameId})`);
  }

  onJoin(client, options = {}) {
    console.log(`👤 Player ${client.sessionId} joining room ${this.state.roomCode}`);
    
    // Check if player is reconnecting
    const existingPlayer = this.getPlayer(client.sessionId);
    if (existingPlayer) {
      return this.handleReconnect(client, existingPlayer);
    }

    const player = this.addPlayer(client, options);

    // Send welcome message
    client.send('welcome', {
      playerId: client.sessionId,
      roomCode: this.state.roomCode,
      isHost: player.isHost
    });

    this.broadcast('player_joined', {
      player: {
        id: player.id,
        name: player.name,
        isHost: player.isHost
      }
    }, { except: client });

    console.log(`✅ Player ${player.name} joined as ${player.isHost ? 'HOST' : 'PLAYER'}`);
  }

  onLeave(client, consented = false) {
    console.log(`👋 Player ${client.sessionId} leaving room ${this.state.roomCode}`);
    
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (consented || this.state.state === GAME_STATES.LOBBY) {
      // Immediate removal in lobby or if consented
      this.removePlayer(client.sessionId);
    } else {
      // Allow reconnection during active game
      this.handleDisconnect(client.sessionId);
    }
  }

  onMessage(client, type, message = {}) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isConnected) return;

    // Update player activity
    player.lastActivity = Date.now();

    switch (type) {
      case 'ready':
        this.handlePlayerReady(client.sessionId, message.ready);
        break;
      case 'start_game':
        this.handleStartGame(client.sessionId);
        break;
      case 'rematch':
        this.handleRematch(client.sessionId);
        break;
      default:
        // Let subclasses handle game-specific messages
        this.onGameMessage(client, type, message);
    }
  }

  // Override in subclasses for game-specific messages
  onGameMessage(client, type, message) {
    console.log(`🎮 Unhandled game message: ${type}`, message);
  }

  addPlayer(client, options = {}) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.isHost = this.state.players.size === 0;
    player.lastActivity = Date.now();
    player.isConnected = true;
    player.isReady = false;

    this.state.players.set(client.sessionId, player);
    this.touchState();
    this.updateRoomMetadata();

    return player;
  }

  getPlayer(playerId) {
    return this.state.players.get(playerId);
  }

  setPlayerReady(playerId, ready) {
    const player = this.getPlayer(playerId);
    if (!player || !player.isConnected) {
      return { updated: false, player: null, previousReady: false };
    }

    if (this.state.state !== GAME_STATES.LOBBY) {
      return { updated: false, player, previousReady: player.isReady };
    }

    const previousReady = player.isReady;
    if (previousReady === ready) {
      return { updated: false, player, previousReady };
    }

    player.isReady = ready;
    player.lastActivity = Date.now();
    this.touchState();
    this.updateRoomMetadata();

    return { updated: true, player, previousReady };
  }

  handlePlayerReady(playerId, ready) {
    const { player, updated, previousReady } = this.setPlayerReady(playerId, ready);
    if (!player || !player.isConnected) {
      console.log(`⚠️ Cannot set ready status for invalid/disconnected player: ${playerId}`);
      return;
    }

    // Only allow ready status changes in LOBBY state
    if (this.state.state !== GAME_STATES.LOBBY) {
      console.log(`⚠️ Cannot change ready status in ${this.state.state} state`);
      return;
    }

    const wasReady = previousReady;

    if (!updated && previousReady === ready) {
      return;
    }

    const canStart = this.state.canStart();
    const connectedPlayers = this.state.getConnectedPlayers();
    const readyPlayers = this.state.getReadyPlayers();

    this.broadcast('player_ready', {
      playerId,
      playerName: player.name,
      ready,
      canStart,
      readyCount: readyPlayers.length,
      totalCount: connectedPlayers.length,
      minPlayers: this.state.minPlayers
    });

    console.log(`🎯 Player ${player.name} is ${ready ? 'ready' : 'not ready'} (${readyPlayers.length}/${connectedPlayers.length} ready, min: ${this.state.minPlayers})`);

    // Auto-start if all players are ready and we have enough players
    if (ready && canStart && !wasReady) {
      console.log(`✨ All players ready! Game can start.`);
    }
  }

  handleStartGame(playerId) {
    const player = this.state.players.get(playerId);
    
    // Validate player and permissions
    if (!player || !player.isConnected) {
      console.log(`⚠️ Invalid player trying to start game: ${playerId}`);
      return;
    }
    
    if (!player.isHost) {
      this.clients.getById(playerId)?.send('error', { 
        message: 'Only the host can start the game',
        code: 'NOT_HOST'
      });
      console.log(`⚠️ Non-host player ${player.name} tried to start game`);
      return;
    }
    
    if (this.state.state !== 'LOBBY') {
      this.clients.getById(playerId)?.send('error', { 
        message: `Cannot start game in ${this.state.state} state`,
        code: 'INVALID_STATE'
      });
      console.log(`⚠️ Cannot start game in ${this.state.state} state`);
      return;
    }

    if (!this.state.canStart()) {
      const connectedPlayers = this.state.getConnectedPlayers();
      const readyPlayers = this.state.getReadyPlayers();
      
      this.clients.getById(playerId)?.send('error', { 
        message: `Need ${this.state.minPlayers} ready players to start (${readyPlayers.length}/${connectedPlayers.length} ready)`,
        code: 'NOT_ENOUGH_PLAYERS',
        details: {
          readyCount: readyPlayers.length,
          totalCount: connectedPlayers.length,
          minPlayers: this.state.minPlayers
        }
      });
      console.log(`⚠️ Cannot start: ${readyPlayers.length}/${connectedPlayers.length} ready, need ${this.state.minPlayers}`);
      return;
    }

    console.log(`🚀 Host ${player.name} starting game with ${this.state.getConnectedPlayers().length} players`);
    this.startCountdown();
  }

  handleRematch(playerId) {
    const player = this.state.players.get(playerId);
    
    // Validate player and state
    if (!player || !player.isConnected) {
      console.log(`⚠️ Invalid player trying to vote for rematch: ${playerId}`);
      return;
    }
    
    if (this.state.state !== GAME_STATES.RESULTS) {
      console.log(`⚠️ Cannot vote for rematch in ${this.state.state} state`);
      return;
    }

    // Toggle player's rematch vote (using isReady as rematch vote)
    const wasReady = player.isReady;
    player.isReady = !wasReady;
    this.touchState();
    this.updateRoomMetadata();

    const connectedPlayers = this.state.getConnectedPlayers();
    const readyForRematch = connectedPlayers.filter(p => p.isReady).length;
    
    this.broadcast('rematch_vote', {
      playerId,
      playerName: player.name,
      voted: player.isReady,
      readyCount: readyForRematch,
      totalCount: connectedPlayers.length,
      needsCount: connectedPlayers.length
    });

    console.log(`🔄 ${player.name} ${player.isReady ? 'voted for' : 'cancelled vote for'} rematch (${readyForRematch}/${connectedPlayers.length})`);
    
    // Check if all connected players want rematch (Requirement 1.5)
    if (readyForRematch === connectedPlayers.length && connectedPlayers.length > 0) {
      console.log(`✨ All players voted for rematch! Resetting game...`);
      
      // Clear the auto-reset timeout since we're doing a manual reset
      if (this.autoResetTimeout) {
        clearTimeout(this.autoResetTimeout);
        this.autoResetTimeout = null;
      }
      
      this.resetGame('REMATCH');
    }
  }

  startCountdown() {
    // Validate state transition
    if (this.state.state !== GAME_STATES.LOBBY) {
      console.log(`⚠️ Cannot start countdown from ${this.state.state} state`);
      return;
    }

    // Double-check we still have enough ready players
    if (!this.state.canStart()) {
      console.log(`⚠️ Cannot start countdown: not enough ready players`);
      return;
    }

    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    // Initialize countdown state
    const countdownSeconds = Math.max(1, Math.round(this.lifecycleTimings.countdown / 1000));
    this.state.countdown = countdownSeconds;
    this.transitionToState(GAME_STATES.COUNTDOWN, { countdown: countdownSeconds }, this.lifecycleTimings.countdown);

    const connectedPlayers = this.state.getConnectedPlayers();
    this.broadcast('countdown_started', {
      countdown: this.state.countdown,
      playerCount: connectedPlayers.length
    });

    this.countdownInterval = setInterval(() => {
      this.state.countdown--;
      
      if (this.state.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.startGame();
      } else {
        this.touchState();
        this.updateRoomMetadata();
        this.broadcast('countdown_tick', { countdown: this.state.countdown });
        console.log(`⏰ Countdown: ${this.state.countdown}`);
      }
    }, 1000);

    console.log(`⏰ Countdown started for room ${this.state.roomCode} with ${connectedPlayers.length} players`);
  }

  cancelCountdown(reason = 'CANCELLED') {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.state.state !== GAME_STATES.COUNTDOWN) {
      return;
    }

    this.state.countdown = 0;
    this.transitionToState(GAME_STATES.LOBBY, { reason, cancelled: true });
    this.broadcast('countdown_cancelled', { reason });

    console.log(`⏹️ Countdown cancelled for room ${this.state.roomCode} (${reason})`);
  }

  startGame() {
    // Validate state transition
    if (this.state.state !== GAME_STATES.COUNTDOWN) {
      console.log(`⚠️ Cannot start game from ${this.state.state} state`);
      return;
    }

    // Final validation that we still have enough players
    const connectedPlayers = this.state.getConnectedPlayers();
    if (connectedPlayers.length < this.state.minPlayers) {
      console.log(`⚠️ Cannot start game: not enough players (${connectedPlayers.length}/${this.state.minPlayers})`);
      this.cancelCountdown('NOT_ENOUGH_PLAYERS');
      return;
    }

    // Transition to PLAYING state
    this.state.gameStartTime = Date.now();
    this.state.countdown = 0;
    this.transitionToState(GAME_STATES.PLAYING, { gameStartTime: this.state.gameStartTime });

    // Reset all connected players for game start
    this.state.players.forEach(player => {
      if (player.isConnected) {
        player.isAlive = true;
        player.score = 0;
        // Keep isReady as true during game for potential reconnections
      }
    });

    this.broadcast('game_started', {
      gameStartTime: this.state.gameStartTime,
      playerCount: connectedPlayers.length,
      players: connectedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost
      }))
    });
    
    // Start game-specific logic
    try {
      this.onGameStart();
    } catch (error) {
      console.error(`❌ Error starting game-specific logic:`, error);
      // Don't fail the entire game start, just log the error
    }
    
    console.log(`🚀 Game started in room ${this.state.roomCode} with ${connectedPlayers.length} players`);
  }

  endGame(results = []) {
    // Validate state transition
    if (this.state.state !== GAME_STATES.PLAYING) {
      console.log(`⚠️ Cannot end game from ${this.state.state} state`);
      return;
    }

    // Transition to RESULTS state
    this.state.gameEndTime = Date.now();
    this.transitionToState(GAME_STATES.RESULTS, {
      gameEndTime: this.state.gameEndTime,
      winner: results.length > 0 ? results[0].playerId : null
    }, this.lifecycleTimings.results);

    // Convert results to GameResult schema objects
    this.state.results.clear();
    results.forEach((result, index) => {
      const gameResult = new GameResult();
      gameResult.playerId = result.playerId;
      gameResult.playerName = result.playerName || this.state.players.get(result.playerId)?.name || 'Unknown';
      gameResult.score = result.score || 0;
      gameResult.rank = index + 1;
      this.state.results.push(gameResult);
    });

    // Determine winner
    if (results.length > 0) {
      this.state.winner = results[0].playerId;
      const winnerPlayer = this.state.players.get(this.state.winner);
      console.log(`🏆 Winner: ${winnerPlayer?.name || 'Unknown'} (${results[0].score} points)`);
    }

    const gameDuration = this.state.gameEndTime - this.state.gameStartTime;

    this.broadcast('game_ended', {
      results: Array.from(this.state.results),
      winner: this.state.winner,
      winnerName: this.state.players.get(this.state.winner)?.name || 'Unknown',
      duration: gameDuration,
      formattedDuration: this.formatDuration(gameDuration)
    });

    // Stop game loop if running
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    // Reset all players' ready status for potential rematch
    this.state.players.forEach(player => {
      player.isReady = false;
    });

    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    // Auto-reset after configured results window if no rematch
    this.autoResetTimeout = setTimeout(() => {
      if (this.state.state === GAME_STATES.RESULTS) {
        console.log(`⏰ Auto-resetting room ${this.state.roomCode} after results window`);
        this.resetGame('AUTO');
      }
    }, this.lifecycleTimings.results);

    console.log(`🏁 Game ended in room ${this.state.roomCode} after ${this.formatDuration(gameDuration)}`);
  }

  resetGame(reason = 'MANUAL') {
    // Clear any pending timeouts
    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.resetPhaseTimeout) {
      clearTimeout(this.resetPhaseTimeout);
      this.resetPhaseTimeout = null;
    }

    const previousState = this.state.state;

    if (previousState === GAME_STATES.COUNTDOWN || previousState === GAME_STATES.LOBBY) {
      this.transitionToState(GAME_STATES.LOBBY, { previousState, reason });
      this.state.countdown = 0;
      this.touchState();
      this.updateRoomMetadata();
      return;
    }

    this.transitionToState(GAME_STATES.RESET, { previousState, reason }, this.lifecycleTimings.reset);

    const finalizeReset = () => {
      this.state.countdown = 0;
      this.state.gameStartTime = 0;
      this.state.gameEndTime = 0;
      this.state.winner = '';
      this.state.results.clear();

      // Reset all connected players
      this.state.players.forEach(player => {
        if (player.isConnected) {
          player.isReady = false;
          player.score = 0;
          player.isAlive = true;
        }
      });

      const connectedPlayers = this.state.getConnectedPlayers();

      try {
        this.onGameReset();
      } catch (error) {
        console.error(`❌ Error in game-specific reset:`, error);
      }

      this.transitionToState(GAME_STATES.LOBBY, { previousState: GAME_STATES.RESET, reason });

      this.broadcast('game_reset', {
        previousState,
        playerCount: connectedPlayers.length,
        minPlayers: this.state.minPlayers,
        reason
      });

      console.log(`🔄 Game reset in room ${this.state.roomCode} from ${previousState} to LOBBY with ${connectedPlayers.length} players`);
    };

    if (this.lifecycleTimings.reset > 0) {
      this.resetPhaseTimeout = setTimeout(() => {
        this.resetPhaseTimeout = null;
        finalizeReset();
      }, this.lifecycleTimings.reset);
    } else {
      finalizeReset();
    }
  }

  handleDisconnect(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    player.isConnected = false;
    player.isReady = false;
    this.touchState();

    // Set reconnection timeout
    const timeout = setTimeout(() => {
      this.removePlayer(playerId);
    }, this.state.reconnectTimeout);

    this.reconnectTimeouts.set(playerId, timeout);

    this.broadcast('player_disconnected', { playerId });

    if (this.state.state === GAME_STATES.COUNTDOWN && !this.state.canStart()) {
      this.cancelCountdown('PLAYER_DISCONNECTED');
    }

    // Reassign host if needed
    if (player.isHost) {
      const newHost = this.state.assignNewHost();
      if (newHost) {
        this.broadcast('new_host', { playerId: newHost.id });
      }
    }

    this.updateRoomMetadata();

    console.log(`⚠️ Player ${player.name} disconnected, ${this.state.reconnectTimeout/1000}s to reconnect`);
  }

  handleReconnect(client, player) {
    // Clear reconnection timeout
    const timeout = this.reconnectTimeouts.get(client.sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(client.sessionId);
    }

    player.isConnected = true;
    player.lastActivity = Date.now();
    this.touchState();

    client.send('reconnected', {
      gameState: this.state.state,
      isHost: player.isHost
    });

    this.broadcast('player_reconnected', { playerId: client.sessionId }, { except: client });

    this.updateRoomMetadata();

    console.log(`🔄 Player ${player.name} reconnected`);
  }

  removePlayer(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const playerName = player.name;
    const wasHost = player.isHost;

    // Clear any timeouts
    const timeout = this.reconnectTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(playerId);
    }

    this.state.players.delete(playerId);
    this.touchState();

    this.broadcast('player_left', {
      playerId,
      playerName
    });

    // Reassign host if needed
    if (wasHost) {
      const newHost = this.state.assignNewHost();
      if (newHost) {
        this.broadcast('new_host', {
          playerId: newHost.id,
          playerName: newHost.name
        });
        console.log(`👑 ${newHost.name} is now the host`);
      }
    }

    const remainingPlayers = this.state.getConnectedPlayers();

    // Handle state-specific logic when players leave
    if (this.state.state === GAME_STATES.COUNTDOWN) {
      // Cancel countdown if we don't have enough players
      if (remainingPlayers.length < this.state.minPlayers) {
        console.log(`⚠️ Cancelling countdown: not enough players (${remainingPlayers.length}/${this.state.minPlayers})`);
        this.cancelCountdown('PLAYER_LEFT');
      }
    } else if (this.state.state === GAME_STATES.PLAYING) {
      // Check if game should end due to insufficient players
      const alivePlayers = this.state.getAlivePlayers();
      if (alivePlayers.length < 2) {
        console.log(`⚠️ Game ending: not enough alive players (${alivePlayers.length})`);
        // Let the game-specific logic handle this in their update loop
      }
    }

    // Enhanced empty room disposal (Requirement 3.6)
    if (remainingPlayers.length === 0) {
      console.log(`🗑️ No players remaining in room ${this.state.roomCode}, disposing room automatically`);

      // Log disposal for monitoring
      const roomAge = Date.now() - (this.state.createdAt || Date.now());
      console.log(`📊 Auto-disposing empty room: ${this.state.roomCode} (${this.state.gameId}) - Age: ${this.formatDuration(roomAge)}`);

      // Graceful disposal with slight delay to allow for reconnections
      setTimeout(() => {
        if (this.state.getConnectedPlayers().length === 0) {
          this.disconnect();
        }
      }, 1000); // 1 second grace period

      if (this.state.state !== GAME_STATES.PLAYING) {
        this.resetGame('EMPTY_ROOM');
      }
    }

    this.updateRoomMetadata();

    console.log(`❌ Player ${playerName} removed from room (${remainingPlayers.length} remaining)`);
  }

  touchState() {
    this.state.lastUpdate = Date.now();
  }

  setupAFKCheck() {
    this.afkCheckInterval = setInterval(() => {
      const now = Date.now();
      const playersToRemove = [];

      this.state.players.forEach((player, playerId) => {
        if (player.isConnected && (now - player.lastActivity) > this.state.afkTimeout) {
          playersToRemove.push(playerId);
        }
      });

      playersToRemove.forEach(playerId => {
        console.log(`⏰ Removing AFK player: ${playerId}`);
        this.removePlayer(playerId);
      });
    }, 30000); // Check every 30 seconds
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  onDispose() {
    const roomCode = this.state?.roomCode || 'unknown';
    const gameId = this.state?.gameId || 'unknown';
    const playerCount = this.state?.players?.size || 0;
    
    console.log(`🗑️ Disposing room ${roomCode} (${gameId}) - had ${playerCount} players`);
    
    // Notify lobby via presence pub/sub (works across processes)
    this.publishLobbyEvent('room_disposed', {
      roomId: this.roomId,
      roomCode: roomCode,
      gameId: gameId,
      reason: playerCount === 0 ? 'empty' : 'shutdown',
      timestamp: Date.now()
    });
    
    // Log disposal reason for monitoring (Requirement 12.1)
    const disposalReason = playerCount === 0 ? 'EMPTY_ROOM' : 'SHUTDOWN';
    const uptime = this.state?.gameStartTime ? Date.now() - this.state.gameStartTime : 0;
    
    console.log(`📊 Room disposal stats: ${roomCode} - Reason: ${disposalReason}, Uptime: ${this.formatDuration(uptime)}, Max players: ${this.state?.players?.size || 0}`);
    
    // Clear all intervals
    if (this.afkCheckInterval) {
      clearInterval(this.afkCheckInterval);
      this.afkCheckInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    
    // Clear all timeouts
    if (this.autoResetTimeout) {
      clearTimeout(this.autoResetTimeout);
      this.autoResetTimeout = null;
    }

    if (this.resetPhaseTimeout) {
      clearTimeout(this.resetPhaseTimeout);
      this.resetPhaseTimeout = null;
    }

    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    
    // Final cleanup
    console.log(`✅ Room ${roomCode} disposed successfully`);
  }

  // Enhanced metadata management for monitoring (Requirement 12.1)
  updateRoomMetadata() {
    try {
      // Update room metadata for lobby tracking
      this.setMetadata({
        gameId: this.state.gameId,
        roomCode: this.state.roomCode,
        state: this.state.state,
        playerCount: this.state.getConnectedPlayers().length,
        maxPlayers: this.state.maxPlayers,
        isPrivate: this.state.isPrivate,
        createdAt: this.state.createdAt || Date.now(),
        lastUpdate: this.state.lastUpdate || Date.now(),
        phaseStartedAt: this.state.phaseStartedAt,
        phaseEndsAt: this.state.phaseEndsAt,
        countdown: this.state.countdown
      });
    } catch (error) {
      console.warn('⚠️ Could not update room metadata:', error.message);
    }
  }

  // Enhanced state transitions with lobby notifications
  transitionToState(newState, additionalData = {}, phaseDuration = 0) {
    const oldState = this.state.state;

    if (oldState === newState) {
      return;
    }

    const validTargets = VALID_TRANSITIONS[oldState] || [];
    if (oldState && validTargets.length > 0 && !validTargets.includes(newState)) {
      console.warn(`⚠️ Invalid state transition attempted: ${oldState} → ${newState}`);
      return;
    }

    this.state.state = newState;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = phaseDuration > 0 ? this.state.phaseStartedAt + phaseDuration : 0;
    this.touchState();

    // Update metadata
    this.updateRoomMetadata();

    const transitionPayload = {
      roomId: this.roomId,
      state: newState,
      previousState: oldState,
      playerCount: this.state.getConnectedPlayers().length,
      phaseStartedAt: this.state.phaseStartedAt,
      phaseEndsAt: this.state.phaseEndsAt,
      countdown: this.state.countdown,
      ...additionalData
    };

    // Notify lobby via presence pub/sub (distributed-safe)
    this.publishLobbyEvent('room_state_changed', {
      roomId: this.roomId,
      newState,
      additionalData: transitionPayload
    });

    this.broadcast('room_state_updated', transitionPayload);

    console.log(`🔄 Room ${this.state.roomCode} transitioned: ${oldState} → ${newState}`);
  }

  // Publish a lobby event through presence (no-op if presence unavailable)
  publishLobbyEvent(type, data) {
    try {
      if (!this.presence || typeof this.presence.publish !== 'function') return;
      const payload = JSON.stringify({ type, data });
      this.presence.publish('lobby:events', payload);
    } catch (e) {
      console.warn('⚠️ Failed to publish lobby event:', e.message);
    }
  }

  // Override these methods in subclasses
  onGameStart() {
    // Game-specific start logic
    this.updateRoomMetadata();
  }

  onGameReset() {
    // Game-specific reset logic
    this.updateRoomMetadata();
  }
}

module.exports = { BaseGameRoom, GAME_STATES };
