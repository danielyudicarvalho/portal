const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game state
const gameState = {
  players: new Map(),
  currentLevel: 0,
  gameStarted: false,
  levelInProgress: false,
  playersWhoTriedCurrentLevel: new Set(),
  playersWhoPassedCurrentLevel: new Set(),
  currentPlayerTurn: null,
  turnQueue: []
};

const MIN_PLAYERS = 5;
const MAX_LEVELS = 20;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinGame', (playerName) => {
    if (gameState.gameStarted) {
      socket.emit('gameError', 'Game already in progress');
      return;
    }

    gameState.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      alive: true,
      currentLevel: 0,
      deaths: 0
    });

    socket.emit('playerJoined', {
      playerId: socket.id,
      playerName: playerName
    });

    // Broadcast updated player list
    io.emit('playersUpdate', Array.from(gameState.players.values()));

    // Check if we can start the game
    if (gameState.players.size >= MIN_PLAYERS && !gameState.gameStarted) {
      io.emit('canStartGame', true);
    }

    console.log(`Player ${playerName} joined. Total players: ${gameState.players.size}`);
  });

  socket.on('startGame', () => {
    if (gameState.players.size < MIN_PLAYERS) {
      socket.emit('gameError', `Need at least ${MIN_PLAYERS} players to start`);
      return;
    }

    if (gameState.gameStarted) {
      socket.emit('gameError', 'Game already started');
      return;
    }

    gameState.gameStarted = true;
    gameState.currentLevel = 0;
    gameState.turnQueue = Array.from(gameState.players.keys());
    
    startNewLevel();
  });

  socket.on('playerFinishedLevel', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const { success, deaths } = data;
    
    // Update player stats
    player.deaths += deaths;
    gameState.playersWhoTriedCurrentLevel.add(socket.id);
    
    if (success) {
      gameState.playersWhoPassedCurrentLevel.add(socket.id);
      player.currentLevel = Math.max(player.currentLevel, gameState.currentLevel + 1);
    }

    // Broadcast player attempt result
    io.emit('playerAttemptResult', {
      playerId: socket.id,
      playerName: player.name,
      success: success,
      deaths: deaths,
      totalDeaths: player.deaths
    });

    // Check if all players have tried this level
    if (gameState.playersWhoTriedCurrentLevel.size === gameState.players.size) {
      // Move to next level if anyone passed
      if (gameState.playersWhoPassedCurrentLevel.size > 0) {
        gameState.currentLevel++;
        
        if (gameState.currentLevel >= MAX_LEVELS) {
          endGame();
        } else {
          setTimeout(() => startNewLevel(), 2000);
        }
      } else {
        // Everyone failed, restart current level
        setTimeout(() => startNewLevel(), 2000);
      }
    } else {
      // Next player's turn
      nextPlayerTurn();
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    if (gameState.players.has(socket.id)) {
      const player = gameState.players.get(socket.id);
      console.log(`Player ${player.name} left the game`);
      
      gameState.players.delete(socket.id);
      gameState.playersWhoTriedCurrentLevel.delete(socket.id);
      gameState.playersWhoPassedCurrentLevel.delete(socket.id);
      
      // Remove from turn queue
      const index = gameState.turnQueue.indexOf(socket.id);
      if (index > -1) {
        gameState.turnQueue.splice(index, 1);
      }

      // If current player left, move to next turn
      if (gameState.currentPlayerTurn === socket.id) {
        nextPlayerTurn();
      }

      io.emit('playersUpdate', Array.from(gameState.players.values()));

      // End game if not enough players
      if (gameState.players.size < MIN_PLAYERS && gameState.gameStarted) {
        resetGame();
        io.emit('gameEnded', 'Not enough players to continue');
      }
    }
  });
});

function startNewLevel() {
  gameState.levelInProgress = true;
  gameState.playersWhoTriedCurrentLevel.clear();
  gameState.playersWhoPassedCurrentLevel.clear();
  gameState.turnQueue = Array.from(gameState.players.keys());
  
  io.emit('newLevel', {
    level: gameState.currentLevel,
    totalLevels: MAX_LEVELS
  });

  // Start first player's turn
  nextPlayerTurn();
}

function nextPlayerTurn() {
  if (gameState.turnQueue.length === 0) return;

  // Find next player who hasn't tried this level yet
  let nextPlayerId = null;
  for (let playerId of gameState.turnQueue) {
    if (!gameState.playersWhoTriedCurrentLevel.has(playerId)) {
      nextPlayerId = playerId;
      break;
    }
  }

  if (nextPlayerId) {
    gameState.currentPlayerTurn = nextPlayerId;
    const player = gameState.players.get(nextPlayerId);
    
    io.emit('playerTurn', {
      playerId: nextPlayerId,
      playerName: player.name,
      level: gameState.currentLevel
    });
  }
}

function endGame() {
  gameState.levelInProgress = false;
  
  const finalResults = Array.from(gameState.players.values())
    .sort((a, b) => b.currentLevel - a.currentLevel || a.deaths - b.deaths);

  io.emit('gameCompleted', {
    results: finalResults,
    winner: finalResults[0]
  });

  setTimeout(() => {
    resetGame();
  }, 10000);
}

function resetGame() {
  gameState.players.clear();
  gameState.currentLevel = 0;
  gameState.gameStarted = false;
  gameState.levelInProgress = false;
  gameState.playersWhoTriedCurrentLevel.clear();
  gameState.playersWhoPassedCurrentLevel.clear();
  gameState.currentPlayerTurn = null;
  gameState.turnQueue = [];

  io.emit('gameReset');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Multiplayer Box Jump server running on port ${PORT}`);
});