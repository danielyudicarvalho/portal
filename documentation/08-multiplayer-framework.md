# Multiplayer Framework Documentation

## 🎮 Overview

The Game Portal multiplayer framework is built on Colyseus, providing a robust, scalable solution for real-time multiplayer gaming. This framework offers a unified experience across all multiplayer games with consistent room management, state synchronization, and player interactions.

## 🏗 Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Multiplayer SDK (JavaScript)  │  Game-Specific Clients    │
│  - Connection Management        │  - Snake Game Client      │
│  - Room Operations             │  - Box Jump Client        │
│  - Event Handling              │  - Custom Game Clients    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Colyseus Server Layer                       │
├─────────────────────────────────────────────────────────────┤
│           Multiplayer Server (Port 3002)                   │
│  - Room Management                                          │
│  - WebSocket Handling                                       │
│  - State Synchronization                                    │
│  - Matchmaking System                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Room Layer                               │
├─────────────────────────────────────────────────────────────┤
│  BaseGameRoom (Abstract)   │  Game-Specific Rooms          │
│  - Lifecycle Management    │  - SnakeRoom                  │
│  - Player Management       │  - BoxJumpRoom                │
│  - State Management        │  - Custom Game Rooms          │
│  - Event Handling          │                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Redis (Session & State)    │  PostgreSQL (Persistence)    │
│  - Room Presence           │  - User Data                  │
│  - Player Sessions         │  - Game Statistics            │
│  - Real-time State         │  - Match History              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Colyseus 0.15.x** - Multiplayer game server framework
- **WebSockets** - Real-time bidirectional communication
- **Redis** - Session management and scaling
- **Node.js** - Server runtime environment
- **TypeScript** - Type-safe development
- **Docker** - Containerized deployment

## 🎯 Game Lifecycle

### Universal Room States

All multiplayer games follow the same state machine:

```
LOBBY → COUNTDOWN → PLAYING → RESULTS → RESET
  ↑                                        │
  └────────────────────────────────────────┘
```

#### State Descriptions

1. **LOBBY** (Initial State)
   - Players join and leave freely
   - Players set ready status
   - Host can configure game settings
   - Minimum player requirement enforced
   - AFK detection active

2. **COUNTDOWN** (5 seconds)
   - 5-second countdown before game starts
   - No new players can join
   - Players cannot leave without penalty
   - Final preparations and loading

3. **PLAYING** (Active Gameplay)
   - Real-time game mechanics active
   - State synchronization at game-specific tick rates
   - Player actions processed and validated
   - Reconnection allowed within time window

4. **RESULTS** (Post-Game)
   - Final scores and rankings displayed
   - Statistics calculated and stored
   - Rematch voting system active
   - Achievement processing

5. **RESET** (Cleanup)
   - Return to LOBBY state
   - Reset all game-specific state
   - Preserve room and player connections
   - Prepare for next game session

### State Transition Rules

```typescript
// Valid state transitions
const VALID_TRANSITIONS = {
  LOBBY: ['COUNTDOWN'],
  COUNTDOWN: ['PLAYING', 'LOBBY'], // Can cancel countdown
  PLAYING: ['RESULTS'],
  RESULTS: ['LOBBY', 'RESET'],
  RESET: ['LOBBY']
};
```

## 🏠 Room Management

### BaseGameRoom Class

The foundation of all multiplayer rooms providing common functionality:

```typescript
abstract class BaseGameRoom extends Room {
  // Room lifecycle
  onCreate(options: any): void;
  onJoin(client: Client, options: any): void;
  onLeave(client: Client, consented: boolean): void;
  onMessage(client: Client, type: string, message: any): void;
  onDispose(): void;

  // Game lifecycle hooks (override in subclasses)
  abstract onGameStart(): void;
  abstract onGameReset(): void;
  abstract onGameMessage(client: Client, type: string, message: any): void;

  // Player management
  addPlayer(client: Client, options: any): Player;
  removePlayer(playerId: string): void;
  getPlayer(playerId: string): Player | undefined;
  setPlayerReady(playerId: string, ready: boolean): void;

  // Room state management
  startCountdown(): void;
  startGame(): void;
  endGame(results: GameResults): void;
  resetGame(): void;

  // Host management
  assignHost(): void;
  transferHost(newHostId: string): void;
  
  // Utility methods
  generateRoomCode(): string;
  broadcastToRoom(type: string, message: any): void;
  isRoomFull(): boolean;
  canStartGame(): boolean;
}
```

### Room Configuration

#### Room Options
```typescript
interface RoomOptions {
  gameId: string;           // Game identifier
  isPrivate: boolean;       // Private room with code
  maxPlayers: number;       // Maximum players allowed
  minPlayers: number;       // Minimum players to start
  gameSettings: any;        // Game-specific settings
  hostId?: string;          // Specific host assignment
  roomCode?: string;        // Custom room code
}
```

#### Room Metadata
```typescript
interface RoomMetadata {
  gameId: string;
  roomCode: string;
  isPrivate: boolean;
  state: GameState;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
  lastUpdate: number;
  hostId: string;
}
```

### Player Management

#### Player State Schema
```typescript
class Player extends Schema {
  @type('string') id: string;
  @type('string') name: string;
  @type('boolean') isReady: boolean = false;
  @type('boolean') isHost: boolean = false;
  @type('boolean') isConnected: boolean = true;
  @type('boolean') isAlive: boolean = true;
  @type('number') score: number = 0;
  @type('number') lastActivity: number;
  @type('any') gameData: any = {};
}
```

#### Player Operations
```typescript
// Add player to room
const player = this.addPlayer(client, {
  name: options.playerName || 'Anonymous',
  avatar: options.avatar
});

// Set player ready status
this.setPlayerReady(client.sessionId, true);

// Handle player disconnection
this.handleDisconnect(client.sessionId);

// Remove inactive players
this.removeInactivePlayers();
```

## 🎮 Game-Specific Implementations

### Snake Battle Room

#### Features
- **Real-time Movement**: 150ms tick rate for smooth gameplay
- **Combat System**: Projectile shooting and collision detection
- **Power-ups**: Food types with different effects
- **Session-based**: 5-minute game sessions
- **Spectator Mode**: Watch after elimination

#### State Schema
```typescript
class SnakeGameState extends BaseGameState {
  @type('number') gridWidth = 80;
  @type('number') gridHeight = 50;
  @type('number') tickRate = 150;
  @type({ map: SnakePlayer }) snakes = new MapSchema();
  @type([Food]) foods = new ArraySchema();
  @type([Projectile]) projectiles = new ArraySchema();
  @type('number') gameTime = 300; // 5 minutes
}

class SnakePlayer extends Player {
  @type([Position]) body = new ArraySchema();
  @type('string') direction = 'UP';
  @type('number') armor = 0;
  @type('boolean') hasShield = false;
  @type('number') kills = 0;
  @type('number') deaths = 0;
}
```

#### Game Messages
```typescript
// Player movement
room.send('move', { direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' });

// Shoot projectile
room.send('shoot', { 
  direction: 'UP',
  power: 1.0 
});

// Activate power-up
room.send('activate_armor');
room.send('activate_shield');
```

### Box Jump Challenge Room

#### Features
- **Turn-based Gameplay**: Players take turns attempting levels
- **Level Progression**: Increasing difficulty with elimination
- **Minimum Players**: Requires 5+ players to start
- **Performance Tracking**: Deaths and completion times
- **Spectator Queue**: Non-active players watch current player

#### State Schema
```typescript
class BoxJumpGameState extends BaseGameState {
  @type('number') currentLevel = 1;
  @type('number') currentPlayerIndex = 0;
  @type(['string']) playerQueue = new ArraySchema();
  @type(['string']) eliminatedPlayers = new ArraySchema();
  @type('number') turnTimeLimit = 60; // seconds
  @type('number') turnStartTime = 0;
}

class BoxJumpPlayer extends Player {
  @type('number') currentLevel = 1;
  @type('number') deaths = 0;
  @type('number') completionTime = 0;
  @type('boolean') isEliminated = false;
  @type('number') totalDeaths = 0;
}
```

#### Game Messages
```typescript
// Level completion
room.send('level_completed', { 
  time: completionTimeMs,
  deaths: deathCount 
});

// Player death
room.send('player_died', { 
  level: currentLevel,
  position: { x, y } 
});

// Skip turn (if allowed)
room.send('skip_turn');

// Ready for next turn
room.send('ready_next');
```

## 🔌 Client SDK

### MultiplayerSDK Class

#### Initialization
```typescript
import { MultiplayerSDK } from '/js/multiplayer-sdk.js';

const sdk = new MultiplayerSDK({
  serverUrl: 'ws://localhost:3002',
  debug: false,
  reconnectAttempts: 3,
  reconnectDelay: 1000
});
```

#### Room Operations
```typescript
// Create private room
const room = await sdk.createRoom('snake_game', {
  isPrivate: true,
  maxPlayers: 6,
  gameSettings: {
    difficulty: 'hard',
    powerUps: true
  }
});

// Quick match (join or create public room)
const room = await sdk.quickMatch('snake_game');

// Join private room by code
const room = await sdk.joinPrivateRoom('ABC123');

// Join specific room by ID
const room = await sdk.joinRoom('room-id-123');
```

#### Event Handling
```typescript
// Room events
sdk.on('room_joined', ({ roomId, roomCode, isHost, players }) => {
  console.log(`Joined room ${roomCode} as ${isHost ? 'host' : 'player'}`);
});

sdk.on('player_joined', (player) => {
  console.log(`${player.name} joined the room`);
});

sdk.on('player_left', (player) => {
  console.log(`${player.name} left the room`);
});

// Game lifecycle events
sdk.on('countdown_started', ({ countdown }) => {
  console.log(`Game starting in ${countdown} seconds`);
});

sdk.on('game_started', () => {
  console.log('Game started!');
});

sdk.on('game_ended', (results) => {
  console.log('Game ended:', results);
});

// Real-time game updates
sdk.on('game_update', (gameState) => {
  updateGameDisplay(gameState);
});

// Error handling
sdk.on('error', (error) => {
  console.error('Multiplayer error:', error);
});

sdk.on('disconnected', () => {
  console.log('Disconnected from server');
});
```

#### Game Actions
```typescript
// Universal actions
sdk.setReady(true);
sdk.startGame(); // Host only
sdk.rematch(true);
sdk.leaveRoom();

// Game-specific actions
sdk.sendGameMessage('move', { direction: 'UP' });
sdk.sendGameMessage('shoot', { target: { x: 100, y: 200 } });
sdk.sendGameMessage('level_completed', { time: 15000 });
```

### Game-Specific SDKs

#### Snake Game SDK
```typescript
class SnakeMultiplayerSDK extends MultiplayerSDK {
  // Movement controls
  move(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') {
    this.sendGameMessage('move', { direction });
  }

  // Combat actions
  shoot(direction?: string) {
    this.sendGameMessage('shoot', { direction });
  }

  // Power-up activation
  activateArmor() {
    this.sendGameMessage('activate_armor');
  }

  activateShield() {
    this.sendGameMessage('activate_shield');
  }

  // Game-specific events
  onSnakeUpdate(callback: (snakes: SnakeData[]) => void) {
    this.on('snakes_update', callback);
  }

  onFoodSpawned(callback: (food: FoodData) => void) {
    this.on('food_spawned', callback);
  }

  onPlayerKilled(callback: (killer: string, victim: string) => void) {
    this.on('player_killed', callback);
  }
}
```

#### Box Jump Game SDK
```typescript
class BoxJumpMultiplayerSDK extends MultiplayerSDK {
  // Level completion
  levelCompleted(time: number, deaths: number) {
    this.sendGameMessage('level_completed', { time, deaths });
  }

  // Player death
  playerDied(level: number, position: { x: number, y: number }) {
    this.sendGameMessage('player_died', { level, position });
  }

  // Turn management
  finishTurn() {
    this.sendGameMessage('turn_finished');
  }

  skipTurn() {
    this.sendGameMessage('skip_turn');
  }

  // Game-specific events
  onTurnChanged(callback: (currentPlayer: string, timeLeft: number) => void) {
    this.on('turn_changed', callback);
  }

  onLevelChanged(callback: (level: number) => void) {
    this.on('level_changed', callback);
  }

  onPlayerEliminated(callback: (player: string) => void) {
    this.on('player_eliminated', callback);
  }
}
```

## 🔄 State Synchronization

### Colyseus Schema System

#### Benefits
- **Efficient Serialization**: Only changed data is transmitted
- **Type Safety**: Schema validation prevents errors
- **Automatic Updates**: Client state updates automatically
- **Delta Compression**: Minimal bandwidth usage
- **Rollback Support**: Built-in state history

#### Schema Definition Example
```typescript
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

class GameState extends Schema {
  @type('string') gameId = '';
  @type('string') state = 'LOBBY';
  @type('number') countdown = 0;
  @type({ map: Player }) players = new MapSchema();
  @type('number') startTime = 0;
  @type('number') endTime = 0;
}

class Player extends Schema {
  @type('string') id = '';
  @type('string') name = '';
  @type('boolean') isReady = false;
  @type('boolean') isHost = false;
  @type('number') score = 0;
  @type('any') gameData = {};
}
```

#### Client State Handling
```typescript
// Listen for state changes
room.onStateChange((state) => {
  // Full state update (initial or after reconnection)
  updateGameUI(state);
});

// Listen for specific property changes
room.state.players.onAdd = (player, playerId) => {
  console.log(`Player ${player.name} joined`);
  addPlayerToUI(player);
};

room.state.players.onRemove = (player, playerId) => {
  console.log(`Player ${player.name} left`);
  removePlayerFromUI(playerId);
};

room.state.players.onChange = (player, playerId) => {
  console.log(`Player ${player.name} updated`);
  updatePlayerInUI(player);
};

// Listen for countdown changes
room.state.listen('countdown', (currentValue, previousValue) => {
  updateCountdownDisplay(currentValue);
});
```

### Performance Optimization

#### Tick Rate Configuration
```typescript
// Game-specific tick rates
const TICK_RATES = {
  snake_game: 150,      // 6.67 FPS - Real-time movement
  box_jump_game: 1000,  // 1 FPS - Turn-based updates
  lobby: 5000,          // 0.2 FPS - Slow updates for lobby
};

// Dynamic tick rate adjustment
setSimulationInterval((deltaTime) => {
  if (this.state.state === 'PLAYING') {
    this.updateGame(deltaTime);
  }
}, TICK_RATES[this.gameType]);
```

#### State Filtering
```typescript
// Send different state to different players
onMessage(client, type, message) {
  // Filter sensitive information
  const filteredState = this.getFilteredState(client.sessionId);
  client.send('state_update', filteredState);
}

// Spectator-specific state
getSpectatorState() {
  return {
    players: this.state.players,
    gameState: this.state.state,
    // Exclude sensitive data like player inputs
  };
}
```

## 🔐 Security & Validation

### Input Validation

#### Message Validation
```typescript
onMessage(client: Client, type: string, message: any) {
  // Validate message type
  if (!this.isValidMessageType(type)) {
    client.send('error', { message: 'Invalid message type' });
    return;
  }

  // Validate message content
  const validation = this.validateMessage(type, message);
  if (!validation.isValid) {
    client.send('error', { 
      message: 'Invalid message content',
      details: validation.errors 
    });
    return;
  }

  // Rate limiting
  if (this.isRateLimited(client.sessionId, type)) {
    client.send('error', { message: 'Rate limit exceeded' });
    return;
  }

  // Process valid message
  this.processMessage(client, type, message);
}
```

#### Anti-Cheat Measures
```typescript
// Server-side validation for game actions
validatePlayerMove(playerId: string, move: MoveData): boolean {
  const player = this.getPlayer(playerId);
  if (!player) return false;

  // Check if move is physically possible
  const timeSinceLastMove = Date.now() - player.lastMoveTime;
  if (timeSinceLastMove < this.minMoveInterval) {
    return false;
  }

  // Validate move direction and distance
  if (!this.isValidMoveDirection(move.direction)) {
    return false;
  }

  // Check collision with game boundaries
  if (!this.isWithinBounds(move.position)) {
    return false;
  }

  return true;
}
```

### Connection Security

#### Rate Limiting
```typescript
// Per-client rate limiting
class RateLimiter {
  private limits = new Map<string, { count: number, resetTime: number }>();

  isAllowed(clientId: string, action: string): boolean {
    const limit = this.getLimit(action);
    const now = Date.now();
    const clientLimit = this.limits.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      this.limits.set(clientId, { count: 1, resetTime: now + limit.window });
      return true;
    }

    if (clientLimit.count >= limit.max) {
      return false;
    }

    clientLimit.count++;
    return true;
  }
}
```

#### Authentication Integration
```typescript
// Verify user session on room join
async onAuth(client: Client, options: any) {
  try {
    // Verify session token
    const user = await this.verifyUserSession(options.sessionToken);
    if (!user) {
      throw new Error('Invalid session');
    }

    // Check user permissions
    if (user.isBanned) {
      throw new Error('User is banned');
    }

    return user;
  } catch (error) {
    throw new ServerError(401, error.message);
  }
}
```

## 📊 Monitoring & Analytics

### Room Monitoring

#### Health Metrics
```typescript
// Room health monitoring
getHealthMetrics() {
  return {
    roomId: this.roomId,
    gameId: this.metadata.gameId,
    state: this.state.state,
    playerCount: this.clients.length,
    maxPlayers: this.maxClients,
    uptime: Date.now() - this.createdAt,
    lastActivity: this.lastActivity,
    memoryUsage: process.memoryUsage(),
    messageCount: this.messageCount,
    errorCount: this.errorCount
  };
}
```

#### Performance Tracking
```typescript
// Track game performance
class PerformanceMonitor {
  private metrics = {
    tickTimes: [],
    messageLatency: [],
    playerCount: [],
    memoryUsage: []
  };

  recordTick(duration: number) {
    this.metrics.tickTimes.push(duration);
    if (this.metrics.tickTimes.length > 100) {
      this.metrics.tickTimes.shift();
    }
  }

  getAverageTickTime(): number {
    const times = this.metrics.tickTimes;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getPerformanceReport() {
    return {
      avgTickTime: this.getAverageTickTime(),
      avgLatency: this.getAverageLatency(),
      peakPlayers: Math.max(...this.metrics.playerCount),
      memoryTrend: this.getMemoryTrend()
    };
  }
}
```

### Analytics Integration

#### Game Statistics
```typescript
// Track game events for analytics
trackGameEvent(event: string, data: any) {
  const eventData = {
    roomId: this.roomId,
    gameId: this.metadata.gameId,
    event,
    data,
    timestamp: Date.now(),
    playerCount: this.clients.length
  };

  // Send to analytics service
  this.analyticsService.track(eventData);
}

// Usage examples
this.trackGameEvent('game_started', { 
  playerCount: this.clients.length,
  gameSettings: this.gameSettings 
});

this.trackGameEvent('player_eliminated', { 
  playerId: player.id,
  eliminatedBy: killer.id,
  gameTime: this.getGameTime() 
});
```

## 🚀 Deployment & Scaling

### Docker Configuration

#### Multiplayer Server Container
```dockerfile
# Dockerfile.multiplayer
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./server/
COPY public/js/multiplayer-sdk.js ./public/js/

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start server
CMD ["node", "server/multiplayer-server.js"]
```

#### Docker Compose Configuration
```yaml
# docker-compose.multiplayer.yml
version: '3.8'

services:
  multiplayer-server:
    build:
      context: .
      dockerfile: Dockerfile.multiplayer
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - MULTIPLAYER_PORT=3002
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis_data:
```

### Horizontal Scaling

#### Load Balancing
```nginx
# nginx.conf - Load balancing multiple multiplayer servers
upstream multiplayer_servers {
    least_conn;
    server multiplayer-server-1:3002;
    server multiplayer-server-2:3002;
    server multiplayer-server-3:3002;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /multiplayer {
        proxy_pass http://multiplayer_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Redis Clustering
```typescript
// Redis cluster configuration for scaling
import { RedisPresence } from '@colyseus/redis-presence';
import { RedisDriver } from '@colyseus/redis-driver';

const gameServer = new Server({
  // Use Redis for presence and driver
  presence: new RedisPresence({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  }),
  
  driver: new RedisDriver({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  })
});
```

## 🔧 Development Tools

### Testing Framework

#### Room Testing
```typescript
// test-room.js
const { ColyseusTestServer, Room } = require('@colyseus/testing');
const { SnakeRoom } = require('../server/rooms/SnakeRoom');

describe('SnakeRoom', () => {
  let colyseus;

  beforeEach(async () => {
    colyseus = new ColyseusTestServer();
    colyseus.define('snake_game', SnakeRoom);
  });

  afterEach(async () => {
    await colyseus.shutdown();
  });

  it('should create room and add players', async () => {
    const room = await colyseus.createRoom('snake_game', {});
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    expect(room.clients.length).toBe(2);
    expect(room.state.players.size).toBe(2);
  });

  it('should start game when all players ready', async () => {
    const room = await colyseus.createRoom('snake_game', {});
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    client1.send('ready', { isReady: true });
    client2.send('ready', { isReady: true });
    client1.send('start_game');

    await room.waitForNextPatch();
    expect(room.state.state).toBe('COUNTDOWN');
  });
});
```

#### Load Testing
```javascript
// load-test.js
const { Client } = require('colyseus.js');

async function loadTest() {
  const clients = [];
  const roomPromises = [];

  // Create 100 concurrent connections
  for (let i = 0; i < 100; i++) {
    const client = new Client('ws://localhost:3002');
    clients.push(client);
    
    roomPromises.push(
      client.joinOrCreate('snake_game', {
        playerName: `Player${i}`
      })
    );
  }

  try {
    const rooms = await Promise.all(roomPromises);
    console.log(`Successfully connected ${rooms.length} clients`);

    // Simulate gameplay for 60 seconds
    setTimeout(() => {
      clients.forEach(client => client.close());
      console.log('Load test completed');
    }, 60000);

  } catch (error) {
    console.error('Load test failed:', error);
  }
}

loadTest();
```

### Debugging Tools

#### Colyseus Monitor
```typescript
// Enable Colyseus monitor in development
import { monitor } from '@colyseus/monitor';

if (process.env.NODE_ENV !== 'production') {
  app.use('/colyseus', monitor());
}
```

#### Debug Logging
```typescript
// Enhanced logging for debugging
class DebugLogger {
  static log(room: Room, event: string, data: any) {
    if (process.env.DEBUG === 'true') {
      console.log(`[${room.roomId}] ${event}:`, JSON.stringify(data, null, 2));
    }
  }

  static error(room: Room, error: Error) {
    console.error(`[${room.roomId}] ERROR:`, error.message, error.stack);
  }

  static performance(room: Room, operation: string, duration: number) {
    if (duration > 100) { // Log slow operations
      console.warn(`[${room.roomId}] SLOW ${operation}: ${duration}ms`);
    }
  }
}
```

This comprehensive multiplayer framework documentation provides everything needed to understand, develop, and maintain the Game Portal's multiplayer functionality. The framework is designed to be extensible, allowing for easy addition of new game types while maintaining consistency and reliability across all multiplayer experiences.