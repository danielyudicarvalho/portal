# Game Portal

A modern gaming portal built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎮 Modern gaming platform interface
- 🔐 User authentication with NextAuth.js
- 📱 Responsive design with mobile-first approach
- 🎨 Dark theme with gaming aesthetics
- 🗄️ PostgreSQL database with Prisma ORM
- ⚡ Fast loading with Next.js App Router
- 🔍 Game search and filtering
- 👤 User profiles and favorites
- 🛡️ Admin interface for content management

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI
- **Icons**: Heroicons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Update the database URL and other configuration values.

3. **Set up the database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group
│   ├── games/             # Game-related pages
│   ├── admin/             # Admin interface
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Global styles and Tailwind config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Running With Redis (Multiplayer)

This project includes a Colyseus-based multiplayer server with Redis-backed Presence/Driver for distributed rooms and cross-process coordination.

What’s included
- Colyseus server: `server/multiplayer-server.js`
- Game rooms: `server/rooms/*`
- Redis integration: enabled automatically when `REDIS_URL` is provided
- Monitor UI (dev only): `/colyseus`

### Option A: Docker Compose (dev: app + multiplayer + redis)

1) Start everything
- `docker compose -f docker-compose.dev.yml up --build`

2) URLs
- Next.js app: `http://localhost:3000`
- Multiplayer WS: `ws://localhost:3002`
- Health: `http://localhost:3002/health`
- Colyseus monitor (dev): `http://localhost:3002/colyseus`

3) Environment
- `docker-compose.dev.yml` sets `REDIS_URL=redis://redis:6379` and `NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:3002`.

### Option B: Docker Compose (multiplayer only)

If you only need Redis + the multiplayer server (and run the app separately):
- `docker compose -f docker-compose.multiplayer.yml up --build`

Services exposed
- Multiplayer WS: `ws://localhost:3002`
- Health: `http://localhost:3002/health`
- Redis: `redis://localhost:6379`

### Option C: Local Node + local Redis

1) Start Redis (Docker)
- `docker run --name gp-redis -p 6379:6379 -d redis:7-alpine`

2) Set env
- Copy `.env.example` to `.env.local` if you haven’t: `cp .env.example .env.local`
- Ensure `.env.local` contains: `REDIS_URL=redis://localhost:6379`
- Ensure the frontend points to the multiplayer URL you will use, e.g. `NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:3002`

3) Install and run
- `npm install`
- `npm run dev:multiplayer`

4) Verify
- `curl http://localhost:3002/health`
- Visit `http://localhost:3002/colyseus` (dev only)

### Environment Variables

The multiplayer server reads the following (set via `.env.local` or container env):
- `REDIS_URL` (recommended): Redis connection string. Example: `redis://localhost:6379` or `redis://:password@redis-host:6379`
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`: alternative to `REDIS_URL`
- `MULTIPLAYER_PORT`: default `3002`
- `CORS_ORIGIN`: allowed origin for the multiplayer server (e.g., `http://localhost:3000`)
- `NODE_ENV`: `development` enables the Colyseus monitor at `/colyseus`
- `NEXT_PUBLIC_MULTIPLAYER_URL`: frontend WebSocket endpoint (e.g., `ws://localhost:3002`)

### How Redis Is Used

- Presence: backed by Redis for distributed presence, room listing, and queries
- Driver: stores room process metadata in Redis to support multiple server instances
- Pub/Sub: rooms publish lifecycle/state changes on a channel the lobby subscribes to (`lobby:events`)

### Scaling Out (multi-instances)

Run multiple multiplayer server instances pointing to the same `REDIS_URL`:
- Docker Compose example (dev): `docker compose -f docker-compose.dev.yml up --scale multiplayer-server=2`
- Or run multiple processes/containers manually with the same `REDIS_URL`

Notes
- For host port conflicts, either remove host port mapping for scaled services and put a reverse proxy in front, or map different host ports (e.g., `3003:3002`) behind a load balancer.

### Troubleshooting

- Port 3002 already in use
  - Change host mapping (e.g., map to `3003:3002`) or set `MULTIPLAYER_PORT=3003` and update `NEXT_PUBLIC_MULTIPLAYER_URL` accordingly.
- Redis auth
  - Use `REDIS_URL=redis://:password@host:6379` in production.
- Monitor not available
  - The Colyseus monitor is enabled only in development (`NODE_ENV !== 'production'`).
- Room list not updating across processes
  - Ensure all instances share the same `REDIS_URL` and Redis is reachable.

### Verification Checklist

- `curl http://localhost:3002/health` returns JSON with server/room stats
- `http://localhost:3002/colyseus` shows the Colyseus monitor (dev)
- The frontend `NEXT_PUBLIC_MULTIPLAYER_URL` matches the multiplayer server address
- Redis is reachable at `REDIS_URL`

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **User**: User accounts with authentication
- **Game**: Game catalog with metadata
- **GameCategory**: Game categorization
- **GameSession**: User game sessions
- **UserFavorite**: User favorite games

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
