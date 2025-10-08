const { GameLobby } = require('./server/rooms/GameLobby');

console.log('Creating GameLobby...');
const lobby = new GameLobby();

console.log('Generating room code...');
const code = lobby.generateRoomCode();
console.log('Room code:', code);

console.log('Initializing lobby...');
lobby.onCreate();

console.log('Testing room tracking...');
lobby.trackRoom('test1', 'snake', 8, false, 'TEST01');

console.log('Getting active rooms...');
const rooms = lobby.getActiveRooms();
console.log('Active rooms count:', rooms.length);

console.log('Test completed successfully!');