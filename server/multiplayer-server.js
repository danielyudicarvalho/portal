const { Server, RedisPresence } = require('colyseus');
// RedisDriver is provided by a separate package on Colyseus 0.15.
// We'll try to require it if available and fall back gracefully otherwise.
let RedisDriver = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RedisDriver = require('@colyseus/redis-driver').RedisDriver;
} catch (_) {
  // optional dependency; presence alone still enables cross-process pub/sub
}
const { monitor } = require('@colyseus/monitor');
const { createServer } = require('http');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import room types
const { GameLobby } = require('./rooms/GameLobby');
const { SnakeRoom } = require('./rooms/SnakeRoom');
const { BoxJumpRoom } = require('./rooms/BoxJumpRoom');
const { BattleRoom } = require('./rooms/BattleRoom');

class MultiplayerServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.gameServer = null;
    this.startTime = Date.now();
    this.setupMiddleware();
    this.initializeServer();
    this.registerRooms();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS configuration with security headers
    const corsOptions = {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS?.split(',')].filter(Boolean).flat()
        : true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };

    this.app.use(cors(corsOptions));

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
      next();
    });
  }

  initializeServer() {
    // Initialize Colyseus server with WebSocket transport
    // If REDIS_URL is provided, wire Redis Presence/Driver for multi-process.

    const redisOptions = this.getRedisOptionsFromEnv();

    const serverOptions = {
      server: this.server,
      express: this.app,
      pingInterval: 10000, // Reduced ping frequency
      pingMaxRetries: 2,   // Fewer retries
      gracefullyShutdown: true,
    };

    if (redisOptions) {
      try {
        serverOptions.presence = new RedisPresence(redisOptions);
        console.log(`🧩 RedisPresence enabled at ${redisOptions.host}:${redisOptions.port}${typeof redisOptions.db === 'number' ? '/' + redisOptions.db : ''}`);
      } catch (e) {
        console.warn('⚠️ Failed to initialize RedisPresence, continuing with LocalPresence:', e.message);
      }

      if (RedisDriver) {
        try {
          serverOptions.driver = new RedisDriver(redisOptions);
          console.log('🧩 RedisDriver enabled for shared room registry');
        } catch (e) {
          console.warn('⚠️ Failed to initialize RedisDriver, continuing without shared driver:', e.message);
        }
      } else {
        console.warn('ℹ️ @colyseus/redis-driver not installed; using presence only.');
      }
    } else {
      console.log('ℹ️ REDIS_URL not set; using LocalPresence (single-process).');
    }

    this.gameServer = new Server(serverOptions);

    // Add Colyseus monitor for development and staging
    if (process.env.NODE_ENV !== 'production') {
      this.app.use('/colyseus', monitor());
    }

    // Error handling for WebSocket connections
    this.gameServer.onShutdown(() => {
      console.log('🔄 Multiplayer server shutting down gracefully...');
    });
  }

  // Parse REDIS_URL (redis://[:password@]host:port[/db]) into options that
  // both RedisPresence and RedisDriver understand.
  getRedisOptionsFromEnv() {
    const url = process.env.REDIS_URL;
    if (!url) return null;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'redis:') return null;

      const opts = {
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      };

      if (parsed.password) {
        opts.password = parsed.password;
      }

      // pathname like '/0'
      if (parsed.pathname && parsed.pathname.length > 1) {
        const db = parseInt(parsed.pathname.slice(1), 10);
        if (!Number.isNaN(db)) opts.db = db;
      }

      return opts;
    } catch (e) {
      console.warn('⚠️ Could not parse REDIS_URL, continuing without Redis:', e.message);
      return null;
    }
  }

  registerRooms() {
    // Register room handlers with options
    this.gameServer.define('lobby', GameLobby, {
      maxClients: 1000, // High limit for lobby
    });

    this.gameServer.define('snake_game', SnakeRoom, {
      maxClients: 8,
    });

    this.gameServer.define('box_jump_game', BoxJumpRoom, {
      maxClients: 10,
    });

    // The Battle rooms
    this.gameServer.define('battle_game', BattleRoom, {
      maxClients: 8,
    });

    console.log('✅ Room handlers registered successfully');
  }

  setupRoutes() {
    // Enhanced health check endpoint (Requirement 12.2)
    this.app.get('/health', (req, res) => {
      const uptime = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage();
      const rooms = Array.from(this.gameServer?.rooms?.values() || []);

      // Calculate health metrics
      const totalConnections = rooms.reduce((sum, room) => sum + room.clients.length, 0);
      const memoryUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

      // Determine health status
      let healthStatus = 'healthy';
      const healthIssues = [];

      if (memoryUsagePercent > 90) {
        healthStatus = 'warning';
        healthIssues.push('High memory usage');
      }

      if (totalConnections > 1000) {
        healthStatus = 'warning';
        healthIssues.push('High connection count');
      }

      if (rooms.length > 500) {
        healthStatus = 'warning';
        healthIssues.push('High room count');
      }

      const response = {
        status: healthStatus,
        timestamp: Date.now(),
        uptime: uptime,
        uptimeFormatted: this.formatUptime(uptime),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        server: {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          usagePercent: memoryUsagePercent
        },
        rooms: {
          total: rooms.length,
          active: rooms.filter(room => room.clients.length > 0).length,
          empty: rooms.filter(room => room.clients.length === 0).length,
          byType: this.getRoomStatsByType(rooms)
        },
        connections: {
          total: totalConnections,
          peak: this.peakConnections || totalConnections
        },
        issues: healthIssues
      };

      // Update peak connections
      if (totalConnections > (this.peakConnections || 0)) {
        this.peakConnections = totalConnections;
      }

      // Set appropriate HTTP status based on health
      const statusCode = healthStatus === 'healthy' ? 200 :
        healthStatus === 'warning' ? 200 : 503;

      res.status(statusCode).json(response);
    });

    // Detailed server status endpoint
    this.app.get('/api/status', (req, res) => {
      const rooms = Array.from(this.gameServer?.rooms?.values() || []);

      res.json({
        server: {
          status: 'running',
          uptime: Date.now() - this.startTime,
          environment: process.env.NODE_ENV || 'development',
        },
        rooms: {
          total: rooms.length,
          active: rooms.filter(room => room.clients.length > 0).length,
          byType: this.getRoomStatsByType(rooms),
        },
        players: {
          total: rooms.reduce((sum, room) => sum + room.clients.length, 0),
          byRoom: rooms.map(room => ({
            roomId: room.roomId,
            roomName: room.roomName,
            playerCount: room.clients.length,
            maxClients: room.maxClients,
          }))
        }
      });
    });

    // Game info endpoint
    this.app.get('/api/games', (req, res) => {
      res.json({
        games: [
          {
            id: 'snake',
            name: 'Snake Battle',
            roomType: 'snake_game',
            minPlayers: 2,
            maxPlayers: 8,
            description: 'Classic snake game with multiplayer combat',
            features: ['real-time', 'combat', 'power-ups']
          },
          {
            id: 'box_jump',
            name: 'Box Jump Challenge',
            roomType: 'box_jump_game',
            minPlayers: 5,
            maxPlayers: 10,
            description: 'Turn-based platformer challenge',
            features: ['turn-based', 'elimination', 'levels']
          }
        ]
      });
    });

    // Enhanced metrics endpoint for comprehensive monitoring (Requirement 12.1, 12.2)
    this.app.get('/api/metrics', (req, res) => {
      const rooms = Array.from(this.gameServer?.rooms?.values() || []);
      const totalConnections = rooms.reduce((sum, room) => sum + room.clients.length, 0);

      // Get lobby monitoring data if available
      let lobbyData = null;
      const lobbyRooms = rooms.filter(room => room.roomName === 'lobby');
      if (lobbyRooms.length > 0 && lobbyRooms[0].getMonitoringData) {
        try {
          lobbyData = lobbyRooms[0].getMonitoringData();
        } catch (error) {
          console.warn('Could not get lobby monitoring data:', error.message);
        }
      }

      const metrics = {
        timestamp: Date.now(),
        uptime: Date.now() - this.startTime,
        server: {
          status: 'running',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          pid: process.pid
        },
        rooms: {
          total: rooms.length,
          active: rooms.filter(room => room.clients.length > 0).length,
          empty: rooms.filter(room => room.clients.length === 0).length,
          byType: {
            lobby: rooms.filter(room => room.roomName === 'lobby').length,
            snake_game: rooms.filter(room => room.roomName === 'snake_game').length,
            box_jump_game: rooms.filter(room => room.roomName === 'box_jump_game').length,
          },
          byState: this.getRoomsByState(rooms),
          capacity: this.getRoomCapacityStats(rooms)
        },
        connections: {
          total: totalConnections,
          peak: this.peakConnections || totalConnections,
          byRoomType: this.getConnectionsByRoomType(rooms)
        },
        performance: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          eventLoop: this.getEventLoopMetrics()
        },
        lobby: lobbyData
      };

      // Update peak connections
      if (totalConnections > (this.peakConnections || 0)) {
        this.peakConnections = totalConnections;
      }

      res.json(metrics);
    });

    // Real-time room monitoring endpoint (Requirement 12.1)
    this.app.get('/api/rooms/monitor', (req, res) => {
      const rooms = Array.from(this.gameServer?.rooms?.values() || []);
      const gameRooms = rooms.filter(room => room.roomName !== 'lobby');

      const monitoringData = {
        timestamp: Date.now(),
        summary: {
          totalRooms: gameRooms.length,
          activeRooms: gameRooms.filter(room => room.clients.length > 0).length,
          totalPlayers: gameRooms.reduce((sum, room) => sum + room.clients.length, 0)
        },
        rooms: gameRooms.map(room => ({
          roomId: room.roomId,
          roomName: room.roomName,
          roomCode: room.metadata?.roomCode || 'N/A',
          gameId: room.metadata?.gameId || room.roomName,
          state: room.metadata?.state || 'UNKNOWN',
          playerCount: room.clients.length,
          maxPlayers: room.maxClients,
          isPrivate: room.metadata?.isPrivate || false,
          createdAt: room.metadata?.createdAt || null,
          lastUpdate: room.metadata?.lastUpdate || null,
          uptime: room.metadata?.createdAt ? Date.now() - room.metadata.createdAt : null
        })).sort((a, b) => b.playerCount - a.playerCount), // Sort by player count
        alerts: this.generateRoomAlerts(gameRooms)
      };

      res.json(monitoringData);
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: Date.now()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: Date.now()
      });
    });
  }

  getRoomStatsByType(rooms) {
    const stats = {};
    rooms.forEach(room => {
      const type = room.roomName;
      if (!stats[type]) {
        stats[type] = { count: 0, players: 0 };
      }
      stats[type].count++;
      stats[type].players += room.clients.length;
    });
    return stats;
  }

  // Enhanced monitoring helper methods (Requirement 12.1)
  getRoomsByState(rooms) {
    const gameRooms = rooms.filter(room => room.roomName !== 'lobby');
    return {
      LOBBY: gameRooms.filter(room => room.metadata?.state === 'LOBBY').length,
      COUNTDOWN: gameRooms.filter(room => room.metadata?.state === 'COUNTDOWN').length,
      PLAYING: gameRooms.filter(room => room.metadata?.state === 'PLAYING').length,
      RESULTS: gameRooms.filter(room => room.metadata?.state === 'RESULTS').length,
      UNKNOWN: gameRooms.filter(room => !room.metadata?.state).length
    };
  }

  getRoomCapacityStats(rooms) {
    const gameRooms = rooms.filter(room => room.roomName !== 'lobby');
    const totalCapacity = gameRooms.reduce((sum, room) => sum + room.maxClients, 0);
    const totalPlayers = gameRooms.reduce((sum, room) => sum + room.clients.length, 0);

    return {
      totalCapacity,
      totalPlayers,
      utilizationPercent: totalCapacity > 0 ? Math.round((totalPlayers / totalCapacity) * 100) : 0,
      fullRooms: gameRooms.filter(room => room.clients.length >= room.maxClients).length,
      emptyRooms: gameRooms.filter(room => room.clients.length === 0).length,
      nearFullRooms: gameRooms.filter(room =>
        room.clients.length >= room.maxClients * 0.8 && room.clients.length < room.maxClients
      ).length
    };
  }

  getConnectionsByRoomType(rooms) {
    const stats = {};
    rooms.forEach(room => {
      const type = room.roomName;
      if (!stats[type]) {
        stats[type] = 0;
      }
      stats[type] += room.clients.length;
    });
    return stats;
  }

  getEventLoopMetrics() {
    try {
      // Basic event loop metrics
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delta = process.hrtime.bigint() - start;
        this.eventLoopDelay = Number(delta) / 1000000; // Convert to milliseconds
      });

      return {
        delay: this.eventLoopDelay || 0,
        utilization: process.cpuUsage().user / 1000000 // Convert to seconds
      };
    } catch (error) {
      return { delay: 0, utilization: 0 };
    }
  }

  generateRoomAlerts(rooms) {
    const alerts = [];
    const now = Date.now();

    rooms.forEach(room => {
      // Alert for rooms that have been empty for too long
      if (room.clients.length === 0) {
        const createdAt = room.metadata?.createdAt;
        if (createdAt && (now - createdAt) > 300000) { // 5 minutes
          alerts.push({
            type: 'EMPTY_ROOM',
            severity: 'warning',
            roomId: room.roomId,
            roomCode: room.metadata?.roomCode || 'N/A',
            message: `Room has been empty for ${Math.round((now - createdAt) / 60000)} minutes`,
            timestamp: now
          });
        }
      }

      // Alert for rooms at capacity
      if (room.clients.length >= room.maxClients) {
        alerts.push({
          type: 'ROOM_FULL',
          severity: 'info',
          roomId: room.roomId,
          roomCode: room.metadata?.roomCode || 'N/A',
          message: `Room is at full capacity (${room.clients.length}/${room.maxClients})`,
          timestamp: now
        });
      }

      // Alert for rooms stuck in non-lobby states for too long
      const state = room.metadata?.state;
      const lastUpdate = room.metadata?.lastUpdate;
      if (state && state !== 'LOBBY' && lastUpdate && (now - lastUpdate) > 600000) { // 10 minutes
        alerts.push({
          type: 'STUCK_ROOM',
          severity: 'warning',
          roomId: room.roomId,
          roomCode: room.metadata?.roomCode || 'N/A',
          message: `Room stuck in ${state} state for ${Math.round((now - lastUpdate) / 60000)} minutes`,
          timestamp: now
        });
      }
    });

    return alerts;
  }

  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  listen(port) {
    const PORT = port || process.env.MULTIPLAYER_PORT || 3002;

    this.gameServer.listen(PORT, () => {
      console.log('🚀 Multiplayer Server Started');
      console.log('================================');
      console.log(`🎮 Server running on port ${PORT}`);
      console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Status API: http://localhost:${PORT}/api/status`);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 Monitor: http://localhost:${PORT}/colyseus`);
      }

      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('================================');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    console.log('🔄 Received shutdown signal, closing server gracefully...');

    this.gameServer.gracefullyShutdown(true).then(() => {
      console.log('✅ Server shut down successfully');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    });
  }
}

// Create and start the server
const multiplayerServer = new MultiplayerServer();

// Only start listening if this file is run directly
if (require.main === module) {
  multiplayerServer.listen();
}

module.exports = multiplayerServer;
