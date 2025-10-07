const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const players = {};
const bullets = [];
const powerUps = {};
const gameState = {
  players: {},
  bullets: [],
  powerUps: {},
  gameStarted: false,
  winner: null,
  roundStartTime: Date.now(),
  roundDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
  roundActive: true,
  killCounts: {} // Track kills per player per round
};

// Power-up spawning system
function spawnPowerUp() {
  const types = ['rock', 'paper', 'scissors'];
  const type = types[Math.floor(Math.random() * 3)];
  const id = Date.now() + Math.random();

  const powerUp = {
    id: id,
    type: type,
    x: Math.random() * 1520 + 40,
    y: Math.random() * 920 + 40,
    spawnTime: Date.now()
  };

  powerUps[id] = powerUp;
  gameState.powerUps = powerUps;
  io.emit('newPowerUp', powerUp);

  console.log(`Spawned ${type} power-up at (${Math.floor(powerUp.x)}, ${Math.floor(powerUp.y)})`);
}

// Auto-transformation system - every 30 seconds all tanks change type
setInterval(() => {
  if (Object.keys(players).length > 0) {
    console.log('🔄 AUTO-TRANSFORMATION EVENT: All tanks changing type!');
    
    const tankTypes = ['rock', 'paper', 'scissors'];
    const tankColors = {
      rock: 0xff4444,
      paper: 0x4444ff,
      scissors: 0x44ff44
    };
    
    // Transform all alive players
    Object.keys(players).forEach(playerId => {
      const player = players[playerId];
      if (player && player.alive) {
        const oldType = player.type;
        
        // Get available types (exclude current type for guaranteed change)
        const availableTypes = tankTypes.filter(type => type !== oldType);
        const newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        player.type = newType;
        player.color = tankColors[newType];
        
        console.log(`🔄 Player ${playerId} transformed: ${oldType} → ${newType}`);
        
        // Notify all clients of the transformation
        io.emit('playerTypeChanged', {
          playerId: playerId,
          newType: newType,
          newColor: player.color,
          oldType: oldType
        });
      }
    });
    
    // Announce the transformation event
    io.emit('transformationEvent', {
      message: 'MASS TRANSFORMATION! All tanks have changed type!',
      timestamp: Date.now()
    });
  }
}, 30000); // Every 30 seconds

// Spawn power-ups every 15-20 seconds (less frequent since we have auto-transformation)
setInterval(() => {
  if (Object.keys(players).length > 0) {
    spawnPowerUp();
  }
}, Math.random() * 5000 + 15000);

// Remove old power-ups after 8 seconds (longer duration)
setInterval(() => {
  const now = Date.now();
  Object.keys(powerUps).forEach(id => {
    if (now - powerUps[id].spawnTime > 8000) {
      delete powerUps[id];
      gameState.powerUps = powerUps;
      io.emit('removePowerUp', id);
      console.log(`Power-up ${powerUps[id]?.type || 'unknown'} expired after 8 seconds`);
    }
  });
}, 1000);

// Round timer - check every second
setInterval(() => {
  if (gameState.roundActive) {
    const timeLeft = gameState.roundDuration - (Date.now() - gameState.roundStartTime);
    
    if (timeLeft <= 0) {
      endRound();
    } else {
      // Send time update every 10 seconds
      if (Math.floor(timeLeft / 1000) % 10 === 0) {
        io.emit('roundTimeUpdate', {
          timeLeft: timeLeft,
          leaderboard: getLeaderboard()
        });
      }
    }
  }
}, 1000);

// End current round and start new one
function endRound() {
  gameState.roundActive = false;
  
  const finalLeaderboard = getLeaderboard();
  const winner = finalLeaderboard[0];
  
  console.log('🏁 ROUND ENDED!');
  console.log('Final leaderboard:', finalLeaderboard);
  
  io.emit('roundEnded', {
    winner: winner,
    leaderboard: finalLeaderboard,
    message: winner ? `🏆 ${winner.playerId} wins with ${winner.kills} kills!` : 'Round ended!'
  });
  
  // Start new round after 10 seconds
  setTimeout(() => {
    startNewRound();
  }, 10000);
}

// Start a new round
function startNewRound() {
  console.log('🚀 STARTING NEW ROUND!');
  
  gameState.roundStartTime = Date.now();
  gameState.roundActive = true;
  gameState.killCounts = {};
  
  // Reset all players
  Object.keys(players).forEach(playerId => {
    const player = players[playerId];
    player.kills = 0;
    player.deaths = 0;
    player.alive = true;
    player.health = 100;
    player.x = Math.random() * 1540 + 30;
    player.y = Math.random() * 940 + 30;
    player.rotation = 0;
    gameState.killCounts[playerId] = 0;
  });
  
  io.emit('roundStarted', {
    message: '🚀 NEW ROUND STARTED! 5 minutes to get the most kills!',
    duration: gameState.roundDuration,
    players: players
  });
}

// Get current leaderboard (move outside socket connection)
function getLeaderboard() {
  return Object.keys(gameState.killCounts)
    .map(playerId => ({
      playerId: playerId,
      kills: gameState.killCounts[playerId] || 0,
      deaths: players[playerId]?.deaths || 0
    }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 10); // Top 10
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Tank types: Rock (red), Paper (blue), Scissors (green)
  const tankTypes = ['rock', 'paper', 'scissors'];
  const tankType = tankTypes[Math.floor(Math.random() * 3)];

  const tankColors = {
    rock: 0xff4444,    // Red - strong, slow, high damage
    paper: 0x4444ff,   // Blue - balanced
    scissors: 0x44ff44 // Green - fast, weak, low damage
  };

  // Add new player
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 1540 + 30,
    y: Math.random() * 940 + 30,
    rotation: 0,
    health: 100,
    alive: true,
    type: tankType,
    color: tankColors[tankType],
    kills: 0,
    deaths: 0
  };

  // Initialize kill count for this round
  if (!gameState.killCounts[socket.id]) {
    gameState.killCounts[socket.id] = 0;
  }

  gameState.players = players;

  // Send current game state to new player
  socket.emit('currentPlayers', players);
  socket.emit('gameState', gameState);

  // Send current power-ups to new player
  Object.values(powerUps).forEach(powerUp => {
    socket.emit('newPowerUp', powerUp);
  });

  // Notify other players of new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id] && players[socket.id].alive) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].rotation = movementData.rotation;

      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: movementData.x,
        y: movementData.y,
        rotation: movementData.rotation
      });
    }
  });

  // Handle shooting
  socket.on('shoot', (bulletData) => {
    if (players[socket.id] && players[socket.id].alive) {
      const bullet = {
        id: Date.now() + Math.random(),
        playerId: socket.id,
        x: bulletData.x,
        y: bulletData.y,
        velocityX: bulletData.velocityX,
        velocityY: bulletData.velocityY,
        rotation: bulletData.rotation,
        type: bulletData.type,
        size: bulletData.size,
        color: bulletData.color
      };

      bullets.push(bullet);
      gameState.bullets = bullets;
      io.emit('newBullet', bullet);
    }
  });

  // Handle player hit with rock-paper-scissors logic
  socket.on('playerHit', (data) => {
    const shooter = players[data.shooterId];
    const target = players[data.playerId];

    if (shooter && target && target.alive) {
      // Calculate damage based on pure rock-paper-scissors rules
      let damage = calculateDamage(shooter.type, target.type);

      if (damage > 0) {
        target.health -= damage;
        console.log(`${shooter.type} tank hit ${target.type} tank for ${damage} damage`);
      } else {
        console.log(`${shooter.type} tank hit ${target.type} tank but dealt no damage (ineffective)`);
      }

      if (target.health <= 0) {
        target.alive = false;
        target.health = 0;
        target.deaths++;
        
        // Award kill to shooter
        shooter.kills++;
        gameState.killCounts[data.shooterId] = (gameState.killCounts[data.shooterId] || 0) + 1;
        
        console.log(`💀 KILL! ${shooter.id} (${shooter.type}) eliminated ${target.id} (${target.type})`);
        console.log(`📊 Kill count - ${shooter.id}: ${gameState.killCounts[data.shooterId]} kills`);
        
        // Schedule respawn after 3 seconds
        setTimeout(() => {
          if (players[data.playerId] && gameState.roundActive) {
            respawnPlayer(data.playerId);
          }
        }, 3000);
        
        // Send kill count update to all players
        io.emit('killCountUpdate', {
          killerId: data.shooterId,
          killerKills: gameState.killCounts[data.shooterId],
          victimId: data.playerId,
          leaderboard: getLeaderboard()
        });
      }

      io.emit('playerHealthUpdate', {
        playerId: data.playerId,
        health: target.health,
        alive: target.alive,
        damage: damage,
        shooterType: shooter.type,
        targetType: target.type
      });
    }
  });

  // Pure Rock-Paper-Scissors damage calculation - only effective matchups deal damage
  function calculateDamage(attackerType, defenderType) {
    const damage = 50; // Higher damage since only effective hits count

    // Only effective matchups deal damage, everything else is 0
    if (
      (attackerType === 'rock' && defenderType === 'scissors') ||
      (attackerType === 'paper' && defenderType === 'rock') ||
      (attackerType === 'scissors' && defenderType === 'paper')
    ) {
      return damage; // Only effective hits deal damage
    } else {
      return 0; // All other combinations deal no damage
    }
  }

  // Respawn a player
  function respawnPlayer(playerId) {
    const player = players[playerId];
    if (!player || !gameState.roundActive) return;
    
    // Reset player state
    player.alive = true;
    player.health = 100;
    player.x = Math.random() * 1540 + 30;
    player.y = Math.random() * 940 + 30;
    player.rotation = 0;
    
    // Reset kill count for new life
    gameState.killCounts[playerId] = 0;
    
    console.log(`🔄 Player ${playerId} respawned! Kill count reset to 0.`);
    
    // Notify all clients
    io.emit('playerRespawned', {
      playerId: playerId,
      playerData: player,
      leaderboard: getLeaderboard()
    });
  }



  // Handle power-up collection
  socket.on('collectPowerUp', (data) => {
    console.log(`POWER-UP COLLECTION REQUEST: Player ${socket.id} wants to collect ${data.powerUpId}`);

    const player = players[socket.id];
    const powerUp = powerUps[data.powerUpId];

    console.log(`Player exists: ${!!player}, PowerUp exists: ${!!powerUp}, Player alive: ${player?.alive}`);
    console.log(`PowerUp details:`, powerUp);

    if (player && powerUp && player.alive) {
      // Change player's tank type INSTANTLY
      const oldType = player.type;
      player.type = powerUp.type;

      // Update color based on new type
      const tankColors = {
        rock: 0xff4444,
        paper: 0x4444ff,
        scissors: 0x44ff44
      };
      player.color = tankColors[player.type];

      console.log(`🔄 TRANSFORMATION: Player ${socket.id} changed from ${oldType} to ${player.type}`);

      // Remove the power-up IMMEDIATELY to prevent double collection
      delete powerUps[data.powerUpId];
      gameState.powerUps = powerUps;

      // Notify all players IMMEDIATELY of the transformation - send this FIRST
      const transformationData = {
        playerId: socket.id,
        newType: player.type,
        newColor: player.color,
        oldType: oldType
      };

      console.log(`📡 SENDING TRANSFORMATION EVENT:`, transformationData);
      io.emit('playerTypeChanged', transformationData);

      // Remove power-up from all clients AFTER transformation is sent
      io.emit('removePowerUp', data.powerUpId);

      console.log(`✅ Transformation complete - ${oldType} → ${player.type}`);
    } else {
      console.log(`❌ Power-up collection FAILED: player=${!!player}, powerUp=${!!powerUp}, alive=${player?.alive}`);
      if (player) {
        console.log(`Player details:`, { id: player.id, type: player.type, alive: player.alive });
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    gameState.players = players;
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});