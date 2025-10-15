# Online Multiplayer Snake Game 🐍

A real-time multiplayer snake game inspired by Slither.io, built with Phaser 3, Node.js, and Socket.IO.

## Features

🌐 **Online Multiplayer**: Up to 8 players from different computers  
🎮 **Real-time Gameplay**: Smooth WebSocket-based synchronization  
🍎 **Three Food Types**:
- 🔴 Static Food (10 points) - Stays until eaten
- 🟠 Temporary Food (15 points) - Disappears after 5 seconds  
- 🔵 Moving Food (25 points) - Moves around the field

🏆 **Competitive Features**:
- Live leaderboard
- Individual scoring
- Winner detection
- Auto-restart after game over

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Play the Game
Open your browser and go to: `http://localhost:3000`

Share this URL with friends so they can join from their computers!

## Controls

- **WASD** or **Arrow Keys** to move your snake
- Avoid walls and your own tail
- **Attack smaller snakes** by colliding with them
- Eat food to grow and increase your score

## Game Rules

1. **Survival**: Don't hit walls or your own tail
2. **Growth**: Eat food to grow longer and score points
3. **Combat**: Bigger snakes kill smaller snakes on collision
4. **Kill Bonus**: Earn 2 points per segment of defeated opponents
5. **Victory**: Be the last snake standing
6. **Restart**: Games automatically restart after 5 seconds

## Technical Details

### Server (Node.js + Socket.IO)
- Real-time player synchronization
- Server-side game state management
- Collision detection and food spawning
- Automatic game reset system

### Client (Phaser 3 + WebSockets)
- Smooth rendering and animations
- Real-time input handling
- Live leaderboard updates
- Connection status monitoring

## Development

### Start Development Server
```bash
npm run dev
```

This uses nodemon for automatic server restarts during development.

### Project Structure
```
snake-game/
├── server.js          # Node.js WebSocket server
├── game.js            # Phaser 3 client game logic
├── index.html         # Game interface
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Deployment

### Local Network
To play with friends on the same network:
1. Find your local IP address
2. Start the server: `npm start`
3. Share `http://YOUR_IP:3000` with friends

### Cloud Deployment
Deploy to platforms like:
- Heroku
- Railway
- DigitalOcean
- AWS

Make sure to set the PORT environment variable for cloud deployment.

## Game Mechanics

### Food System
- **Static Food**: Permanent until eaten, worth 10 points
- **Temporary Food**: Respawns every 5 seconds, worth 15 points  
- **Moving Food**: AI-controlled movement, worth 25 points

### Collision System
- Wall collision: Instant death
- Self collision: Instant death
- Player collision: **Bigger snake kills smaller snake** (Slither.io style)
- Head-to-head collision: Longer snake wins, equal length = both die
- Food collision: Growth + points
- Kill bonus: Earn 2 points per segment of defeated snake

### Multiplayer Features
- Up to 8 simultaneous players
- Unique colors for each player
- Real-time score tracking
- Automatic game management

## Browser Compatibility

Works in all modern browsers that support:
- WebSockets
- HTML5 Canvas
- ES6 JavaScript

Tested on Chrome, Firefox, Safari, and Edge.

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this code for your own projects.

---

**Have fun playing! 🎮**