const { BaseGameRoom } = require('./BaseGameRoom');
const { Schema, type, ArraySchema } = require('@colyseus/schema');

class BoxJumpGameState extends Schema {
  constructor() {
    super();
    this.currentLevel = 1;
    this.maxLevels = 20;
    this.currentPlayerIndex = 0;
    this.playerQueue = new ArraySchema();
    this.levelAttempts = new Map(); // Track attempts per level per player
    this.roundComplete = false;
  }
}

// Define schema types
type('number')(BoxJumpGameState.prototype, 'currentLevel');
type('number')(BoxJumpGameState.prototype, 'maxLevels');
type('number')(BoxJumpGameState.prototype, 'currentPlayerIndex');
type(['string'])(BoxJumpGameState.prototype, 'playerQueue');
type('boolean')(BoxJumpGameState.prototype, 'roundComplete');

class BoxJumpRoom extends BaseGameRoom {
  onCreate(options = {}) {
    super.onCreate(options);
    
    // Extend state with box jump specific data
    const boxJumpState = new BoxJumpGameState();
    Object.assign(this.state, boxJumpState);
    
    // Box Jump specific settings
    this.state.minPlayers = options.minPlayers || 5;
    this.state.maxPlayers = options.maxPlayers || 10;
    this.maxClients = this.state.maxPlayers;
    
    // Track player progress
    this.playerProgress = new Map(); // playerId -> { level, deaths, completed }
  }

  onJoin(client, options = {}) {
    super.onJoin(client, options);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Initialize box jump specific data
      player.gameData = {
        currentLevel: 1,
        deaths: 0,
        isCurrentPlayer: false,
        hasCompletedCurrentLevel: false
      };
      
      // Add to player queue
      this.state.playerQueue.push(client.sessionId);
      
      // Initialize progress tracking
      this.playerProgress.set(client.sessionId, {
        level: 1,
        deaths: 0,
        completed: false
      });
    }
  }

  onLeave(client, consented = false) {
    // Remove from queue
    const queueIndex = this.state.playerQueue.indexOf(client.sessionId);
    if (queueIndex !== -1) {
      this.state.playerQueue.splice(queueIndex, 1);
      
      // Adjust current player index if needed
      if (this.state.currentPlayerIndex >= queueIndex && this.state.currentPlayerIndex > 0) {
        this.state.currentPlayerIndex--;
      }
    }
    
    // Remove progress tracking
    this.playerProgress.delete(client.sessionId);
    
    super.onLeave(client, consented);
  }

  onGameMessage(client, type, message) {
    const player = this.state.players.get(client.sessionId);
    if (!player || this.state.state !== 'PLAYING') return;

    switch (type) {
      case 'level_completed':
        this.handleLevelCompleted(client.sessionId);
        break;
      case 'player_died':
        this.handlePlayerDied(client.sessionId);
        break;
      case 'turn_finished':
        this.handleTurnFinished(client.sessionId);
        break;
    }
  }

  handleLevelCompleted(playerId) {
    const player = this.state.players.get(playerId);
    if (!player || !this.isCurrentPlayer(playerId)) return;

    const progress = this.playerProgress.get(playerId);
    if (progress) {
      progress.level = Math.max(progress.level, this.state.currentLevel + 1);
      player.gameData.currentLevel = progress.level;
      player.gameData.hasCompletedCurrentLevel = true;
      
      this.broadcast('level_completed', {
        playerId,
        playerName: player.name,
        level: this.state.currentLevel,
        newLevel: progress.level
      });
      
      console.log(`🎯 ${player.name} completed level ${this.state.currentLevel}`);
    }
    
    this.nextTurn();
  }

  handlePlayerDied(playerId) {
    const player = this.state.players.get(playerId);
    if (!player || !this.isCurrentPlayer(playerId)) return;

    const progress = this.playerProgress.get(playerId);
    if (progress) {
      progress.deaths++;
      player.gameData.deaths = progress.deaths;
      
      this.broadcast('player_died', {
        playerId,
        playerName: player.name,
        level: this.state.currentLevel,
        totalDeaths: progress.deaths
      });
      
      console.log(`💀 ${player.name} died on level ${this.state.currentLevel} (${progress.deaths} total deaths)`);
    }
    
    this.nextTurn();
  }

  handleTurnFinished(playerId) {
    if (!this.isCurrentPlayer(playerId)) return;
    this.nextTurn();
  }

  isCurrentPlayer(playerId) {
    return this.state.playerQueue[this.state.currentPlayerIndex] === playerId;
  }

  nextTurn() {
    if (this.state.playerQueue.length === 0) return;

    // Mark current player as not current
    const currentPlayerId = this.state.playerQueue[this.state.currentPlayerIndex];
    if (currentPlayerId) {
      const currentPlayer = this.state.players.get(currentPlayerId);
      if (currentPlayer && currentPlayer.gameData) {
        currentPlayer.gameData.isCurrentPlayer = false;
      }
    }

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.playerQueue.length;
    
    // Check if round is complete (all players have had their turn)
    if (this.state.currentPlayerIndex === 0) {
      this.checkRoundComplete();
    } else {
      this.setCurrentPlayer();
    }
  }

  setCurrentPlayer() {
    const currentPlayerId = this.state.playerQueue[this.state.currentPlayerIndex];
    if (!currentPlayerId) return;

    const currentPlayer = this.state.players.get(currentPlayerId);
    if (currentPlayer && currentPlayer.gameData) {
      currentPlayer.gameData.isCurrentPlayer = true;
      
      this.broadcast('turn_started', {
        playerId: currentPlayerId,
        playerName: currentPlayer.name,
        level: this.state.currentLevel,
        playerIndex: this.state.currentPlayerIndex,
        totalPlayers: this.state.playerQueue.length
      });
      
      console.log(`🎮 ${currentPlayer.name}'s turn on level ${this.state.currentLevel}`);
    }
  }

  checkRoundComplete() {
    // Check who can advance to the next level
    const playersWhoCompleted = [];
    const playersWhoFailed = [];
    
    this.state.playerQueue.forEach(playerId => {
      const progress = this.playerProgress.get(playerId);
      const player = this.state.players.get(playerId);
      
      if (progress && player) {
        if (progress.level > this.state.currentLevel) {
          playersWhoCompleted.push({ playerId, player, progress });
        } else {
          playersWhoFailed.push({ playerId, player, progress });
        }
      }
    });

    this.broadcast('round_complete', {
      level: this.state.currentLevel,
      playersWhoCompleted: playersWhoCompleted.map(p => ({
        playerId: p.playerId,
        playerName: p.player.name,
        deaths: p.progress.deaths
      })),
      playersWhoFailed: playersWhoFailed.map(p => ({
        playerId: p.playerId,
        playerName: p.player.name,
        deaths: p.progress.deaths
      }))
    });

    // Remove players who failed from the queue
    playersWhoFailed.forEach(({ playerId }) => {
      const queueIndex = this.state.playerQueue.indexOf(playerId);
      if (queueIndex !== -1) {
        this.state.playerQueue.splice(queueIndex, 1);
      }
      
      const player = this.state.players.get(playerId);
      if (player) {
        player.isAlive = false; // Mark as eliminated
      }
    });

    // Check if game should end
    if (this.state.playerQueue.length <= 1 || this.state.currentLevel >= this.state.maxLevels) {
      this.endBoxJumpGame();
      return;
    }

    // Advance to next level
    this.state.currentLevel++;
    this.state.currentPlayerIndex = 0;
    
    // Reset completion flags
    this.state.players.forEach(player => {
      if (player.gameData) {
        player.gameData.hasCompletedCurrentLevel = false;
      }
    });

    setTimeout(() => {
      this.setCurrentPlayer();
    }, 3000); // 3 second delay between rounds

    console.log(`📈 Advanced to level ${this.state.currentLevel} with ${this.state.playerQueue.length} players`);
  }

  endBoxJumpGame() {
    // Calculate final results
    const results = [];
    
    this.playerProgress.forEach((progress, playerId) => {
      const player = this.state.players.get(playerId);
      if (player) {
        results.push({
          playerId,
          playerName: player.name,
          level: progress.level,
          deaths: progress.deaths,
          score: (progress.level - 1) * 1000 - progress.deaths * 10 // Score based on levels and deaths
        });
      }
    });

    // Sort by level completed (desc), then by deaths (asc)
    results.sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level; // Higher level wins
      }
      return a.deaths - b.deaths; // Fewer deaths wins
    });

    // Assign ranks and update player scores
    results.forEach((result, index) => {
      result.rank = index + 1;
      const player = this.state.players.get(result.playerId);
      if (player) {
        player.score = result.score;
      }
    });

    this.endGame(results);
    
    console.log(`🏁 Box Jump game ended. Winner: ${results[0]?.playerName} (Level ${results[0]?.level})`);
  }

  onGameStart() {
    // Initialize first player's turn
    this.state.currentPlayerIndex = 0;
    this.state.currentLevel = 1;
    
    // Reset all player progress
    this.state.players.forEach((player, playerId) => {
      if (player.gameData) {
        player.gameData.currentLevel = 1;
        player.gameData.deaths = 0;
        player.gameData.isCurrentPlayer = false;
        player.gameData.hasCompletedCurrentLevel = false;
      }
      
      const progress = this.playerProgress.get(playerId);
      if (progress) {
        progress.level = 1;
        progress.deaths = 0;
        progress.completed = false;
      }
    });

    // Start first player's turn
    setTimeout(() => {
      this.setCurrentPlayer();
    }, 1000);
    
    console.log(`🚀 Box Jump game started with ${this.state.playerQueue.length} players`);
  }

  onGameReset() {
    // Reset game state
    this.state.currentLevel = 1;
    this.state.currentPlayerIndex = 0;
    this.state.roundComplete = false;
    
    // Reset player progress
    this.playerProgress.clear();
    this.state.players.forEach((player, playerId) => {
      if (player.gameData) {
        player.gameData.currentLevel = 1;
        player.gameData.deaths = 0;
        player.gameData.isCurrentPlayer = false;
        player.gameData.hasCompletedCurrentLevel = false;
      }
      
      this.playerProgress.set(playerId, {
        level: 1,
        deaths: 0,
        completed: false
      });
    });
    
    console.log('🔄 Box Jump game reset');
  }

  // Override canStart to require minimum players
  canStart() {
    const connectedPlayers = this.state.getConnectedPlayers();
    const readyPlayers = this.state.getReadyPlayers();
    return connectedPlayers.length >= this.state.minPlayers && 
           readyPlayers.length === connectedPlayers.length;
  }
}

module.exports = { BoxJumpRoom };