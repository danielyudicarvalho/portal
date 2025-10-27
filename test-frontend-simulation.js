const { Client } = require('colyseus.js');

// Simulate the exact frontend flow
class FrontendSimulation {
  constructor() {
    this.client = null;
    this.lobbyConnection = null;
    this.selectedGameId = null;
    this.rooms = [];
    this.isConnected = false;
  }

  async connectToLobby() {
    console.log('🔌 Frontend: Connecting to lobby...');
    
    this.client = new Client('ws://localhost:3002');
    this.lobbyConnection = await this.client.joinOrCreate('lobby');
    
    this.setupLobbyHandlers();
    this.isConnected = true;
    
    console.log('✅ Frontend: Connected to lobby');
  }

  setupLobbyHandlers() {
    // Handle rooms updated (exact same logic as frontend)
    this.lobbyConnection.onMessage('rooms_updated', (data) => {
      console.log('📡 Frontend: Received rooms_updated:', {
        totalRooms: data.activeRooms?.length || 0,
        selectedGameId: this.selectedGameId
      });
      
      const allRooms = data.activeRooms || [];
      
      // Apply the same filtering logic as the frontend
      const scopedRooms = this.selectedGameId
        ? allRooms.filter(r => r.gameId === this.selectedGameId)
        : allRooms;
      
      console.log(`🎯 Frontend: Filtered rooms for "${this.selectedGameId}":`, scopedRooms.length);
      
      this.rooms = scopedRooms;
      this.displayRooms();
    });

    // Handle room created
    this.lobbyConnection.onMessage('room_created', (data) => {
      console.log('🏗️ Frontend: Room created event received:', data);
    });
  }

  setSelectedGame(gameId) {
    console.log(`🎮 Frontend: Setting selected game to "${gameId}"`);
    this.selectedGameId = gameId;
    this.rooms = []; // Clear rooms when switching games
  }

  async refreshRooms() {
    if (!this.selectedGameId) {
      console.log('⚠️ Frontend: No selected game ID, skipping room refresh');
      return;
    }
    
    console.log(`🔄 Frontend: Refreshing rooms for game "${this.selectedGameId}"`);
    
    try {
      const rooms = await this.getActiveRooms(this.selectedGameId);
      console.log(`✅ Frontend: Received ${rooms.length} rooms`);
      this.rooms = rooms;
      this.displayRooms();
    } catch (error) {
      console.error('❌ Frontend: Failed to refresh rooms:', error);
    }
  }

  async getActiveRooms(gameId) {
    console.log('📡 Frontend: Getting active rooms for game:', gameId);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Frontend: Timeout getting active rooms');
        reject(new Error('Timeout getting active rooms'));
      }, 10000);

      console.log('📤 Frontend: Sending refresh_rooms message...');
      this.lobbyConnection.send('refresh_rooms');
      
      const handler = (data) => {
        console.log('📡 Frontend: Received rooms_updated response:', data);
        clearTimeout(timeout);
        
        // Use activeRooms (the fix we made)
        const rooms = data.activeRooms || [];
        console.log('📋 Frontend: Total rooms received:', rooms.length);
        
        const filteredRooms = gameId ? 
          rooms.filter((room) => room.gameId === gameId) : 
          rooms;
        console.log('🎯 Frontend: Filtered rooms for', gameId + ':', filteredRooms.length);
        
        resolve(filteredRooms);
      };
      
      this.lobbyConnection.onMessage('rooms_updated', handler);
    });
  }

  async createRoom(gameId, options) {
    console.log('🚀 Frontend: Creating room...', { gameId, options });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout creating room'));
      }, 15000);

      const successHandler = (data) => {
        clearTimeout(timeout);
        console.log('✅ Frontend: Room created successfully:', data);
        resolve(data.roomId);
      };

      const errorHandler = (error) => {
        if (error.code && error.code.includes('ROOM_CREATION')) {
          clearTimeout(timeout);
          console.error('❌ Frontend: Room creation failed:', error);
          reject(new Error(error.message));
        }
      };

      this.lobbyConnection.onMessage('room_created', successHandler);
      this.lobbyConnection.onMessage('error', errorHandler);

      this.lobbyConnection.send('create_room', {
        gameId,
        isPrivate: options.isPrivate,
        roomName: options.roomName,
        settings: options.gameSettings || {}
      });
    });
  }

  displayRooms() {
    console.log('');
    console.log('🏠 FRONTEND ROOM DISPLAY:');
    console.log('========================');
    
    if (this.rooms.length === 0) {
      console.log('❌ No rooms to display');
      console.log(`   Selected Game: "${this.selectedGameId}"`);
      console.log('   This is what the user sees: "No active rooms"');
    } else {
      console.log(`✅ Displaying ${this.rooms.length} rooms:`);
      this.rooms.forEach((room, index) => {
        console.log(`   ${index + 1}. ${room.roomName} (${room.roomCode})`);
        console.log(`      Game: ${room.gameId}`);
        console.log(`      Players: ${room.playerCount}/${room.maxPlayers}`);
        console.log(`      State: ${room.state}`);
      });
    }
    console.log('');
  }
}

async function testFrontendFlow() {
  try {
    console.log('🧪 TESTING COMPLETE FRONTEND FLOW');
    console.log('==================================');
    
    const frontend = new FrontendSimulation();
    
    // Step 1: Connect to lobby
    await frontend.connectToLobby();
    
    // Step 2: Set selected game (this happens when user navigates to "The Battle" page)
    frontend.setSelectedGame('the-battle');
    
    // Step 3: Refresh rooms (this happens when the rooms page loads)
    await frontend.refreshRooms();
    
    // Step 4: Create a room (this happens when user clicks "Create Room")
    console.log('🚀 Testing room creation...');
    const roomId = await frontend.createRoom('the-battle', {
      isPrivate: false,
      roomName: 'Frontend Simulation Test',
      gameSettings: {}
    });
    
    console.log('✅ Room created with ID:', roomId);
    
    // Step 5: Refresh rooms again to see the new room
    console.log('🔄 Refreshing rooms after creation...');
    await frontend.refreshRooms();
    
    console.log('✅ Frontend simulation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Frontend simulation failed:', error);
    process.exit(1);
  }
}

testFrontendFlow();