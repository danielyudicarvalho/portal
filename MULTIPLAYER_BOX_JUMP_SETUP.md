# Multiplayer Box Jump Game Setup

The multiplayer box jump game has been successfully integrated into the game portal! Here's how to run it:

## Quick Start

### Option 1: Run all servers together (Recommended)
```bash
npm install
npm run dev:full
```

This will start:
- Next.js app on http://localhost:3000
- Snake game server on http://localhost:3001
- Box Jump game server on http://localhost:3003

### Option 2: Run servers separately
```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Snake game server
npm run dev:snake

# Terminal 3: Start Box Jump game server
npm run dev:box-jump
```

## How to Play

1. Open http://localhost:3000 in your browser
2. Navigate to Games → Multiplayer Games → Multiplayer Box Jump
3. Or go directly to http://localhost:3000/games/box-jump-multiplayer
4. **Important**: You need at least 5 players to start the game!
5. Share the URL with friends to join (minimum 5 players required)

## Game Features

### 🎮 Game Rules
- **Minimum Players**: 5 players must join before the game can start
- **Turn-Based**: Players take turns attempting each level one at a time
- **Level Progression**: Only players who complete the current level advance to the next
- **Round System**: All players must attempt the current level before moving forward
- **Winning**: Player who completes the most levels wins (fewer deaths breaks ties)

### 🕹️ Controls
- **Space Bar**: Jump over obstacles
- **Objective**: Reach the end of each level without hitting red cubes
- **Death**: Hitting a cube or falling resets you to the start of the level
- **Spectating**: Watch other players when it's not your turn

### 🏆 Competitive Features
- **20 Challenging Levels**: Increasing difficulty as you progress
- **Death Counter**: Track individual player performance
- **Live Spectating**: Watch other players attempt levels in real-time
- **Turn Management**: Automatic turn rotation and player queue
- **Final Rankings**: Based on levels completed and death count

## Technical Details

### Server Architecture
- **Frontend**: Next.js React app (port 3000)
- **Backend**: Express + Socket.IO server (port 3003)
- **Real-time Communication**: WebSocket connections for turn management
- **Game Engine**: Phaser.js 2.4.4 for physics and rendering

### File Structure
```
src/app/games/box-jump-multiplayer/page.tsx    # Game page component
public/games/box-jump-multiplayer/index.html   # Game HTML interface
public/games/box-jump-multiplayer/js/          # Client-side game logic
server/box-jump-server.js                      # WebSocket game server
```

### Dependencies
- `express`: Web server framework
- `socket.io`: Real-time WebSocket communication
- `phaser`: Game engine (loaded via CDN)

## Multiplayer Features

- **Turn-Based System**: Organized player queue with automatic rotation
- **Minimum Player Requirement**: Ensures competitive gameplay with 5+ players
- **Real-time Spectating**: Watch other players attempt levels
- **Session Management**: Handles player connections and disconnections
- **Level Synchronization**: All players attempt the same level before advancing
- **Performance Tracking**: Individual death counts and level completion

## Game States

1. **Lobby**: Players join and wait for minimum player count (5)
2. **Game**: Turn-based level attempts with real-time spectating
3. **Results**: Final rankings based on levels completed and performance

## Troubleshooting

### Game won't start
- Ensure at least 5 players have joined the lobby
- Check that the box jump server is running on port 3003
- Verify all players can connect to the same server

### Connection issues
- Make sure the box jump server is running
- Check that port 3003 is not blocked by firewall
- Verify the client is connecting to the correct server URL

### Performance issues
- The game uses Phaser.js for smooth physics and rendering
- Reduce browser tabs if experiencing lag
- Check browser console for JavaScript errors

### Port conflicts
- Change the box jump server port by setting `BOX_JUMP_PORT` environment variable
- Update the client connection URL in `multiplayer-game.js` if using a different port

## Development

### Adding new features
1. Server logic goes in `server/box-jump-server.js`
2. Client logic goes in `public/games/box-jump-multiplayer/js/multiplayer-game.js`
3. UI updates go in `src/app/games/box-jump-multiplayer/page.tsx`

### Testing multiplayer
- Open multiple browser tabs/windows (need 5+ total)
- Use different browsers or devices
- Test with friends on the same network
- Use browser dev tools to simulate different players

## Deployment

For production deployment:
1. Set up the box jump server on a cloud platform
2. Update the socket connection URL to point to your server
3. Configure proper CORS settings for your domain
4. Set up process management (PM2, Docker, etc.)
5. Ensure minimum 5 players can connect simultaneously

## Game Mechanics

### Level Design
- 20 pre-designed levels with increasing difficulty
- Red cubes are deadly obstacles to avoid
- Different platform types and jump challenges
- End goal at the right side of each level

### Turn System
- Players are queued automatically when joining
- Each player gets one attempt per level per round
- Turn advances automatically after attempt completion
- Spectators can watch the current player in real-time

### Winning Conditions
- Complete the most levels to win
- Tie-breaker: Fewer total deaths
- Game tracks individual performance statistics
- Final leaderboard shows comprehensive results

Enjoy the competitive multiplayer Box Jump experience! 📦🏆