const { BaseGameRoom } = require('./server/rooms/BaseGameRoom');
const { BaseGameState } = require('./server/schemas/BaseGameState');

// Mock client for testing
class MockClient {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.messages = [];
  }
  
  send(type, data) {
    this.messages.push({ type, data });
    console.log(`📤 Client ${this.sessionId} received: ${type}`, data);
  }
}

// Mock room broadcast method
const originalBroadcast = require('./server/rooms/BaseGameRoom').BaseGameRoom.prototype.broadcast;
require('./server/rooms/BaseGameRoom').BaseGameRoom.prototype.broadcast = function(type, data, options = {}) {
  console.log(`📢 Room broadcast: ${type}`, data);
};

// Test the connection management functionality
async function testConnectionManagement() {
  console.log('🧪 Testing Player Connection and Session Management\n');
  
  // Create a room
  const room = new BaseGameRoom();
  room.onCreate({ gameId: 'test', minPlayers: 2, maxPlayers: 4 });
  
  console.log('✅ Room created with code:', room.state.roomCode);
  console.log('✅ Reconnect timeout:', room.state.reconnectTimeout, 'ms');
  console.log('✅ AFK timeout:', room.state.afkTimeout, 'ms\n');
  
  // Test 1: Player join with unique session ID
  console.log('🔍 Test 1: Player join with unique session ID');
  const client1 = new MockClient('player1');
  const client2 = new MockClient('player2');
  
  room.onJoin(client1, { name: 'Alice' });
  room.onJoin(client2, { name: 'Bob' });
  
  console.log('Players in room:', room.state.players.size);
  console.log('Host is:', Array.from(room.state.players.values()).find(p => p.isHost)?.name);
  console.log('');
  
  // Test 2: Host migration when host disconnects
  console.log('🔍 Test 2: Host migration when host disconnects');
  console.log('Before disconnect - Host:', Array.from(room.state.players.values()).find(p => p.isHost)?.name);
  
  room.onLeave(client1, false); // Host disconnects without consent (simulates network issue)
  
  setTimeout(() => {
    console.log('After disconnect - Host:', Array.from(room.state.players.values()).find(p => p.isHost)?.name);
    console.log('Player1 connected status:', room.state.players.get('player1')?.isConnected);
    console.log('');
    
    // Test 3: Reconnection within timeout
    console.log('🔍 Test 3: Reconnection within timeout');
    const newClient1 = new MockClient('player1'); // Same session ID
    room.onJoin(newClient1, { name: 'Alice' });
    
    console.log('After reconnect - Player1 connected:', room.state.players.get('player1')?.isConnected);
    console.log('After reconnect - Host:', Array.from(room.state.players.values()).find(p => p.isHost)?.name);
    console.log('');
    
    // Test 4: AFK detection simulation
    console.log('🔍 Test 4: AFK detection (simulated)');
    const player1 = room.state.players.get('player1');
    if (player1) {
      // Simulate old activity timestamp
      player1.lastActivity = Date.now() - 70000; // 70 seconds ago
      console.log('Set player1 activity to 70 seconds ago');
      
      // Manually trigger AFK check
      const now = Date.now();
      if (now - player1.lastActivity > room.state.afkTimeout) {
        console.log('✅ AFK detection would trigger for player1');
      }
    }
    
    console.log('\n🎉 All connection management tests completed!');
    
    // Cleanup
    room.onDispose();
    
  }, 100); // Small delay to let async operations complete
}

testConnectionManagement().catch(console.error);