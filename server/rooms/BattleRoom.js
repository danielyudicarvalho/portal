const { BaseGameRoom } = require('./BaseGameRoom');
const { Schema, type } = require('@colyseus/schema');

// Minimal battle-specific state (extendable later)
class BattleGameState extends Schema {
  constructor() {
    super();
    this.matchDuration = 10 * 60 * 1000; // 10 minutes default
  }
}

type('number')(BattleGameState.prototype, 'matchDuration');

class BattleRoom extends BaseGameRoom {
  onCreate(options = {}) {
    super.onCreate(options);

    // Attach battle-specific state
    const battleState = new BattleGameState();
    Object.assign(this.state, battleState);

    // Room sizing defaults for The Battle
    this.state.minPlayers = options.minPlayers || 2;
    this.state.maxPlayers = options.maxPlayers || 8;
    this.maxClients = this.state.maxPlayers;

    // Placeholder: any per-room settings can be merged here
    if (options.settings) {
      try {
        const current = JSON.parse(this.state.settings || '{}');
        this.state.settings = JSON.stringify({ ...current, ...options.settings });
      } catch (_) {}
    }

    // Keep lightweight cache of last known per-player data (positions, etc.)
    this.playerRuntime = new Map();
  }

  onJoin(client, options = {}) {
    super.onJoin(client, options);

    // Initialize player's battle data (spawn position, type, health)
    const spawn = this.generateSpawn();
    const tankType = this.randomTankType();
    const initial = {
      id: client.sessionId,
      name: options?.name || `Player ${this.state.players.size}`,
      x: spawn.x,
      y: spawn.y,
      rotation: spawn.rotation,
      type: tankType,
      health: 100,
    };

    this.playerRuntime.set(client.sessionId, initial);

    // Persist into schema Player.gameData for reconnection support
    try {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.gameData = JSON.stringify(initial);
      }
    } catch (_) {}

    // Send initial state to the newly joined client
    const others = [];
    this.state.players.forEach((p, pid) => {
      if (pid !== client.sessionId) {
        try {
          const data = this.playerRuntime.get(pid) || JSON.parse(p.gameData || '{}');
          if (data && data.id) others.push(data);
        } catch (_) {}
      }
    });

    client.send('initial_state', {
      players: others,
      self: initial,
      gameState: this.state.state,
      matchDuration: this.state.matchDuration,
    });

    // Notify others about this spawn
    this.broadcast('player_spawn', initial, { except: client });
  }

  onGameMessage(client, type, message = {}) {
    switch (type) {
      case 'player_update': {
        // Sanitize / clamp values if necessary
        const safe = {
          id: client.sessionId,
          x: typeof message.x === 'number' ? message.x : 0,
          y: typeof message.y === 'number' ? message.y : 0,
          rotation: typeof message.rotation === 'number' ? message.rotation : 0,
          type: ['rock', 'paper', 'scissors'].includes(message.type) ? message.type : 'paper',
          health: Math.max(0, Math.min(100, message.health ?? 100)),
        };

        this.playerRuntime.set(client.sessionId, safe);
        try {
          const player = this.state.players.get(client.sessionId);
          if (player) player.gameData = JSON.stringify(safe);
        } catch (_) {}

        // Broadcast to others only
        this.broadcast('player_update', safe, { except: client });
        break;
      }
      case 'shoot': {
        // Broadcast shot event to others
        const payload = {
          id: client.sessionId,
          x: message.x,
          y: message.y,
          rotation: message.rotation,
          type: message.type,
        };
        this.broadcast('shoot', payload, { except: client });
        break;
      }
      case 'powerup_collected': {
        // Inform others to remove the power-up
        if (message && message.powerUpId) {
          this.broadcast('powerup_collected', { powerUpId: message.powerUpId }, { except: client });
        }
        break;
      }
      case 'request_initial_state': {
        // Re-send snapshot to client
        const others = [];
        this.state.players.forEach((p, pid) => {
          if (pid !== client.sessionId) {
            try {
              const data = this.playerRuntime.get(pid) || JSON.parse(p.gameData || '{}');
              if (data && data.id) others.push(data);
            } catch (_) {}
          }
        });
        const selfData = this.playerRuntime.get(client.sessionId);
        client.send('initial_state', {
          players: others,
          self: selfData,
          gameState: this.state.state,
          matchDuration: this.state.matchDuration,
        });
        break;
      }
      default:
        console.log(`[BattleRoom] Unhandled message '${type}' from ${client.sessionId}`, message);
        break;
    }
  }

  onGameStart() {
    // Use parent start and optionally end the match by duration
    super.onGameStart();
    // End session automatically after configured duration
    const duration = this.state.matchDuration || 10 * 60 * 1000;
    setTimeout(() => {
      if (this.state.state === 'PLAYING') {
        // No scoring logic yet; rank by join order as placeholder
        const results = Array.from(this.state.players.values())
          .filter(p => p.isConnected)
          .map((p, idx) => ({ playerId: p.id, playerName: p.name, score: 0, rank: idx + 1 }));
        this.endGame(results);
      }
    }, duration);
  }

  generateSpawn() {
    // Keep players within bounds of the 1600x1000 map used by the client
    const x = Math.floor(Math.random() * 1400 + 100);
    const y = Math.floor(Math.random() * 800 + 150);
    const rotation = Math.random() * Math.PI * 2;
    return { x, y, rotation };
  }

  randomTankType() {
    const all = ['rock', 'paper', 'scissors'];
    return all[Math.floor(Math.random() * all.length)];
  }
}

module.exports = { BattleRoom };
