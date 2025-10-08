# Multiplayer Framework Guide

## Overview

This document describes the comprehensive multiplayer framework built for the game portal using Colyseus. The framework provides a unified system for all multiplayer games with consistent features across different game types.

## Architecture

### Core Components

1. **Colyseus Server** (`server/multiplayer-server.js`)
   - Main multiplayer server handling WebSocket connections
   - Room management and matchmaking
   - Game state synchronization

2. **Base Game Room** (`server/rooms/BaseGameRoom.js`)
   - Abstract base class for all game rooms
   - Handles common multiplayer features (lobby, countdown, results, etc.)
   - Provides lifecycle management

3. **Game Lobby** (`server/rooms/GameLobby.js`)
   - Central matchmaking hub
   - Room discovery and creation
   - Quick match functionality

4. **Client SDK** (`public/js/multiplayer-sdk.js`)
   - Unified client interface for all games
   - Event-driven architecture
   - Game-specific extensions

### Room Lifecycle

All multiplayer games follow the same lifecycle:

```
LOBBY → COUNTDOWN → PLAYING → RESULTS → RESET/REMATCH
```

#### States Explained

- **LOBBY**: Players join, set ready status, host can start
- **COUNTDOWN**: 5-second countdown before game starts
- **PLAYING**: Active gameplay with real-time synchronization
- **RESULTS**: Show final scores and rankings
- **RESET**: Return to lobby for rematch or new players

## Features

### 🎮 Universal Features (All Games)

- **Authentication Integration**: Works with existing auth system
- **Lobby System**: Join/create rooms, ready status, host controls
- **Matchmaking**: Quick match, private rooms with codes, public room browser
- **Room Lifecycle**: Consistent state management across all games
- **Reconnection**: 30-second reconnection window with state preservation
- **AFK Detection**: Automatic removal of inactive players
- **Real-time Sync**: 60fps client updates, optimized server tick rates
- **Results & Rematch**: Comprehensive scoring and rematch voting

### 🔒 Room Management

- **Public Rooms**: Discoverable through matchmaking
- **Private Rooms**: 6-character room codes for friends
- **Host Migration**: Automatic host reassignment on disconnect
- **Player Limits**: Configurable min/max players per game
- **Room Persistence**: Rooms stay alive during player reconnections

### 📊 Monitoring & Analytics

- **Health Checks**: Server status monitoring
- **Room Statistics**: Active rooms, player counts
- **Performance Metrics**: Connection quality, latency tracking
- **Error Handling**: Comprehensive error reporting and recovery

## Game Integration

### Creating a New Multiplayer Game

1. **Create Game Room Class**:
```javascript
const { BaseGameRoom } = require('./BaseGameRoom');

class MyGameRoom extends BaseGameRoom {
  onCreate(options = {}) {
    super.onCreate(options);
    // Game-specific initialization
  }

  onGameMessage(client, type, message) {
    // Handle game-specific messages
  }

  onGameStart() {
    // Game-specific start logic
  }

  onGameReset() {
    // Game-specific reset logic
  }
}
```

2. **Register Room Type**:
```javascript
// In multiplayer-server.js
gameServer.define('my_game', MyGameRoom);
```

3. **Create Client Integration**:
```javascript
class MyGameSDK extends MultiplayerSDK {
  // Game-specific client methods
  performGameAction(data) {
    this.sendGameMessage('game_action', data);
  }
}
```

### Existing Game Examples

#### Snake Battle (`SnakeRoom`)
- Real-time movement synchronization
- Combat system with projectiles
- Power-ups and special foods
- Session-based gameplay (5-minute rounds)

#### Box Jump Challenge (`BoxJumpRoom`)
- Turn-based gameplay
- Level progression system
- Elimination mechanics
- Performance tracking

## Client SDK Usage

### Basic Setup

```javascript
// Initialize SDK
const sdk = new MultiplayerSDK({
  serverUrl: 'ws://localhost:3002'
});

// Set up event handlers
sdk.on('room_joined', ({ playerId, roomCode, isHost }) => {
  console.log(`Joined room ${roomCode} as ${isHost ? 'host' : 'player'}`);
});

sdk.on('game_started', () => {
  console.log('Game started!');
});

sdk.on('game_update', (gameState) => {
  // Update game visuals
  updateGameDisplay(gameState);
});
```

### Room Management

```javascript
// Create private room
await sdk.createRoom('snake', { 
  isPrivate: true,
  settings: { difficulty: 'hard' }
});

// Quick match
await sdk.quickMatch('snake');

// Join private room
await sdk.joinPrivateRoom('ABC123');

// Set ready status
sdk.setReady(true);

// Start game (host only)
sdk.startGame();
```

### Game-Specific Actions

```javascript
// Snake game
const snakeSDK = new SnakeMultiplayerSDK();
snakeSDK.move('UP');
snakeSDK.shoot();
snakeSDK.activateArmor();

// Box Jump game
const boxJumpSDK = new BoxJumpMultiplayerSDK();
boxJumpSDK.levelCompleted();
boxJumpSDK.playerDied();
boxJumpSDK.finishTurn();
```

## Server Configuration

### Environment Variables

```bash
# Server Configuration
MULTIPLAYER_PORT=3002
NODE_ENV=production

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGIN=https://yourdomain.com
```

### Docker Deployment

```bash
# Development
docker-compose -f docker-compose.multiplayer.yml up -d

# Production
docker-compose -f docker-compose.multiplayer.yml -f docker-compose.prod.yml up -d
```

### NGINX Configuration

The included `nginx.conf` provides:
- WebSocket proxy with proper headers
- Rate limiting for API and WebSocket connections
- SSL termination (configure certificates)
- Health check routing

## Performance Optimization

### Server-Side

- **Tick Rates**: Optimized per game type (Snake: 150ms, Box Jump: event-driven)
- **State Compression**: Efficient serialization with Colyseus schemas
- **Connection Pooling**: Redis for presence and state management
- **Memory Management**: Automatic room disposal and cleanup

### Client-Side

- **Interpolation**: Smooth movement between server updates
- **Prediction**: Client-side prediction for responsive controls
- **Batching**: Efficient message batching for high-frequency actions
- **Reconnection**: Automatic reconnection with exponential backoff

## Security Features

### Rate Limiting
- API endpoints: 10 requests/second per IP
- WebSocket connections: 5 connections/second per IP
- Message throttling: Game-specific limits

### Input Validation
- All client messages validated server-side
- State integrity checks
- Anti-cheat measures for competitive games

### Connection Security
- CORS configuration for production
- WebSocket origin validation
- SSL/TLS encryption in production

## Monitoring & Debugging

### Health Endpoints

```bash
# Server health
GET /health

# Game information
GET /games

# Room statistics (if monitoring enabled)
GET /stats
```

### Logging

The framework provides comprehensive logging:
- Connection events
- Room lifecycle events
- Game-specific events
- Error tracking with stack traces

### Development Tools

- **Colyseus Monitor**: Built-in room monitoring at `/colyseus`
- **Debug Mode**: Detailed client-server message logging
- **Performance Profiling**: Built-in timing and memory usage tracking

## Migration from Socket.IO

For existing games using Socket.IO (like the current Snake and Box Jump games):

1. **Keep Existing Games**: Old implementations continue to work
2. **Gradual Migration**: Move games one by one to the new framework
3. **Feature Parity**: All existing features are supported
4. **Enhanced Features**: Gain additional features like reconnection, better matchmaking

### Migration Steps

1. Create new room class extending `BaseGameRoom`
2. Port game logic to Colyseus schemas
3. Update client to use new SDK
4. Test thoroughly with multiple players
5. Deploy alongside existing implementation
6. Gradually redirect traffic to new implementation

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check server is running on correct port
   - Verify WebSocket URL format
   - Check CORS configuration

2. **Room Not Found**
   - Verify room code is correct
   - Check if room has expired
   - Ensure game type is registered

3. **Sync Issues**
   - Check network connectivity
   - Verify client-server message handling
   - Review state update frequency

### Debug Mode

Enable debug logging:
```javascript
const sdk = new MultiplayerSDK({
  serverUrl: 'ws://localhost:3002',
  debug: true
});
```

## Future Enhancements

### Planned Features

- **Spectator Mode**: Watch games in progress
- **Tournament System**: Bracket-style competitions
- **Replay System**: Record and playback games
- **Advanced Analytics**: Player statistics and game metrics
- **Mobile SDK**: React Native integration
- **Voice Chat**: Integrated voice communication

### Scalability

- **Horizontal Scaling**: Multiple server instances with Redis
- **Geographic Distribution**: Regional servers for lower latency
- **Load Balancing**: Intelligent room distribution
- **Database Integration**: Persistent player statistics and rankings

## Support

For issues, questions, or contributions:

1. Check the troubleshooting section
2. Review existing game implementations
3. Test with the provided examples
4. Check server logs for detailed error information

The framework is designed to be extensible and maintainable, providing a solid foundation for any multiplayer game in the portal.