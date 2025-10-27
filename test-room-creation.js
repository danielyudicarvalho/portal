const { Client } = require('colyseus.js');

async function testRoomCreation() {
  try {
    console.log('🔍 Testing room creation...');
    
    // Connect to lobby
    const client = new Client('ws://localhost:3002');
    const lobby = await client.joinOrCreate('lobby');
    
    console.log('✅ Connected to lobby');
    
    // Listen for room created event
    lobby.onMessage('room_created', (data) => {
      console.log('🏗️ Room created event received:', data);
    });
    
    // Listen for rooms updated event
    lobby.onMessage('rooms_updated', (data) => {
      console.log('📡 Rooms updated event received:');
      console.log('Active rooms:', data.activeRooms?.length || 0);
      if (data.activeRooms && data.activeRooms.length > 0) {
        data.activeRooms.forEach(room => {
          console.log(`  - Room: ${room.roomCode}, Name: "${room.roomName}", Game: ${room.gameId}`);
        });
        
        // Test filtering by gameId
        const battleRooms = data.activeRooms.filter(r => r.gameId === 'the-battle');
        console.log('🎯 Battle rooms after filtering:', battleRooms.length);
        battleRooms.forEach(room => {
          console.log(`    - Battle Room: ${room.roomCode}, Name: "${room.roomName}"`);
        });
      }
    });
    
    // Create a room with a specific name
    console.log('🚀 Creating room with name "baka"...');
    lobby.send('create_room', {
      gameId: 'the-battle',
      isPrivate: false,
      roomName: 'baka',
      settings: {}
    });
    
    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRoomCreation();