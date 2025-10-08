/**
 * Snake Multiplayer Game Client
 * Uses the new Colyseus-based multiplayer SDK
 */

class SnakeMultiplayerGame {
  constructor() {
    this.sdk = new SnakeMultiplayerSDK({
      serverUrl: 'ws://localhost:3002'
    });
    
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Game state
    this.gameState = null;
    this.playerId = null;
    this.isHost = false;
    this.isReady = false;
    this.isAlive = true;
    
    // Rendering
    this.cellSize = 10;
    this.gridWidth = 80;
    this.gridHeight = 50;
    
    // UI elements
    this.initializeUI();
    this.setupEventHandlers();
    this.setupKeyboardControls();
    
    console.log('🐍 Snake Multiplayer Game initialized');
  }

  initializeUI() {
    // Get UI elements
    this.elements = {
      // Screens
      lobbyScreen: document.getElementById('lobbyScreen'),
      gameUI: document.getElementById('gameUI'),
      resultsScreen: document.getElementById('resultsScreen'),
      
      // Lobby elements
      playerName: document.getElementById('playerName'),
      createRoomBtn: document.getElementById('createRoomBtn'),
      quickMatchBtn: document.getElementById('quickMatchBtn'),
      joinRoomCode: document.getElementById('joinRoomCode'),
      joinPrivateBtn: document.getElementById('joinPrivateBtn'),
      connectionStatus: document.getElementById('connectionStatus'),
      roomCode: document.getElementById('roomCode'),
      roomCodeText: document.getElementById('roomCodeText'),
      playerList: document.getElementById('playerList'),
      players: document.getElementById('players'),
      lobbyControls: document.getElementById('lobbyControls'),
      readyBtn: document.getElementById('readyBtn'),
      startGameBtn: document.getElementById('startGameBtn'),
      leaveRoomBtn: document.getElementById('leaveRoomBtn'),
      
      // Game elements
      countdown: document.getElementById('countdown'),
      playerScore: document.getElementById('playerScore'),
      playerLength: document.getElementById('playerLength'),
      playerShots: document.getElementById('playerShots'),
      playerArmor: document.getElementById('playerArmor'),
      leaderboardList: document.getElementById('leaderboardList'),
      gameStatus: document.getElementById('gameStatus'),
      respawnBtn: document.getElementById('respawnBtn'),
      
      // Results elements
      winnerAnnouncement: document.getElementById('winnerAnnouncement'),
      winnerName: document.getElementById('winnerName'),
      finalResultsList: document.getElementById('finalResultsList'),
      rematchBtn: document.getElementById('rematchBtn'),
      backToLobbyBtn: document.getElementById('backToLobbyBtn')
    };

    // Set default player name
    this.elements.playerName.value = `Player${Math.floor(Math.random() * 1000)}`;
  }

  setupEventHandlers() {
    // SDK event handlers
    this.sdk.on('connected', () => {
      this.updateStatus('Connected to server', 'success');
    });

    this.sdk.on('disconnected', () => {
      this.updateStatus('Disconnected from server', 'error');
      this.showScreen('lobby');
    });

    this.sdk.on('room_joined', ({ playerId, roomCode, isHost }) => {
      this.playerId = playerId;
      this.isHost = isHost;
      this.updateStatus(`Joined room: ${roomCode}`, 'success');
      this.elements.roomCodeText.textContent = roomCode;
      this.elements.roomCode.style.display = 'block';
      this.elements.playerList.style.display = 'block';
      this.elements.lobbyControls.style.display = 'block';
      this.elements.startGameBtn.style.display = isHost ? 'block' : 'none';
    });

    this.sdk.on('room_left', () => {
      this.resetLobby();
      this.showScreen('lobby');
    });

    this.sdk.on('player_joined', ({ player }) => {
      this.updateStatus(`${player.name} joined the room`, 'info');
      this.updatePlayerList();
    });

    this.sdk.on('player_left', ({ playerId }) => {
      this.updatePlayerList();
    });

    this.sdk.on('player_ready', ({ playerId, ready, canStart }) => {
      this.updatePlayerList();
      if (this.isHost) {
        this.elements.startGameBtn.disabled = !canStart;
      }
    });

    this.sdk.on('countdown_started', ({ countdown }) => {
      this.showScreen('game');
      this.showCountdown(countdown);
    });

    this.sdk.on('countdown_tick', ({ countdown }) => {
      this.showCountdown(countdown);
    });

    this.sdk.on('game_started', () => {
      this.elements.countdown.style.display = 'none';
      this.elements.gameStatus.textContent = 'Game in progress!';
      this.isAlive = true;
      this.startGameLoop();
    });

    this.sdk.on('game_ended', ({ results, winner }) => {
      this.stopGameLoop();
      this.showResults(results, winner);
    });

    this.sdk.on('game_update', (gameState) => {
      this.gameState = gameState;
      this.updateGameUI();
    });

    this.sdk.on('error', ({ message }) => {
      this.updateStatus(`Error: ${message}`, 'error');
    });

    // UI event handlers
    this.elements.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.elements.quickMatchBtn.addEventListener('click', () => this.quickMatch());
    this.elements.joinPrivateBtn.addEventListener('click', () => this.joinPrivateRoom());
    this.elements.readyBtn.addEventListener('click', () => this.toggleReady());
    this.elements.startGameBtn.addEventListener('click', () => this.startGame());
    this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
    this.elements.respawnBtn.addEventListener('click', () => this.respawn());
    this.elements.rematchBtn.addEventListener('click', () => this.rematch());
    this.elements.backToLobbyBtn.addEventListener('click', () => this.backToLobby());

    // Enter key handlers
    this.elements.playerName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.quickMatch();
    });
    
    this.elements.joinRoomCode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinPrivateRoom();
    });
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      if (!this.gameState || this.gameState.state !== 'PLAYING' || !this.isAlive) return;

      const key = e.key.toLowerCase();
      let direction = null;

      // Movement controls
      if (key === 'w' || key === 'arrowup') direction = 'UP';
      else if (key === 's' || key === 'arrowdown') direction = 'DOWN';
      else if (key === 'a' || key === 'arrowleft') direction = 'LEFT';
      else if (key === 'd' || key === 'arrowright') direction = 'RIGHT';
      else if (key === 'x') this.sdk.shoot();
      else if (key === 'z') this.sdk.activateArmor();

      if (direction) {
        this.sdk.move(direction);
        e.preventDefault();
      }
    });
  }

  // Room management
  async createRoom() {
    const name = this.elements.playerName.value.trim();
    if (!name) {
      this.updateStatus('Please enter your name', 'error');
      return;
    }

    try {
      this.updateStatus('Creating room...', 'info');
      await this.sdk.createRoom('snake', { 
        name,
        isPrivate: true // Private rooms get room codes
      });
    } catch (error) {
      this.updateStatus('Failed to create room', 'error');
    }
  }

  async quickMatch() {
    const name = this.elements.playerName.value.trim();
    if (!name) {
      this.updateStatus('Please enter your name', 'error');
      return;
    }

    try {
      this.updateStatus('Finding match...', 'info');
      await this.sdk.quickMatch('snake', { name });
    } catch (error) {
      this.updateStatus('Failed to find match', 'error');
    }
  }

  async joinPrivateRoom() {
    const name = this.elements.playerName.value.trim();
    const roomCode = this.elements.joinRoomCode.value.trim().toUpperCase();
    
    if (!name || !roomCode) {
      this.updateStatus('Please enter your name and room code', 'error');
      return;
    }

    try {
      this.updateStatus('Joining room...', 'info');
      await this.sdk.joinPrivateRoom(roomCode, { name });
    } catch (error) {
      this.updateStatus('Failed to join room', 'error');
    }
  }

  toggleReady() {
    this.isReady = !this.isReady;
    this.sdk.setReady(this.isReady);
    this.elements.readyBtn.textContent = this.isReady ? 'Not Ready' : 'Ready';
    this.elements.readyBtn.className = this.isReady ? 'btn danger' : 'btn';
  }

  startGame() {
    if (this.isHost) {
      this.sdk.startGame();
    }
  }

  leaveRoom() {
    this.sdk.leaveRoom();
  }

  respawn() {
    // In the new system, respawning might be handled differently
    // For now, we'll just hide the respawn button
    this.elements.respawnBtn.style.display = 'none';
  }

  rematch() {
    this.sdk.rematch();
    this.showScreen('lobby');
  }

  backToLobby() {
    this.sdk.leaveRoom();
  }

  // UI management
  showScreen(screen) {
    this.elements.lobbyScreen.classList.remove('active');
    this.elements.gameUI.classList.remove('active');
    this.elements.resultsScreen.classList.remove('active');

    switch (screen) {
      case 'lobby':
        this.elements.lobbyScreen.classList.add('active');
        break;
      case 'game':
        this.elements.gameUI.classList.add('active');
        break;
      case 'results':
        this.elements.resultsScreen.classList.add('active');
        break;
    }
  }

  updateStatus(message, type = 'info') {
    this.elements.connectionStatus.textContent = message;
    this.elements.connectionStatus.className = `status ${type}`;
  }

  showCountdown(count) {
    this.elements.countdown.style.display = 'block';
    this.elements.countdown.textContent = count;
  }

  updatePlayerList() {
    if (!this.gameState || !this.gameState.players) return;

    const players = Object.values(this.gameState.players);
    this.elements.players.innerHTML = '';

    players.forEach(player => {
      const div = document.createElement('div');
      div.className = 'player-item';
      if (player.isHost) div.classList.add('host');
      if (player.isReady) div.classList.add('ready');

      div.innerHTML = `
        <span>${player.name} ${player.isHost ? '👑' : ''}</span>
        <span>${player.isReady ? '✅' : '⏳'}</span>
      `;
      this.elements.players.appendChild(div);
    });
  }

  updateGameUI() {
    if (!this.gameState || !this.gameState.players) return;

    const myPlayer = this.gameState.players[this.playerId];
    if (myPlayer && myPlayer.gameData) {
      this.elements.playerScore.textContent = myPlayer.score || 0;
      this.elements.playerLength.textContent = myPlayer.gameData.snake ? myPlayer.gameData.snake.length : 0;
      this.elements.playerShots.textContent = myPlayer.gameData.shots || 0;
      this.elements.playerArmor.textContent = myPlayer.gameData.armor || 0;
      
      this.isAlive = myPlayer.isAlive;
      this.elements.respawnBtn.style.display = !this.isAlive ? 'block' : 'none';
    }

    this.updateLeaderboard();
    this.render();
  }

  updateLeaderboard() {
    if (!this.gameState || !this.gameState.players) return;

    const players = Object.values(this.gameState.players)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    this.elements.leaderboardList.innerHTML = '';
    players.forEach((player, index) => {
      const div = document.createElement('div');
      div.className = 'leaderboard-item';
      div.innerHTML = `
        <span>#${index + 1} ${player.name}</span>
        <span>${player.score || 0}</span>
      `;
      this.elements.leaderboardList.appendChild(div);
    });
  }

  showResults(results, winnerId) {
    this.showScreen('results');
    
    const winner = results.find(r => r.playerId === winnerId);
    this.elements.winnerName.textContent = winner ? winner.playerName : 'Unknown';

    this.elements.finalResultsList.innerHTML = '';
    results.forEach(result => {
      const div = document.createElement('div');
      div.className = 'leaderboard-item';
      div.innerHTML = `
        <span>#${result.rank} ${result.playerName}</span>
        <span>${result.score}</span>
      `;
      this.elements.finalResultsList.appendChild(div);
    });
  }

  resetLobby() {
    this.elements.roomCode.style.display = 'none';
    this.elements.playerList.style.display = 'none';
    this.elements.lobbyControls.style.display = 'none';
    this.elements.readyBtn.textContent = 'Ready';
    this.elements.readyBtn.className = 'btn';
    this.isReady = false;
    this.isHost = false;
    this.playerId = null;
  }

  // Game rendering
  startGameLoop() {
    this.gameLoop = setInterval(() => {
      this.render();
    }, 1000 / 60); // 60 FPS
  }

  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  render() {
    if (!this.gameState) return;

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw foods
    if (this.gameState.foods) {
      this.gameState.foods.forEach(food => this.drawFood(food));
    }

    // Draw players
    if (this.gameState.players) {
      Object.values(this.gameState.players).forEach(player => {
        if (player.isAlive && player.gameData && player.gameData.snake) {
          this.drawSnake(player);
        }
      });
    }

    // Draw projectiles
    if (this.gameState.projectiles) {
      this.gameState.projectiles.forEach(projectile => this.drawProjectile(projectile));
    }
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.gridWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.gridHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(this.canvas.width, y * this.cellSize);
      this.ctx.stroke();
    }
  }

  drawSnake(player) {
    const snake = player.gameData.snake;
    const color = player.gameData.color || { head: 0x00ff00, body: 0x008800 };

    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const hexColor = isHead ? color.head : color.body;
      this.ctx.fillStyle = `#${hexColor.toString(16).padStart(6, '0')}`;
      
      this.ctx.fillRect(
        segment.x * this.cellSize,
        segment.y * this.cellSize,
        this.cellSize - 1,
        this.cellSize - 1
      );

      // Draw armor effect
      if (isHead && player.gameData.armored) {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          segment.x * this.cellSize,
          segment.y * this.cellSize,
          this.cellSize - 1,
          this.cellSize - 1
        );
      }
    });
  }

  drawFood(food) {
    const colors = {
      static: '#ff0000',
      temp: '#ff8800',
      moving: '#0088ff',
      weapon: '#8800ff',
      armor: '#888888',
      poison: '#440000'
    };

    this.ctx.fillStyle = colors[food.type] || '#ffffff';
    this.ctx.fillRect(
      food.x * this.cellSize,
      food.y * this.cellSize,
      this.cellSize - 1,
      this.cellSize - 1
    );

    // Add symbols for special foods
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '8px Arial';
    this.ctx.textAlign = 'center';
    
    const centerX = food.x * this.cellSize + this.cellSize / 2;
    const centerY = food.y * this.cellSize + this.cellSize / 2 + 2;

    switch (food.type) {
      case 'weapon':
        this.ctx.fillText('⚡', centerX, centerY);
        break;
      case 'armor':
        this.ctx.fillText('🛡', centerX, centerY);
        break;
      case 'poison':
        this.ctx.fillText('☠', centerX, centerY);
        break;
    }
  }

  drawProjectile(projectile) {
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(
      projectile.x * this.cellSize + 2,
      projectile.y * this.cellSize + 2,
      this.cellSize - 4,
      this.cellSize - 4
    );
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.snakeGame = new SnakeMultiplayerGame();
});