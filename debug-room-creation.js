const { Client } = require('colyseus.js');

async function testRoomCreationAndListing() {
  try {
    console.log('🔍 Testing room creation and immediate listing...');
    
    const client = new Client('ws://localhost:3002');
    const lobby = await client.joinOrCreate('lobby');
    
    console.log('✅ Connected to lobby');
    
    let roomCreated = false;
    
    // Listen for room created event
    lobby.onMessage('room_created', (data) => {
      console.log('🏗️ Room created event received:', data);
      roomCreated = true;
    });
    
    // Listen for rooms updated event
    lobby.onMessage('rooms_updated', (data) => {
      console.log('📡 Rooms updated event received:');
      console.log('Active rooms:', data.activeRooms?.length || 0);
      if (data.activeRooms && data.activeRooms.length > 0) {
        data.activeRooms.forEach(room => {
          console.log(`  - Room: ${room.roomCode}, Name: "${room.roomName}", Game: ${room.gameId}, Private: ${room.isPrivate}`);
        });
        
        // Test filtering by gameId
        const battleRooms = data.activeRooms.filter(r => r.gameId === 'the-battle');
        console.log('🎯 Battle rooms after filtering:', battleRooms.length);
        battleRooms.forEach(room => {
          console.log(`    - Battle Room: ${room.roomCode}, Name: "${room.roomName}"`);
        });
      }
    });
    
    // Create a room
    console.log('🚀 Creating room...');
    lobby.send('create_room', {
      gameId: 'the-battle',
      isPrivate: false,
      roomName: 'test-room-debug',
      settings: {}
    });
    
    // Wait for room creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!roomCreated) {
      console.log('⚠️ Room creation event not received, requesting refresh...');
      lobby.send('refresh_rooms');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRoomCreationAndListing();