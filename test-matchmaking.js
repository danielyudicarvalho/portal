const { Client } = require('colyseus.js');

async function testMatchmaking() {
  console.log('🧪 Testing Matchmaking System');
  console.log('================================');

  try {
    // Connect to the server
    const client = new Client('ws://localhost:3002');
    
    // Join lobby
    console.log('📡 Connecting to lobby...');
    const lobby = await client.joinOrCreate('lobby');
    
    console.log('✅ Connected to lobby');
    
    // Test room creation
    console.log('\n🏗️ Testing room creation...');
    
    lobby.send('create_room', {
      gameId: 'snake',
      isPrivate: false,
      settings: {}
    });
    
    // Wait for room creation response
    await new Promise((resolve) => {
      lobby.onMessage('room_created', (data) => {
        console.log('✅ Room created:', data);
        resolve();
      });
      
      lobby.onMessage('error', (error) => {
        console.error('❌ Room creation failed:', error);
        resolve();
      });
    });
    
    // Test quick match
    console.log('\n⚡ Testing quick match...');
    
    lobby.send('quick_match', {
      gameId: 'snake'
    });
    
    await new Promise((resolve) => {
      lobby.onMessage('join_room', (data) => {
        console.log('✅ Quick match successful:', data);
        resolve();
      });
      
      lobby.onMessage('error', (error) => {
        console.error('❌ Quick match failed:', error);
        resolve();
      });
    });
    
    // Test private room creation
    console.log('\n🔒 Testing private room creation...');
    
    lobby.send('create_room', {
      gameId: 'box_jump',
      isPrivate: true,
      settings: {}
    });
    
    let privateRoomCode = null;
    await new Promise((resolve) => {
      lobby.onMessage('room_created', (data) => {
        console.log('✅ Private room created:', data);
        privateRoomCode = data.roomCode;
        resolve();
      });
      
      lobby.onMessage('error', (error) => {
        console.error('❌ Private room creation failed:', error);
        resolve();
      });
    });
    
    // Test joining private room
    if (privateRoomCode) {
      console.log('\n🔑 Testing private room join...');
      
      lobby.send('join_private_room', {
        roomCode: privateRoomCode
      });
      
      await new Promise((resolve) => {
        lobby.onMessage('join_room', (data) => {
          console.log('✅ Private room join successful:', data);
          resolve();
        });
        
        lobby.onMessage('error', (error) => {
          console.error('❌ Private room join failed:', error);
          resolve();
        });
      });
    }
    
    // Test room stats
    console.log('\n📊 Testing room statistics...');
    
    lobby.send('get_room_stats', {});
    
    await new Promise((resolve) => {
      lobby.onMessage('room_stats', (stats) => {
        console.log('✅ Room stats received:', JSON.stringify(stats, null, 2));
        resolve();
      });
      
      setTimeout(resolve, 2000); // Timeout after 2 seconds
    });
    
    // Test invalid room code
    console.log('\n❌ Testing invalid room code...');
    
    lobby.send('join_private_room', {
      roomCode: 'INVALID'
    });
    
    await new Promise((resolve) => {
      lobby.onMessage('error', (error) => {
        console.log('✅ Invalid room code properly rejected:', error.message);
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    console.log('\n🎉 All tests completed!');
    
    // Cleanup
    lobby.leave();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testMatchmaking().then(() => {
    console.log('Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testMatchmaking };