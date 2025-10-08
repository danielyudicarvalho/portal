# Multiplayer Snake Game Setup

The multiplayer snake game has been successfully integrated into the game portal! Here's how to run it:

## Quick Start

### Option 1: Run both servers together (Recommended)
```bash
npm install
npm run dev:full
```

This will start:
- Next.js app on http://localhost:3000
- Snake game server on http://localhost:3001

### Option 2: Run servers separately
```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Snake game server
npm run dev:snake
```

## How to Play

1. Open http://localhost:3000 in your browser
2. Navigate to Games → Multiplayer Games → Multiplayer Snake Battle
3. Or go directly to http://localhost:3000/games/snake-multiplayer
4. Share the URL with friends to play together (up to 8 players)

## Game Features

### 🎮 Controls
- **WASD** or **Arrow Keys**: Move your snake
- **X**: Shoot projectile (costs 5 points)
- **Z**: Activate armor (costs 5 points, lasts 10 seconds)
- **R**: Respawn when dead (during active session)

### 🍎 Food Types
- **Red**: Static food (+10 points)
- **Orange**: Temporary food (+15 points, respawns every 5s)
- **Blue**: Moving food (+25 points, moves around)
- **Purple ⚡**: Weapon food (+5 points, +1 shot)
- **Gray 🛡️**: Armor food (+5 points, +1 armor)
- **Dark Red ☠️**: Poison food (DEADLY! Moves around, lasts 20s)

### ⚔️ Combat System
- Bigger snakes kill smaller snakes on collision
- Earn 2 points per segment of defeated opponents
- Shooting costs 5 points but gives 20 points for successful hits
- Armor protects from collisions and projectiles
- Poison food kills instantly (no armor protection!)

### 🕐 Session System
- Each session lasts 5 minutes
- Players can respawn during active sessions
- Winner is determined by highest score
- New sessions start automatically after 10 seconds

## Technical Details

### Server Architecture
- **Frontend**: Next.js React app (port 3000)
- **Backend**: Express + Socket.IO server (port 3001)
- **Real-time Communication**: WebSocket connections
- **Game Loop**: 150ms tick rate for smooth gameplay

### File Structure
```
src/app/games/snake-multiplayer/page.tsx    # Game page component
public/games/snake-multiplayer/index.html   # Game HTML
public/games/snake-multiplayer/game.js      # Client-side game logic
server/snake-server.js                      # WebSocket game server
```

### Dependencies Added
- `express`: Web server framework
- `socket.io`: Real-time WebSocket communication
- `concurrently`: Run multiple npm scripts simultaneously

## Multiplayer Features

- **Up to 8 players** can join simultaneously
- **Real-time synchronization** of all game elements
- **Unique colors** for each player
- **Live leaderboard** with scores, length, shots, and armor
- **Session management** with automatic restarts
- **Respawn system** during active sessions
- **Connection status** monitoring

## Troubleshooting

### Game won't connect
- Make sure the snake server is running on port 3001
- Check that both servers are started
- Verify no firewall is blocking the ports

### Performance issues
- The game runs at 150ms intervals for optimal performance
- Reduce the number of players if experiencing lag
- Check browser console for any JavaScript errors

### Port conflicts
- Change the snake server port by setting `SNAKE_PORT` environment variable
- Update the client connection URL in `game.js` if using a different port

## Development

### Adding new features
1. Server logic goes in `server/snake-server.js`
2. Client logic goes in `public/games/snake-multiplayer/game.js`
3. UI updates go in `src/app/games/snake-multiplayer/page.tsx`

### Testing multiplayer
- Open multiple browser tabs/windows
- Use different browsers
- Test with friends on the same network
- Use browser dev tools to simulate different network conditions

## Deployment

For production deployment:
1. Set up the snake server on a cloud platform
2. Update the socket connection URL to point to your server
3. Configure proper CORS settings
4. Set up process management (PM2, Docker, etc.)

Enjoy the multiplayer snake battle! 🐍⚔️