# The Portal

A modern gaming portal built with Next.js 14, TypeScript, and Tailwind CSS.
It’s a social platform for hyper-casual multiplayer games, where players can create or join rooms, challenge friends, and even bet real money on their own skills to compete for rewards.

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
   # Option 1: Quick setup with Docker (recommended)
   npm run db:init
   
   # Option 2: Manual setup
   npm run db:up          # Start PostgreSQL and Redis
   npm run db:generate    # Generate Prisma client
   npm run db:migrate     # Run database migrations
   ```

## 🐳 Docker Deployment

### Quick Start with Docker

Run the entire application stack with Docker:

```bash
# Production mode (recommended)
npm run docker:start

# Development mode (with hot reload)
npm run docker:dev
```

### Docker Commands

```bash
# Start production environment
npm run docker:start

# Start development environment
npm run docker:dev

# Stop all services
npm run docker:stop

# Stop development services
npm run docker:stop:dev

# View logs
npm run docker:logs

# View development logs
npm run docker:logs:dev

# Clean up and restart (removes old images)
npm run docker:clean
```

### Manual Docker Setup

1. **Production deployment**:
   ```bash
   docker compose up --build -d
   ```

2. **Development with hot reload**:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

3. **Database only** (if you want to run the app locally):
   ```bash
   docker compose -f docker-compose.db.yml up -d
   ```

### Docker Services

The Docker setup includes:

- **PostgreSQL** (port 5432) - Main database
- **Redis** (port 6379) - Caching and multiplayer sessions
- **Next.js App** (port 3000) - Main application
- **Multiplayer Server** (port 3002) - WebSocket server for real-time games

### Health Checks

- Application: http://localhost:3000/api/health
- Multiplayer Server: http://localhost:3002/health
- Database: Automatic health checks in Docker

### Environment Variables for Docker

The Docker setup uses the following environment variables:

```env
# Database
DATABASE_URL=postgresql://gameuser:gamepass123@postgres:5432/game_portal

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Multiplayer
NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:3002
REDIS_URL=redis://redis:6379
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