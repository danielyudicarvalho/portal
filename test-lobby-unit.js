// Unit test for GameLobby functionality
const { GameLobby } = require('./server/rooms/GameLobby');

function testRoomCodeGeneration() {
  console.log('🧪 Testing Room Code Generation');
  
  const lobby = new GameLobby();
  
  // Test room code generation
  const roomCode1 = lobby.generateRoomCode();
  const roomCode2 = lobby.generateRoomCode();
  
  console.log(`Generated room codes: ${roomCode1}, ${roomCode2}`);
  
  // Validate format
  const isValidFormat = (code) => {
    return typeof code === 'string' && 
           code.length === 6 && 
           /^[A-Z0-9]+$/.test(code);
  };
  
  if (isValidFormat(roomCode1) && isValidFormat(roomCode2)) {
    console.log('✅ Room codes have valid format');
  } else {
    console.log('❌ Room codes have invalid format');
  }
  
  if (roomCode1 !== roomCode2) {
    console.log('✅ Room codes are unique');
  } else {
    console.log('❌ Room codes are not unique');
  }
}

function testRoomTracking() {
  console.log('\n🧪 Testing Room Tracking');
  
  const lobby = new GameLobby();
  lobby.onCreate();
  
  // Test room tracking
  lobby.trackRoom('room1', 'snake', 8, false, 'ABC123');
  lobby.trackRoom('room2', 'box_jump', 10, true, 'DEF456');
  
  const rooms = lobby.getActiveRooms();
  console.log(`Tracked ${rooms.length} rooms`);
  
  const snakeRooms = lobby.getActiveRooms('snake');
  const boxJumpRooms = lobby.getActiveRooms('box_jump');
  
  if (snakeRooms.length === 1 && boxJumpRooms.length === 1) {
    console.log('✅ Room filtering by game type works');
  } else {
    console.log('❌ Room filtering by game type failed');
  }
  
  // Test room removal
  lobby.removeRoom('room1');
  const remainingRooms = lobby.getActiveRooms();
  
  if (remainingRooms.length === 1) {
    console.log('✅ Room removal works');
  } else {
    console.log('❌ Room removal failed');
  }
}

function testGameInfo() {
  console.log('\n🧪 Testing Game Info');
  
  const lobby = new GameLobby();
  lobby.onCreate();
  
  const snakeGame = lobby.state.availableGames.get('snake');
  const boxJumpGame = lobby.state.availableGames.get('box_jump');
  
  if (snakeGame && boxJumpGame) {
    console.log('✅ Available games initialized correctly');
    console.log(`Snake: ${snakeGame.minPlayers}-${snakeGame.maxPlayers} players`);
    console.log(`Box Jump: ${boxJumpGame.minPlayers}-${boxJumpGame.maxPlayers} players`);
  } else {
    console.log('❌ Available games not initialized correctly');
  }
}

function runTests() {
  console.log('🧪 Running GameLobby Unit Tests');
  console.log('================================');
  
  try {
    testRoomCodeGeneration();
    testRoomTracking();
    testGameInfo();
    
    console.log('\n🎉 All unit tests completed!');
  } catch (error) {
    console.error('❌ Unit test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };