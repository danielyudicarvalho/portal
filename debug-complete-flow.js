const { Client } = require('colyseus.js');

async function debugCompleteFlow() {
  try {
    console.log('🔍 DEBUGGING COMPLETE ROOM CREATION FLOW');
    console.log('==========================================');
    
    const client = new Client('ws://localhost:3002');
    const lobby = await client.joinOrCreate('lobby');
    
    console.log('✅ Step 1: Connected to lobby');
    
    let roomCreated = false;
    let roomsUpdated = false;
    
    // Listen for all events
    lobby.onMessage('room_created', (data) => {
      console.log('🏗️ Step 2: Room created event received');
      console.log('   Room ID:', data.roomId);
      console.log('   Room Code:', data.roomCode);
      console.log('   Room Name:', data.roomName);
      console.log('   Game ID:', data.gameId);
      roomCreated = true;
    });
    
    lobby.onMessage('rooms_updated', (data) => {
      console.log('📡 Step 3: Rooms updated event received');
      console.log('   Total rooms:', data.activeRooms?.length || 0);
      
      if (data.activeRooms && data.activeRooms.length > 0) {
        data.activeRooms.forEach((room, index) => {
          console.log(`   Room ${index + 1}:`);
          console.log(`     - Code: ${room.roomCode}`);
          console.log(`     - Name: "${room.roomName}"`);
          console.log(`     - Game: ${room.gameId}`);
          console.log(`     - Players: ${room.playerCount}/${room.maxPlayers}`);
        });
        
        // Test filtering
        const battleRooms = data.activeRooms.filter(r => r.gameId === 'the-battle');
        console.log(`   Filtered for 'the-battle': ${battleRooms.length} rooms`);
      }
      
      roomsUpdated = true;
    });
    
    lobby.onMessage('error', (error) => {
      console.log('❌ Error event received:', error);
    });
    
    // Step 1: Create room
    console.log('🚀 Step 1: Creating room...');
    lobby.send('create_room', {
      gameId: 'the-battle',
      isPrivate: false,
      roomName: 'Debug Flow Test',
      settings: {}
    });
    
    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('');
    console.log('📊 RESULTS:');
    console.log('   Room Created Event:', roomCreated ? '✅' : '❌');
    console.log('   Rooms Updated Event:', roomsUpdated ? '✅' : '❌');
    
    if (!roomCreated) {
      console.log('❌ PROBLEM: Room creation event not received');
    }
    
    if (!roomsUpdated) {
      console.log('❌ PROBLEM: Rooms updated event not received');
    }
    
    if (roomCreated && roomsUpdated) {
      console.log('✅ SUCCESS: Both events received - room creation working');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

debugCompleteFlow();