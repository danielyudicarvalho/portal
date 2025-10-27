// Test using the multiplayer SDK directly
const fs = require('fs');
const path = require('path');

// Read the SDK file
const sdkPath = path.join(__dirname, 'public', 'js', 'multiplayer-sdk.js');
const sdkCode = fs.readFileSync(sdkPath, 'utf8');

// Create a simple test environment
global.WebSocket = require('ws');
global.EventTarget = require('events').EventEmitter;

// Evaluate the SDK code
eval(sdkCode);

async function testSDK() {
  try {
    console.log('🔍 Testing SDK room creation...');
    
    const sdk = new MultiplayerSDK();
    
    // Connect to lobby
    await sdk.connectToLobby('ws://localhost:3002');
    console.log('✅ Connected to lobby');
    
    // Listen for room updates
    sdk.on('rooms_updated', (data) => {
      console.log('📡 Rooms updated via SDK:');
      if (data.rooms && data.rooms.length > 0) {
        data.rooms.forEach(room => {
          console.log(`  - Room: ${room.roomCode}, Name: "${room.roomName}", Game: ${room.gameId}`);
        });
      }
    });
    
    // Create room with options
    console.log('🚀 Creating room via SDK...');
    const roomId = await sdk.createRoomWithOptions('the-battle', {
      isPrivate: false,
      roomName: 'SDK Test Room',
      maxPlayers: 8,
      gameSettings: {}
    });
    
    console.log('✅ Room created via SDK:', roomId);
    
    // Wait for updates
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ SDK test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ SDK test failed:', error);
    process.exit(1);
  }
}

testSDK();