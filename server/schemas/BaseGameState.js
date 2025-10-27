const { Schema, type, MapSchema, ArraySchema } = require('@colyseus/schema');

class GameResult extends Schema {
  constructor() {
    super();
    this.playerId = '';
    this.playerName = '';
    this.score = 0;
    this.rank = 0;
  }
}

class Player extends Schema {
  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.isReady = false;
    this.isHost = false;
    this.score = 0;
    this.isAlive = true;
    this.isConnected = true;
    this.lastActivity = Date.now();
    this.gameData = '{}'; // Game-specific data as JSON string
  }
}

class BaseGameState extends Schema {
  constructor() {
    super();
    this.gameId = '';
    this.roomName = '';
    this.roomCode = '';
    this.state = 'LOBBY'; // LOBBY, COUNTDOWN, PLAYING, RESULTS, RESET
    this.players = new MapSchema();
    this.minPlayers = 2;
    this.maxPlayers = 8;
    this.countdown = 0;
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.winner = '';
    this.results = new ArraySchema();
    this.settings = '{}'; // Settings as JSON string
    this.isPrivate = false;
    this.afkTimeout = 60000; // 60 seconds
    this.reconnectTimeout = 30000; // 30 seconds
    this.phaseStartedAt = Date.now();
    this.phaseEndsAt = 0;
    this.createdAt = Date.now();
    this.lastUpdate = Date.now();
  }

  // Helper methods
  getAlivePlayers() {
    return Array.from(this.players.values()).filter(p => p.isAlive && p.isConnected);
  }

  getReadyPlayers() {
    return Array.from(this.players.values()).filter(p => p.isReady && p.isConnected);
  }

  getConnectedPlayers() {
    return Array.from(this.players.values()).filter(p => p.isConnected);
  }

  canStart() {
    const connectedPlayers = this.getConnectedPlayers();
    const readyPlayers = this.getReadyPlayers();
    return connectedPlayers.length >= this.minPlayers && 
           readyPlayers.length === connectedPlayers.length;
  }

  findHost() {
    return Array.from(this.players.values()).find(p => p.isHost && p.isConnected);
  }

  assignNewHost() {
    const connectedPlayers = this.getConnectedPlayers();
    if (connectedPlayers.length > 0) {
      // Clear all hosts first
      this.players.forEach(player => player.isHost = false);
      // Assign first connected player as host
      connectedPlayers[0].isHost = true;
      return connectedPlayers[0];
    }
    return null;
  }
}

// Define schema types
type('string')(GameResult.prototype, 'playerId');
type('string')(GameResult.prototype, 'playerName');
type('number')(GameResult.prototype, 'score');
type('number')(GameResult.prototype, 'rank');

type('string')(Player.prototype, 'id');
type('string')(Player.prototype, 'name');
type('boolean')(Player.prototype, 'isReady');
type('boolean')(Player.prototype, 'isHost');
type('number')(Player.prototype, 'score');
type('boolean')(Player.prototype, 'isAlive');
type('boolean')(Player.prototype, 'isConnected');
type('number')(Player.prototype, 'lastActivity');
type('string')(Player.prototype, 'gameData');

type('string')(BaseGameState.prototype, 'gameId');
type('string')(BaseGameState.prototype, 'roomName');
type('string')(BaseGameState.prototype, 'roomCode');
type('string')(BaseGameState.prototype, 'state');
type({ map: Player })(BaseGameState.prototype, 'players');
type('number')(BaseGameState.prototype, 'minPlayers');
type('number')(BaseGameState.prototype, 'maxPlayers');
type('number')(BaseGameState.prototype, 'countdown');
type('number')(BaseGameState.prototype, 'gameStartTime');
type('number')(BaseGameState.prototype, 'gameEndTime');
type('string')(BaseGameState.prototype, 'winner');
type([GameResult])(BaseGameState.prototype, 'results');
type('string')(BaseGameState.prototype, 'settings');
type('boolean')(BaseGameState.prototype, 'isPrivate');
type('number')(BaseGameState.prototype, 'afkTimeout');
type('number')(BaseGameState.prototype, 'reconnectTimeout');
type('number')(BaseGameState.prototype, 'phaseStartedAt');
type('number')(BaseGameState.prototype, 'phaseEndsAt');
type('number')(BaseGameState.prototype, 'createdAt');
type('number')(BaseGameState.prototype, 'lastUpdate');

module.exports = { BaseGameState, Player, GameResult };
