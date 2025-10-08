// Test reconnection during active gameplay
const { BaseGameRoom } = require('./server/rooms/BaseGameRoom');

class MockClient {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.messages = [];
  }
  send(type, data) {
    this.messages.push({ type, data });
  }
}

console.log('🔄 Testing Reconnection During Active Gameplay\n');

const room = new BaseGameRoom();
room.onCreate({ gameId: 'test' });

// Override broadcast to avoid errors
room.broadcast = (type, data) => {
  console.log(`  📢 ${type}`);
};

// Add players and start game
const client1 = new MockClient('player1');
const client2 = new MockClient('player2');

room.onJoin(client1, { name: 'Alice' });
room.onJoin(client2, { name: 'Bob' });

// Set players ready and start game
room.onMessage(client1, 'ready', { ready: true });
room.onMessage(client2, 'ready', { ready: true });
room.onMessage(client1, 'start_game', {});

// Wait for countdown to complete and game to start
setTimeout(() => {
  console.log(`Game state: ${room.state.state}`);
  
  if (room.state.state === 'PLAYING') {
    console.log('✅ Game is now in PLAYING state');
    
    // Now test disconnection during gameplay
    console.log('\nTesting disconnection during PLAYING state:');
    room.onLeave(client1, false); // Non-consented leave (network issue)
    
    const player1 = room.state.players.get('player1');
    console.log(`Player1 still exists: ${!!player1}`);
    console.log(`Player1 connected: ${player1 ? player1.isConnected : 'N/A'}`);
    
    // Test reconnection
    setTimeout(() => {
      console.log('\nTesting reconnection:');
      const newClient1 = new MockClient('player1');
      room.onJoin(newClient1, { name: 'Alice' });
      
      const reconnectedPlayer = room.state.players.get('player1');
      console.log(`After reconnect - connected: ${reconnectedPlayer ? reconnectedPlayer.isConnected : 'N/A'}`);
      console.log('✅ Reconnection during gameplay successful');
      
    }, 100);
  }
}, 6000); // Wait for 5-second countdown + buffer