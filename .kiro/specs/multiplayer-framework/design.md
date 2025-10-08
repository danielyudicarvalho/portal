# Multiplayer Framework Design Document

## Overview

This document describes the technical design for implementing a comprehensive multiplayer framework using Colyseus. The framework provides a unified architecture for all multiplayer games with consistent room management, real-time synchronization, and scalable infrastructure.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   NGINX Proxy   │    │   Redis Cache   │
│  (React/HTML)   │◄──►│  (Production)   │◄──►│   (Scaling)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Multiplayer    │    │   Next.js App   │    │  Docker Stack   │
│     SDK         │◄──►│   (Frontend)    │◄──►│ (Containers)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Colyseus Server                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ GameLobby   │  │ SnakeRoom   │  │ BoxJumpRoom │  ...       │
│  │ (Matching)  │  │ (Realtime)  │  │ (Turn-based)│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              BaseGameRoom                               │   │
│  │         (Shared Room Logic)                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Relationships

1. **Client Layer**: React components and HTML5 games using the unified SDK
2. **Proxy Layer**: NGINX for production routing and rate limiting
3. **Application Layer**: Next.js frontend serving the game portal
4. **Multiplayer Layer**: Colyseus server handling real-time multiplayer logic
5. **Data Layer**: Redis for presence management and scaling
6. **Infrastructure Layer**: Docker containers for deployment

## Components and Interfaces

### Core Server Components

#### 1. Multiplayer Server (`server/multiplayer-server.js`)

**Purpose**: Main Colyseus server instance that manages all multiplayer rooms

**Interface**:
```javascript
class MultiplayerServer {
  // Server lifecycle
  initialize(port: number): void
  registerRooms(): void
  setupMiddleware(): void
  
  // Health and monitoring
  getHealthStatus(): HealthStatus
  getActiveRooms(): RoomInfo[]
  getPlayerCount(): number
}
```

**Responsibilities**:
- Initialize Colyseus server with WebSocket transport
- Register all room types (lobby, snake, box-jump)
- Provide health check and monitoring endpoints
- Handle CORS and security middleware

#### 2. BaseGameRoom (`server/rooms/BaseGameRoom.js`)

**Purpose**: Abstract base class providing common multiplayer room functionality

**Interface**:
```javascript
abstract class BaseGameRoom extends Room {
  // Room lifecycle (implemented)
  onCreate(options: RoomOptions): void
  onJoin(client: Client, options: JoinOptions): void
  onLeave(client: Client, consented: boolean): void
  onMessage(client: Client, type: string, message: any): void
  onDispose(): void
  
  // Game lifecycle (abstract - override in subclasses)
  abstract onGameStart(): void
  abstract onGameReset(): void
  abstract onGameMessage(client: Client, type: string, message: any): void
  
  // Player management (implemented)
  handleReconnect(client: Client, player: Player): void
  handleDisconnect(playerId: string): void
  removePlayer(playerId: string): void
  
  // Room state management (implemented)
  startCountdown(): void
  startGame(): void
  endGame(results: GameResult[]): void
  resetGame(): void
}
```

**State Management**:
```javascript
class BaseGameState extends Schema {
  @type('string') gameId: string
  @type('string') roomCode: string
  @type('string') state: RoomState // LOBBY | COUNTDOWN | PLAYING | RESULTS
  @type({ map: Player }) players: MapSchema<Player>
  @type('number') minPlayers: number
  @type('number') maxPlayers: number
  @type('number') countdown: number
  @type('number') gameStartTime: number
  @type('number') gameEndTime: number
}
```

#### 3. GameLobby (`server/rooms/GameLobby.js`)

**Purpose**: Central matchmaking hub for room discovery and creation

**Interface**:
```javascript
class GameLobby extends Room {
  // Matchmaking
  createRoom(gameId: string, options: CreateRoomOptions): Promise<string>
  joinRoom(roomId: string): Promise<void>
  joinPrivateRoom(roomCode: string): Promise<void>
  quickMatch(gameId: string): Promise<string>
  
  // Room monitoring
  getActiveRooms(): ActiveRoom[]
  trackRoom(roomId: string, gameInfo: GameInfo): void
  removeRoom(roomId: string): void
}
```

**State Schema**:
```javascript
class LobbyState extends Schema {
  @type({ map: GameInfo }) availableGames: MapSchema<GameInfo>
  @type({ map: ActiveRoom }) activeRooms: MapSchema<ActiveRoom>
  @type('number') playerCount: number
}
```

### Game-Specific Implementations

#### 4. SnakeRoom (`server/rooms/SnakeRoom.js`)

**Purpose**: Real-time multiplayer Snake game with combat features

**Game Loop**:
```javascript
class SnakeRoom extends BaseGameRoom {
  // Game mechanics
  updateGame(): void {
    this.moveSnakes()
    this.moveProjectiles()
    this.moveFoods()
    this.checkCollisions()
    this.broadcastUpdate()
  }
  
  // Player actions
  handleMove(playerId: string, direction: Direction): void
  handleShoot(playerId: string): void
  handleActivateArmor(playerId: string): void
}
```

**State Extensions**:
```javascript
class SnakeGameState extends BaseGameState {
  @type('number') gridWidth: number = 80
  @type('number') gridHeight: number = 50
  @type([Food]) foods: ArraySchema<Food>
  @type([Projectile]) projectiles: ArraySchema<Projectile>
  @type('number') sessionDuration: number = 300000 // 5 minutes
}
```

#### 5. BoxJumpRoom (`server/rooms/BoxJumpRoom.js`)

**Purpose**: Turn-based multiplayer platformer with elimination mechanics

**Turn Management**:
```javascript
class BoxJumpRoom extends BaseGameRoom {
  // Turn system
  nextTurn(): void
  setCurrentPlayer(): void
  checkRoundComplete(): void
  
  // Level progression
  handleLevelCompleted(playerId: string): void
  handlePlayerDied(playerId: string): void
  advanceLevel(): void
}
```

**State Extensions**:
```javascript
class BoxJumpGameState extends BaseGameState {
  @type('number') currentLevel: number = 1
  @type('number') maxLevels: number = 20
  @type('number') currentPlayerIndex: number = 0
  @type(['string']) playerQueue: ArraySchema<string>
}
```

### Client Components

#### 6. Multiplayer SDK (`public/js/multiplayer-sdk.js`)

**Purpose**: Unified client interface for all multiplayer games

**Core Interface**:
```javascript
class MultiplayerSDK {
  // Connection management
  async createRoom(gameId: string, options: CreateOptions): Promise<string>
  async joinRoom(roomId: string, options: JoinOptions): Promise<string>
  async joinPrivateRoom(roomCode: string, options: JoinOptions): Promise<string>
  async quickMatch(gameId: string, options: MatchOptions): Promise<string>
  
  // Room actions
  setReady(ready: boolean): void
  startGame(): void
  leaveRoom(): void
  rematch(): void
  
  // Game communication
  sendGameMessage(type: string, data: any): void
  
  // Event system
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, data: any): void
}
```

**Game-Specific Extensions**:
```javascript
class SnakeMultiplayerSDK extends MultiplayerSDK {
  move(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void
  shoot(): void
  activateArmor(): void
}

class BoxJumpMultiplayerSDK extends MultiplayerSDK {
  levelCompleted(): void
  playerDied(): void
  finishTurn(): void
}
```

## Data Models

### Player Model

```javascript
class Player extends Schema {
  @type('string') id: string              // Session ID
  @type('string') name: string            // Display name
  @type('boolean') isReady: boolean       // Ready status
  @type('boolean') isHost: boolean        // Host privileges
  @type('number') score: number           // Current score
  @type('boolean') isAlive: boolean       // Alive in game
  @type('boolean') isConnected: boolean   // Connection status
  @type('number') lastActivity: number    // AFK detection
  @type('object') gameData: any           // Game-specific data
}
```

### Room Model

```javascript
interface RoomOptions {
  gameId: string
  isPrivate: boolean
  minPlayers: number
  maxPlayers: number
  settings: Record<string, any>
}

interface ActiveRoom {
  roomId: string
  roomCode: string
  gameId: string
  playerCount: number
  maxPlayers: number
  state: RoomState
  isPrivate: boolean
  createdAt: number
}
```

### Game State Models

#### Snake Game Data
```javascript
class SnakeSegment extends Schema {
  @type('number') x: number
  @type('number') y: number
}

class Food extends Schema {
  @type('number') x: number
  @type('number') y: number
  @type('string') type: FoodType // static | temp | moving | weapon | armor | poison
  @type('string') direction: Direction
}

class Projectile extends Schema {
  @type('string') id: string
  @type('number') x: number
  @type('number') y: number
  @type('string') direction: Direction
  @type('string') playerId: string
}
```

#### Box Jump Game Data
```javascript
interface PlayerProgress {
  level: number
  deaths: number
  completed: boolean
}

interface LevelAttempt {
  playerId: string
  level: number
  success: boolean
  deaths: number
}
```

## Error Handling

### Client-Side Error Handling

```javascript
class MultiplayerSDK {
  private handleError(error: Error, context: string): void {
    console.error(`Multiplayer Error [${context}]:`, error)
    this.emit('error', { 
      message: error.message, 
      context,
      timestamp: Date.now() 
    })
  }
  
  private setupErrorHandlers(): void {
    this.room?.onError((code, message) => {
      this.handleError(new Error(message), `Room Error ${code}`)
    })
  }
}
```

### Server-Side Error Handling

```javascript
class BaseGameRoom extends Room {
  onMessage(client: Client, type: string, message: any): void {
    try {
      // Validate message
      if (!this.validateMessage(type, message)) {
        throw new Error(`Invalid message: ${type}`)
      }
      
      // Process message
      this.processMessage(client, type, message)
      
    } catch (error) {
      console.error(`Room Error [${this.roomId}]:`, error)
      client.send('error', { 
        message: 'Invalid action',
        code: 'INVALID_MESSAGE'
      })
    }
  }
}
```

### Network Error Recovery

```javascript
// Automatic reconnection with exponential backoff
class ConnectionManager {
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  
  async reconnect(): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    setTimeout(async () => {
      try {
        await this.sdk.connect()
        this.reconnectAttempts = 0
      } catch (error) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          this.reconnect()
        }
      }
    }, delay)
  }
}
```

## Testing Strategy

### Unit Testing

**Server-Side Tests**:
```javascript
describe('BaseGameRoom', () => {
  test('should transition from LOBBY to COUNTDOWN when game starts', () => {
    const room = new TestGameRoom()
    room.onCreate({ gameId: 'test' })
    
    // Add players and set ready
    room.addTestPlayer('player1', { isHost: true })
    room.addTestPlayer('player2')
    room.setPlayerReady('player1', true)
    room.setPlayerReady('player2', true)
    
    // Start game
    room.startCountdown()
    
    expect(room.state.state).toBe('COUNTDOWN')
    expect(room.state.countdown).toBe(5)
  })
})
```

**Client-Side Tests**:
```javascript
describe('MultiplayerSDK', () => {
  test('should emit room_joined event when joining room', async () => {
    const sdk = new MultiplayerSDK({ serverUrl: 'ws://test' })
    const joinedHandler = jest.fn()
    
    sdk.on('room_joined', joinedHandler)
    await sdk.joinRoom('test-room-id')
    
    expect(joinedHandler).toHaveBeenCalledWith({
      playerId: expect.any(String),
      roomCode: expect.any(String),
      isHost: expect.any(Boolean)
    })
  })
})
```

### Integration Testing

**Room Lifecycle Tests**:
```javascript
describe('Room Integration', () => {
  test('complete game flow from lobby to results', async () => {
    // Create room and add players
    const room = await createTestRoom('snake')
    const players = await addTestPlayers(room, 4)
    
    // Set all players ready
    await setAllPlayersReady(players)
    
    // Start game
    await startGame(room)
    expect(room.state.state).toBe('PLAYING')
    
    // Simulate gameplay
    await simulateGameplay(room, players, 30000) // 30 seconds
    
    // End game
    await endGame(room)
    expect(room.state.state).toBe('RESULTS')
    expect(room.state.results).toHaveLength(4)
  })
})
```

### Load Testing

**Concurrent Room Testing**:
```javascript
describe('Load Testing', () => {
  test('should handle 100 concurrent rooms', async () => {
    const rooms = []
    
    // Create 100 rooms concurrently
    for (let i = 0; i < 100; i++) {
      rooms.push(createTestRoom('snake'))
    }
    
    const createdRooms = await Promise.all(rooms)
    expect(createdRooms).toHaveLength(100)
    
    // Verify all rooms are functional
    for (const room of createdRooms) {
      expect(room.state.state).toBe('LOBBY')
    }
  })
})
```

### Performance Testing

**Latency Measurement**:
```javascript
class PerformanceMonitor {
  measureLatency(): void {
    const start = performance.now()
    
    this.sdk.sendGameMessage('ping', { timestamp: start })
    
    this.sdk.on('pong', ({ timestamp }) => {
      const latency = performance.now() - timestamp
      console.log(`Latency: ${latency}ms`)
    })
  }
}
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    
  nextjs-app:
    build: 
      dockerfile: Dockerfile.nextjs
    ports: ["3000:3000"]
    volumes: [".:/app"]
    
  multiplayer-server:
    build:
      dockerfile: Dockerfile.multiplayer
      target: dev
    ports: ["3002:3002"]
    volumes: [".:/app"]
```

### Production Environment

```yaml
# docker-compose.multiplayer.yml
services:
  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
    
  multiplayer-server:
    build:
      dockerfile: Dockerfile.multiplayer
      target: runner
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]
```

### Scaling Strategy

**Horizontal Scaling with Redis**:
```javascript
// server/multiplayer-server.js
const gameServer = new Server({
  presence: new RedisPresence({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }),
  driver: new RedisDriver({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  })
})
```

**Load Balancer Configuration**:
```nginx
upstream multiplayer_backend {
  server multiplayer-server-1:3002;
  server multiplayer-server-2:3002;
  server multiplayer-server-3:3002;
}

server {
  location / {
    proxy_pass http://multiplayer_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

This design provides a robust, scalable foundation for multiplayer gaming with clear separation of concerns, comprehensive error handling, and production-ready deployment strategies.