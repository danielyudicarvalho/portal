const { BaseGameRoom } = require('./BaseGameRoom');
const { Schema, type, ArraySchema } = require('@colyseus/schema');

class SnakeSegment extends Schema {
  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

class Food extends Schema {
  constructor(x = 0, y = 0, type = 'static') {
    super();
    this.x = x;
    this.y = y;
    this.type = type; // static, temp, moving, weapon, armor, poison
    this.direction = 'RIGHT';
    this.timer = 0;
  }
}

class Projectile extends Schema {
  constructor(x = 0, y = 0, direction = 'RIGHT', playerId = '') {
    super();
    this.id = Math.random().toString(36);
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.playerId = playerId;
  }
}

class SnakeGameState extends Schema {
  constructor() {
    super();
    this.gridWidth = 80;
    this.gridHeight = 50;
    this.foods = new ArraySchema();
    this.projectiles = new ArraySchema();
    this.sessionDuration = 5 * 60 * 1000; // 5 minutes
  }
}

// Define schema types
type('number')(SnakeSegment.prototype, 'x');
type('number')(SnakeSegment.prototype, 'y');

type('number')(Food.prototype, 'x');
type('number')(Food.prototype, 'y');
type('string')(Food.prototype, 'type');
type('string')(Food.prototype, 'direction');
type('number')(Food.prototype, 'timer');

type('string')(Projectile.prototype, 'id');
type('number')(Projectile.prototype, 'x');
type('number')(Projectile.prototype, 'y');
type('string')(Projectile.prototype, 'direction');
type('string')(Projectile.prototype, 'playerId');

type('number')(SnakeGameState.prototype, 'gridWidth');
type('number')(SnakeGameState.prototype, 'gridHeight');
type([Food])(SnakeGameState.prototype, 'foods');
type([Projectile])(SnakeGameState.prototype, 'projectiles');
type('number')(SnakeGameState.prototype, 'sessionDuration');

class SnakeRoom extends BaseGameRoom {
  onCreate(options = {}) {
    super.onCreate(options);
    
    // Extend state with snake-specific data
    const snakeState = new SnakeGameState();
    Object.assign(this.state, snakeState);
    
    // Snake-specific settings
    this.state.minPlayers = options.minPlayers || 2;
    this.state.maxPlayers = options.maxPlayers || 8;
    this.maxClients = this.state.maxPlayers;
    
    // Player colors
    this.playerColors = [
      { head: 0x27ae60, body: 0x2ecc71 }, // Green
      { head: 0x8e44ad, body: 0x9b59b6 }, // Purple
      { head: 0xe67e22, body: 0xf39c12 }, // Orange
      { head: 0x2980b9, body: 0x3498db }, // Blue
      { head: 0xe74c3c, body: 0xec7063 }, // Red
      { head: 0xf1c40f, body: 0xf4d03f }, // Yellow
      { head: 0x1abc9c, body: 0x48c9b0 }, // Teal
      { head: 0x95a5a6, body: 0xbdc3c7 }  // Gray
    ];
    
    this.initializeFoods();
  }

  onJoin(client, options = {}) {
    super.onJoin(client, options);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Initialize snake-specific data
      const spawnPos = this.getRandomSpawnPosition();
      const colorIndex = Array.from(this.state.players.keys()).indexOf(client.sessionId);
      
      player.gameData = {
        snake: [
          { x: spawnPos.x, y: spawnPos.y },
          { x: spawnPos.x - 1, y: spawnPos.y },
          { x: spawnPos.x - 2, y: spawnPos.y }
        ],
        direction: 'RIGHT',
        color: this.playerColors[colorIndex % this.playerColors.length],
        shots: 0,
        armor: 0,
        armored: false
      };
    }
  }

  onGameMessage(client, type, message) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive || this.state.state !== 'PLAYING') return;

    switch (type) {
      case 'move':
        this.handleMove(client.sessionId, message.direction);
        break;
      case 'shoot':
        this.handleShoot(client.sessionId);
        break;
      case 'activate_armor':
        this.handleActivateArmor(client.sessionId);
        break;
    }
  }

  handleMove(playerId, direction) {
    const player = this.state.players.get(playerId);
    if (!player || !player.gameData) return;

    // Prevent reverse direction
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (direction !== opposites[player.gameData.direction]) {
      player.gameData.direction = direction;
    }
  }

  handleShoot(playerId) {
    const player = this.state.players.get(playerId);
    if (!player || !player.gameData || player.gameData.shots <= 0 || player.score < 5) return;

    const head = player.gameData.snake[0];
    const projectile = new Projectile(head.x, head.y, player.gameData.direction, playerId);
    
    this.state.projectiles.push(projectile);
    player.gameData.shots--;
    player.score = Math.max(0, player.score - 5);

    this.broadcast('projectile_fired', {
      projectile: {
        id: projectile.id,
        x: projectile.x,
        y: projectile.y,
        direction: projectile.direction,
        playerId: projectile.playerId
      },
      playerShots: player.gameData.shots,
      playerScore: player.score
    });
  }

  handleActivateArmor(playerId) {
    const player = this.state.players.get(playerId);
    if (!player || !player.gameData || player.gameData.armor <= 0 || 
        player.score < 5 || player.gameData.armored) return;

    player.gameData.armor--;
    player.gameData.armored = true;
    player.score = Math.max(0, player.score - 5);

    // Armor lasts 10 seconds
    setTimeout(() => {
      if (this.state.players.has(playerId)) {
        const p = this.state.players.get(playerId);
        if (p.gameData) {
          p.gameData.armored = false;
        }
      }
    }, 10000);

    this.broadcast('armor_activated', {
      playerId,
      playerArmor: player.gameData.armor,
      playerScore: player.score
    });
  }

  onGameStart() {
    // Start game session timer
    setTimeout(() => {
      if (this.state.state === 'PLAYING') {
        this.endGameSession();
      }
    }, this.state.sessionDuration);

    // Start game loop
    this.gameLoopInterval = setInterval(() => {
      this.updateGame();
    }, 150);

    // Start food timers
    this.setupFoodTimers();
  }

  onGameReset() {
    // Reset all players' snake data
    this.state.players.forEach(player => {
      if (player.gameData) {
        const spawnPos = this.getRandomSpawnPosition();
        player.gameData.snake = [
          { x: spawnPos.x, y: spawnPos.y },
          { x: spawnPos.x - 1, y: spawnPos.y },
          { x: spawnPos.x - 2, y: spawnPos.y }
        ];
        player.gameData.direction = 'RIGHT';
        player.gameData.shots = 0;
        player.gameData.armor = 0;
        player.gameData.armored = false;
      }
    });

    // Reset foods and projectiles
    this.state.projectiles.clear();
    this.initializeFoods();
  }

  updateGame() {
    if (this.state.state !== 'PLAYING') return;

    this.moveSnakes();
    this.moveProjectiles();
    this.moveFoods();
    this.checkCollisions();

    // Send game update
    this.broadcast('game_update', {
      players: this.getPlayersData(),
      foods: Array.from(this.state.foods),
      projectiles: Array.from(this.state.projectiles)
    });
  }

  moveSnakes() {
    this.state.players.forEach(player => {
      if (!player.isAlive || !player.gameData) return;

      const head = { ...player.gameData.snake[0] };

      switch (player.gameData.direction) {
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
      }

      player.gameData.snake.unshift(head);

      // Check food collision
      let ateFood = false;
      for (let i = 0; i < this.state.foods.length; i++) {
        const food = this.state.foods[i];
        if (head.x === food.x && head.y === food.y) {
          ateFood = this.handleFoodCollision(player, food, i);
          break;
        }
      }

      if (!ateFood) {
        player.gameData.snake.pop();
      }

      // Check wall collision
      const hitWall = head.x < 0 || head.x >= this.state.gridWidth || 
                     head.y < 0 || head.y >= this.state.gridHeight;
      
      // Check self collision
      const hitSelf = player.gameData.snake.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y
      );

      if (hitWall || hitSelf) {
        if (player.gameData.armored) {
          player.gameData.armored = false;
          this.broadcast('armor_used', { playerId: player.id });
        } else {
          player.isAlive = false;
          this.broadcast('player_died', { playerId: player.id });
        }
      }
    });

    // Check player vs player collisions
    this.checkPlayerCollisions();
  }

  handleFoodCollision(player, food, foodIndex) {
    let points = 0;
    let ateFood = true;

    switch (food.type) {
      case 'static':
        points = 10;
        this.spawnFood('static');
        break;
      case 'temp':
        points = 15;
        this.spawnFood('temp');
        break;
      case 'moving':
        points = 25;
        this.spawnFood('moving');
        break;
      case 'weapon':
        points = 5;
        player.gameData.shots++;
        this.spawnFood('weapon');
        this.broadcast('player_got_weapon', { playerId: player.id, shots: player.gameData.shots });
        break;
      case 'armor':
        points = 5;
        player.gameData.armor++;
        this.spawnFood('armor');
        this.broadcast('player_got_armor', { playerId: player.id, armor: player.gameData.armor });
        break;
      case 'poison':
        // Poison kills instantly
        player.isAlive = false;
        player.gameData.armored = false;
        this.broadcast('player_poisoned', { playerId: player.id, playerName: player.name });
        ateFood = false; // Player dies, doesn't grow
        break;
    }

    if (points > 0) {
      player.score += points;
    }

    // Remove the eaten food
    this.state.foods.splice(foodIndex, 1);
    
    return ateFood;
  }

  checkPlayerCollisions() {
    const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive && p.gameData);
    
    for (let i = 0; i < alivePlayers.length; i++) {
      for (let j = i + 1; j < alivePlayers.length; j++) {
        const player1 = alivePlayers[i];
        const player2 = alivePlayers[j];
        
        const head1 = player1.gameData.snake[0];
        const head2 = player2.gameData.snake[0];

        // Head-to-head collision
        if (head1.x === head2.x && head1.y === head2.y) {
          if (player1.gameData.snake.length > player2.gameData.snake.length) {
            this.killPlayer(player2, player1);
          } else if (player2.gameData.snake.length > player1.gameData.snake.length) {
            this.killPlayer(player1, player2);
          } else {
            // Same length - both die
            player1.isAlive = false;
            player2.isAlive = false;
            this.broadcast('player_died', { playerId: player1.id });
            this.broadcast('player_died', { playerId: player2.id });
          }
        }

        // Check if player1 hits player2's body
        const hitPlayer2Body = player2.gameData.snake.some(segment =>
          segment.x === head1.x && segment.y === head1.y
        );
        
        if (hitPlayer2Body) {
          if (player1.gameData.snake.length > player2.gameData.snake.length) {
            this.killPlayer(player2, player1);
          } else if (player1.gameData.snake.length < player2.gameData.snake.length) {
            this.killPlayer(player1, player2);
          } else {
            player1.isAlive = false;
            player2.isAlive = false;
            this.broadcast('player_died', { playerId: player1.id });
            this.broadcast('player_died', { playerId: player2.id });
          }
        }
      }
    }
  }

  killPlayer(victim, killer) {
    victim.isAlive = false;
    killer.score += Math.floor(victim.gameData.snake.length * 2);
    
    this.broadcast('player_killed', {
      killerId: killer.id,
      victimId: victim.id,
      killerScore: killer.score
    });
  }

  moveProjectiles() {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.state.projectiles[i];
      
      // Move projectile (2 cells per tick for speed)
      const speed = 2;
      switch (projectile.direction) {
        case 'LEFT': projectile.x -= speed; break;
        case 'RIGHT': projectile.x += speed; break;
        case 'UP': projectile.y -= speed; break;
        case 'DOWN': projectile.y += speed; break;
      }

      // Check wall collision
      if (projectile.x < 0 || projectile.x >= this.state.gridWidth || 
          projectile.y < 0 || projectile.y >= this.state.gridHeight) {
        this.state.projectiles.splice(i, 1);
        continue;
      }

      // Check player collision
      let hitPlayer = false;
      this.state.players.forEach(player => {
        if (!player.isAlive || !player.gameData || player.id === projectile.playerId) return;

        const hit = player.gameData.snake.some(segment =>
          segment.x === projectile.x && segment.y === projectile.y
        );

        if (hit) {
          if (player.gameData.armored) {
            player.gameData.armored = false;
            this.broadcast('armor_used', { playerId: player.id });
          } else {
            player.isAlive = false;
            const shooter = this.state.players.get(projectile.playerId);
            if (shooter) {
              shooter.score += 20;
            }
            this.broadcast('player_shot', {
              victimId: player.id,
              shooterId: projectile.playerId,
              shooterScore: shooter ? shooter.score : 0
            });
          }
          hitPlayer = true;
        }
      });

      if (hitPlayer) {
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  moveFoods() {
    this.state.foods.forEach(food => {
      if (food.type === 'moving' || food.type === 'poison') {
        this.moveFood(food);
      }
    });
  }

  moveFood(food) {
    const currentPos = { x: food.x, y: food.y };
    let nextPos = { ...currentPos };

    switch (food.direction) {
      case 'LEFT': nextPos.x -= 1; break;
      case 'RIGHT': nextPos.x += 1; break;
      case 'UP': nextPos.y -= 1; break;
      case 'DOWN': nextPos.y += 1; break;
    }

    // Check boundaries and collisions
    const hitWall = nextPos.x < 0 || nextPos.x >= this.state.gridWidth || 
                   nextPos.y < 0 || nextPos.y >= this.state.gridHeight;
    const hitObstacle = this.isPositionOccupied(nextPos.x, nextPos.y);

    if (hitWall || hitObstacle) {
      const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      food.direction = directions[Math.floor(Math.random() * 4)];
    } else {
      food.x = nextPos.x;
      food.y = nextPos.y;
    }

    // Random direction change
    const changeChance = food.type === 'poison' ? 0.2 : 0.1;
    if (Math.random() < changeChance) {
      const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      food.direction = directions[Math.floor(Math.random() * 4)];
    }
  }

  initializeFoods() {
    this.state.foods.clear();
    
    // Spawn initial foods
    this.spawnFood('static');
    this.spawnFood('temp');
    this.spawnFood('moving');
    this.spawnFood('weapon');
    this.spawnFood('armor');
  }

  spawnFood(type) {
    const position = this.getRandomFoodPosition();
    const food = new Food(position.x, position.y, type);
    
    if (type === 'moving' || type === 'poison') {
      const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      food.direction = directions[Math.floor(Math.random() * 4)];
    }

    this.state.foods.push(food);
  }

  setupFoodTimers() {
    // Temporary food respawn
    setInterval(() => {
      if (this.state.state === 'PLAYING') {
        this.spawnFood('temp');
      }
    }, 5000);

    // Weapon food respawn
    setInterval(() => {
      if (this.state.state === 'PLAYING') {
        this.spawnFood('weapon');
      }
    }, 15000);

    // Armor food respawn
    setInterval(() => {
      if (this.state.state === 'PLAYING') {
        this.spawnFood('armor');
      }
    }, 20000);

    // Poison food spawn/despawn
    setInterval(() => {
      if (this.state.state === 'PLAYING') {
        const hasPoison = this.state.foods.some(f => f.type === 'poison');
        if (!hasPoison) {
          this.spawnFood('poison');
          
          // Remove poison after 20 seconds
          setTimeout(() => {
            const poisonIndex = this.state.foods.findIndex(f => f.type === 'poison');
            if (poisonIndex !== -1) {
              this.state.foods.splice(poisonIndex, 1);
            }
          }, 20000);
        }
      }
    }, 30000);
  }

  endGameSession() {
    const alivePlayers = this.state.getAlivePlayers();
    const results = Array.from(this.state.players.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        rank: index + 1,
        isAlive: player.isAlive
      }));

    this.endGame(results);
  }

  getRandomSpawnPosition() {
    let position;
    let attempts = 0;
    do {
      position = {
        x: Math.floor(Math.random() * (this.state.gridWidth - 4)) + 2,
        y: Math.floor(Math.random() * (this.state.gridHeight - 4)) + 2
      };
      attempts++;
    } while (this.isPositionOccupied(position.x, position.y) && attempts < 50);

    return position;
  }

  getRandomFoodPosition() {
    let position;
    let attempts = 0;
    do {
      position = {
        x: Math.floor(Math.random() * this.state.gridWidth),
        y: Math.floor(Math.random() * this.state.gridHeight)
      };
      attempts++;
    } while (this.isPositionOccupied(position.x, position.y) && attempts < 50);

    return position;
  }

  isPositionOccupied(x, y) {
    // Check all players' snakes
    for (const player of this.state.players.values()) {
      if (player.isAlive && player.gameData && player.gameData.snake) {
        if (player.gameData.snake.some(segment => segment.x === x && segment.y === y)) {
          return true;
        }
      }
    }

    // Check food positions
    if (this.state.foods.some(food => food.x === x && food.y === y)) {
      return true;
    }

    return false;
  }

  getPlayersData() {
    return Array.from(this.state.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      score: player.score,
      isAlive: player.isAlive,
      isHost: player.isHost,
      isReady: player.isReady,
      gameData: player.gameData
    }));
  }
}

module.exports = { SnakeRoom };