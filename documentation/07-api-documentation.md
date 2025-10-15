# API Documentation

## 📋 Overview

The Game Portal API provides RESTful endpoints for managing games, users, authentication, and multiplayer functionality. This documentation covers all available endpoints, request/response formats, authentication requirements, and usage examples.

## 🔗 Base URLs

### Development
- **Next.js API**: `http://localhost:3000/api`
- **Multiplayer Server**: `ws://localhost:3002`

### Production
- **Next.js API**: `https://yourdomain.com/api`
- **Multiplayer Server**: `wss://yourdomain.com/multiplayer`

## 🔐 Authentication

### Authentication Methods

#### NextAuth.js Session-Based Authentication
The API uses NextAuth.js for session management with support for multiple providers.

```typescript
// Authentication providers supported
- Email/Password (credentials)
- Google OAuth
- GitHub OAuth
- Discord OAuth (optional)
```

#### API Key Authentication (Admin)
Admin endpoints require API key authentication for server-to-server communication.

```http
Authorization: Bearer your-api-key-here
```

### Session Management

#### Getting Current Session
```typescript
// Client-side
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();

// Server-side
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
```

#### Protected Route Example
```typescript
// API route with authentication
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Protected logic here
}
```

## 🎮 Games API

### Get All Games

#### Endpoint
```http
GET /api/games
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of games per page |
| `category` | string | - | Filter by category slug |
| `search` | string | - | Search in title and description |
| `featured` | boolean | - | Filter featured games only |
| `sort` | string | 'popularity' | Sort by: popularity, title, created_at |

#### Response
```json
{
  "games": [
    {
      "id": "game-123",
      "title": "Snake Battle",
      "slug": "snake-battle",
      "description": "Classic snake game with multiplayer combat",
      "thumbnail": "/images/games/snake-battle.jpg",
      "provider": "internal",
      "category": {
        "id": "cat-1",
        "name": "Action",
        "slug": "action"
      },
      "tags": ["multiplayer", "arcade", "classic"],
      "isActive": true,
      "isFeatured": true,
      "popularity": 1250,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Example Request
```typescript
// Fetch featured action games
const response = await fetch('/api/games?category=action&featured=true&limit=10');
const data = await response.json();
```

### Get Single Game

#### Endpoint
```http
GET /api/games/[slug]
```

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Game slug identifier |

#### Response
```json
{
  "game": {
    "id": "game-123",
    "title": "Snake Battle",
    "slug": "snake-battle",
    "description": "Classic snake game with multiplayer combat features...",
    "thumbnail": "/images/games/snake-battle.jpg",
    "provider": "internal",
    "category": {
      "id": "cat-1",
      "name": "Action",
      "slug": "action"
    },
    "tags": ["multiplayer", "arcade", "classic"],
    "isActive": true,
    "isFeatured": true,
    "popularity": 1250,
    "gameUrl": "/games/snake-battle",
    "multiplayerSupported": true,
    "minPlayers": 2,
    "maxPlayers": 8,
    "controls": {
      "keyboard": ["WASD", "Arrow Keys"],
      "touch": true,
      "gamepad": false
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z"
  }
}
```

### Create Game (Admin Only)

#### Endpoint
```http
POST /api/games
```

#### Authentication
Requires admin role.

#### Request Body
```json
{
  "title": "New Game",
  "slug": "new-game",
  "description": "Description of the new game",
  "thumbnail": "/images/games/new-game.jpg",
  "provider": "internal",
  "categoryId": "cat-1",
  "tags": ["puzzle", "strategy"],
  "isActive": true,
  "isFeatured": false,
  "gameUrl": "/games/new-game",
  "multiplayerSupported": false,
  "controls": {
    "keyboard": ["WASD"],
    "touch": true,
    "gamepad": false
  }
}
```

#### Response
```json
{
  "game": {
    "id": "game-456",
    "title": "New Game",
    "slug": "new-game",
    // ... other game properties
    "createdAt": "2024-01-25T09:15:00Z",
    "updatedAt": "2024-01-25T09:15:00Z"
  },
  "message": "Game created successfully"
}
```

### Update Game (Admin Only)

#### Endpoint
```http
PUT /api/games/[slug]
```

#### Authentication
Requires admin role.

#### Request Body
```json
{
  "title": "Updated Game Title",
  "description": "Updated description",
  "isFeatured": true,
  "isActive": true
}
```

#### Response
```json
{
  "game": {
    "id": "game-123",
    "title": "Updated Game Title",
    // ... updated properties
    "updatedAt": "2024-01-25T10:30:00Z"
  },
  "message": "Game updated successfully"
}
```

### Delete Game (Admin Only)

#### Endpoint
```http
DELETE /api/games/[slug]
```

#### Authentication
Requires admin role.

#### Response
```json
{
  "message": "Game deleted successfully"
}
```

## 👤 Users API

### Get User Profile

#### Endpoint
```http
GET /api/users/profile
```

#### Authentication
Requires valid session.

#### Response
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "username": "gamer123",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "/images/avatars/user-123.jpg",
    "balance": 0,
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-20T12:30:00Z",
    "stats": {
      "gamesPlayed": 45,
      "totalPlayTime": 7200,
      "favoriteGames": 12,
      "multiplayerWins": 23
    }
  }
}
```

### Update User Profile

#### Endpoint
```http
PUT /api/users/profile
```

#### Authentication
Requires valid session.

#### Request Body
```json
{
  "username": "newusername",
  "firstName": "John",
  "lastName": "Smith",
  "avatar": "/images/avatars/new-avatar.jpg"
}
```

#### Response
```json
{
  "user": {
    "id": "user-123",
    "username": "newusername",
    "firstName": "John",
    "lastName": "Smith",
    // ... other properties
    "updatedAt": "2024-01-25T11:45:00Z"
  },
  "message": "Profile updated successfully"
}
```

### Get User Game History

#### Endpoint
```http
GET /api/users/game-history
```

#### Authentication
Requires valid session.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Sessions per page |
| `gameId` | string | - | Filter by specific game |

#### Response
```json
{
  "sessions": [
    {
      "id": "session-123",
      "gameId": "game-123",
      "game": {
        "title": "Snake Battle",
        "slug": "snake-battle",
        "thumbnail": "/images/games/snake-battle.jpg"
      },
      "startTime": "2024-01-20T14:30:00Z",
      "endTime": "2024-01-20T14:45:00Z",
      "duration": 900,
      "score": 1250,
      "achievements": ["first_win", "speed_demon"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3
  }
}
```

## ⭐ Favorites API

### Get User Favorites

#### Endpoint
```http
GET /api/users/favorites
```

#### Authentication
Requires valid session.

#### Response
```json
{
  "favorites": [
    {
      "id": "fav-123",
      "gameId": "game-123",
      "game": {
        "id": "game-123",
        "title": "Snake Battle",
        "slug": "snake-battle",
        "thumbnail": "/images/games/snake-battle.jpg",
        "category": {
          "name": "Action",
          "slug": "action"
        }
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Add Game to Favorites

#### Endpoint
```http
POST /api/users/favorites
```

#### Authentication
Requires valid session.

#### Request Body
```json
{
  "gameId": "game-123"
}
```

#### Response
```json
{
  "favorite": {
    "id": "fav-456",
    "gameId": "game-123",
    "userId": "user-123",
    "createdAt": "2024-01-25T12:00:00Z"
  },
  "message": "Game added to favorites"
}
```

### Remove Game from Favorites

#### Endpoint
```http
DELETE /api/users/favorites/[gameId]
```

#### Authentication
Requires valid session.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `gameId` | string | Game ID to remove from favorites |

#### Response
```json
{
  "message": "Game removed from favorites"
}
```

## 🏷 Categories API

### Get All Categories

#### Endpoint
```http
GET /api/categories
```

#### Response
```json
{
  "categories": [
    {
      "id": "cat-1",
      "name": "Action",
      "slug": "action",
      "description": "Fast-paced action games",
      "icon": "⚡",
      "order": 1,
      "isActive": true,
      "gameCount": 15,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Category with Games

#### Endpoint
```http
GET /api/categories/[slug]
```

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Category slug |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Games per page |

#### Response
```json
{
  "category": {
    "id": "cat-1",
    "name": "Action",
    "slug": "action",
    "description": "Fast-paced action games",
    "icon": "⚡",
    "order": 1,
    "isActive": true
  },
  "games": [
    {
      "id": "game-123",
      "title": "Snake Battle",
      "slug": "snake-battle",
      // ... other game properties
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 15,
    "totalPages": 1
  }
}
```

## 🔧 Admin API

### Get Admin Dashboard Stats

#### Endpoint
```http
GET /api/admin/stats
```

#### Authentication
Requires admin role.

#### Response
```json
{
  "stats": {
    "users": {
      "total": 1250,
      "active": 1100,
      "newThisMonth": 85
    },
    "games": {
      "total": 45,
      "active": 42,
      "featured": 8
    },
    "sessions": {
      "today": 320,
      "thisWeek": 2100,
      "thisMonth": 8500
    },
    "multiplayer": {
      "activeRooms": 12,
      "activePlayers": 48,
      "totalGamesPlayed": 15600
    }
  }
}
```

### Get All Users (Admin)

#### Endpoint
```http
GET /api/admin/users
```

#### Authentication
Requires admin role.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Users per page |
| `search` | string | - | Search by username or email |
| `role` | string | - | Filter by role |
| `status` | string | - | Filter by active status |

#### Response
```json
{
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "username": "gamer123",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-10T08:00:00Z",
      "lastLoginAt": "2024-01-24T15:30:00Z",
      "stats": {
        "gamesPlayed": 45,
        "totalPlayTime": 7200
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 1250,
    "totalPages": 25
  }
}
```

### Update User (Admin)

#### Endpoint
```http
PUT /api/admin/users/[userId]
```

#### Authentication
Requires admin role.

#### Request Body
```json
{
  "role": "admin",
  "isActive": false,
  "balance": 100
}
```

#### Response
```json
{
  "user": {
    "id": "user-123",
    "role": "admin",
    "isActive": false,
    "balance": 100,
    // ... other properties
    "updatedAt": "2024-01-25T13:15:00Z"
  },
  "message": "User updated successfully"
}
```

## 🎯 Multiplayer WebSocket API

### Connection

#### WebSocket URL
```
ws://localhost:3002
```

#### Connection Example
```typescript
import { Client } from 'colyseus.js';

const client = new Client('ws://localhost:3002');
```

### Room Operations

#### Create Room
```typescript
const room = await client.create('snake_game', {
  isPrivate: false,
  maxPlayers: 8,
  gameSettings: {
    difficulty: 'normal',
    powerUps: true
  }
});
```

#### Join Room
```typescript
// Join by room ID
const room = await client.joinById('room-123');

// Join by room code
const room = await client.join('snake_game', { roomCode: 'ABC123' });

// Quick match
const room = await client.join('snake_game');
```

#### Room Events
```typescript
// Player joined
room.onStateChange((state) => {
  console.log('Room state updated:', state);
});

// Player joined/left
room.onMessage('player_joined', (player) => {
  console.log('Player joined:', player);
});

room.onMessage('player_left', (player) => {
  console.log('Player left:', player);
});

// Game events
room.onMessage('game_started', () => {
  console.log('Game started!');
});

room.onMessage('game_ended', (results) => {
  console.log('Game ended:', results);
});
```

### Game Messages

#### Snake Game Messages
```typescript
// Player movement
room.send('move', { direction: 'UP' });

// Shoot projectile
room.send('shoot', { target: { x: 100, y: 200 } });

// Activate power-up
room.send('activate_armor');
```

#### Box Jump Game Messages
```typescript
// Complete level
room.send('level_completed');

// Player died
room.send('player_died');

// Finish turn
room.send('turn_finished');
```

#### Universal Messages
```typescript
// Set ready status
room.send('ready', { isReady: true });

// Start game (host only)
room.send('start_game');

// Vote for rematch
room.send('rematch', { vote: true });

// Leave room
room.leave();
```

## 📊 Health and Monitoring

### Application Health

#### Endpoint
```http
GET /api/health
```

#### Response
```json
{
  "status": "healthy",
  "timestamp": 1706184000000,
  "uptime": 86400000,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "multiplayer": "healthy"
  },
  "metrics": {
    "memoryUsage": "45%",
    "cpuUsage": "12%",
    "activeConnections": 150
  }
}
```

### Multiplayer Server Health

#### Endpoint
```http
GET /multiplayer/health
```

#### Response
```json
{
  "status": "healthy",
  "timestamp": 1706184000000,
  "uptime": 86400000,
  "rooms": {
    "total": 25,
    "active": 18,
    "empty": 7
  },
  "players": {
    "total": 72,
    "peak": 120
  },
  "performance": {
    "memoryUsage": "38%",
    "cpuUsage": "8%",
    "eventLoopDelay": "2ms"
  }
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": "Error type or message",
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "timestamp": 1706184000000,
  "details": {
    "field": "validation error details"
  }
}
```

### Common HTTP Status Codes

| Status | Description | Usage |
|--------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Examples

#### Validation Error
```json
{
  "error": "Validation failed",
  "message": "The provided data is invalid",
  "code": "VALIDATION_ERROR",
  "timestamp": 1706184000000,
  "details": {
    "title": "Title is required",
    "email": "Invalid email format"
  }
}
```

#### Authentication Error
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to access this resource",
  "code": "AUTH_REQUIRED",
  "timestamp": 1706184000000
}
```

#### Rate Limit Error
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": 1706184000000,
  "retryAfter": 900
}
```

## 📝 Usage Examples

### Complete Game Fetching Example
```typescript
async function fetchGameData() {
  try {
    // Fetch games with error handling
    const response = await fetch('/api/games?featured=true&limit=10');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Failed to fetch games:', error);
    throw error;
  }
}
```

### User Profile Management Example
```typescript
async function updateUserProfile(profileData: Partial<UserProfile>) {
  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}
```

### Multiplayer Game Integration Example
```typescript
class MultiplayerGameClient {
  private client: Client;
  private room: Room | null = null;
  
  constructor(serverUrl: string) {
    this.client = new Client(serverUrl);
  }
  
  async createRoom(gameType: string, options: any) {
    try {
      this.room = await this.client.create(gameType, options);
      this.setupEventHandlers();
      return this.room;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }
  
  private setupEventHandlers() {
    if (!this.room) return;
    
    this.room.onStateChange((state) => {
      this.handleStateUpdate(state);
    });
    
    this.room.onMessage('*', (type, message) => {
      this.handleMessage(type, message);
    });
    
    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
    });
  }
  
  sendGameAction(type: string, data: any) {
    if (this.room) {
      this.room.send(type, data);
    }
  }
}
```

This API documentation provides comprehensive coverage of all available endpoints and their usage. For additional examples and integration guides, refer to the usage instructions and code examples in the repository.