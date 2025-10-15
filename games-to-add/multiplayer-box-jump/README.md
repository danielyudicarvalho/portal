# Multiplayer Box Jump Game

A multiplayer version of the classic Box Jump platformer game where players take turns attempting each level.

## Game Rules

1. **Minimum Players**: At least 5 players must join to start the game
2. **Turn-Based**: Players take turns attempting each level one at a time
3. **Level Progression**: Only players who successfully complete the current level can advance to the next one
4. **Round System**: All players must attempt the current level before moving to the next
5. **Winning**: The player who completes the most levels wins. In case of a tie, the player with fewer deaths wins

## How to Play

### Setup
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open your browser to `http://localhost:3000`
4. Have at least 5 players join the game

### Gameplay
- **Space Bar**: Jump over obstacles
- **Objective**: Reach the end of each level without hitting the red cubes
- **Death**: Hitting a cube or falling resets you to the start of the level
- **Spectating**: When it's not your turn, you can watch other players attempt the level

## Features

- **Real-time Multiplayer**: Built with Socket.io for instant communication
- **Turn Management**: Automatic turn rotation and player queue management
- **Live Spectating**: Watch other players attempt levels in real-time
- **Death Counter**: Track individual player performance
- **Level Progression**: 20 challenging levels with increasing difficulty
- **Responsive UI**: Clean interface showing game state and player information

## Technical Details

- **Backend**: Node.js with Express and Socket.io
- **Frontend**: HTML5, CSS3, JavaScript with Phaser.js 2.4.4
- **Real-time Communication**: WebSocket-based multiplayer synchronization
- **Game Physics**: Phaser.js arcade physics for jumping and collision detection

## Installation

```bash
# Clone or create the project directory
cd multiplayer-box-jump

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

## Game States

1. **Lobby**: Players join and wait for minimum player count
2. **Game**: Turn-based level attempts with real-time spectating
3. **Results**: Final rankings based on levels completed and death count

## Server Events

- `joinGame`: Player joins the lobby
- `startGame`: Initiates the game when minimum players are present
- `playerFinishedLevel`: Player completes their turn attempt
- `disconnect`: Handles player leaving mid-game

## Client Events

- `playersUpdate`: Updates player list and stats
- `newLevel`: Starts a new level for all players
- `playerTurn`: Indicates whose turn it is to play
- `gameCompleted`: Shows final results and rankings

Enjoy the multiplayer Box Jump experience! 🎮