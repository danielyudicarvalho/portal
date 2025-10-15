# Installation & Setup Guide

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Docker** (optional but recommended) - [Download here](https://www.docker.com/)
- **PostgreSQL** (if not using Docker) - [Download here](https://www.postgresql.org/)
- **Redis** (if not using Docker) - [Download here](https://redis.io/)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space
- **Network**: Internet connection for dependencies

## 📥 Installation Methods

### Method 1: Docker Setup (Recommended)

Docker provides the easiest and most consistent setup experience.

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/game-portal.git
cd game-portal
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local  # or use your preferred editor
```

#### 3. Start with Docker Compose
```bash
# Start all services (development mode)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### 4. Access the Application
- **Web Application**: http://localhost:3000
- **Multiplayer Server**: ws://localhost:3002
- **Database**: localhost:5432 (if exposed)
- **Redis**: localhost:6379 (if exposed)

### Method 2: Manual Setup

For developers who prefer manual control over their environment.

#### 1. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/game-portal.git
cd game-portal

# Install dependencies
npm install
```

#### 2. Database Setup
```bash
# Start PostgreSQL (varies by system)
# Ubuntu/Debian:
sudo systemctl start postgresql

# macOS with Homebrew:
brew services start postgresql

# Create database
createdb game_portal

# Set up Prisma
npx prisma migrate dev
npx prisma generate
```

#### 3. Redis Setup
```bash
# Start Redis (varies by system)
# Ubuntu/Debian:
sudo systemctl start redis

# macOS with Homebrew:
brew services start redis
```

#### 4. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/game_portal"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Multiplayer
NEXT_PUBLIC_MULTIPLAYER_URL="ws://localhost:3002"
MULTIPLAYER_PORT=3002
```

#### 5. Start Development Servers
```bash
# Terminal 1: Next.js application
npm run dev

# Terminal 2: Multiplayer server
npm run dev:multiplayer

# Or start both together
npm run dev:full
```

## 🔧 Environment Configuration

### Required Environment Variables

#### Database Configuration
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# For Docker setup
DATABASE_URL="postgresql://postgres:password@postgres:5432/game_portal"
```

#### Authentication Configuration
```env
# NextAuth.js secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-very-secure-secret-key"

# Application URL
NEXTAUTH_URL="http://localhost:3000"

# OAuth providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

#### Multiplayer Configuration
```env
# Multiplayer server settings
MULTIPLAYER_PORT=3002
NEXT_PUBLIC_MULTIPLAYER_URL="ws://localhost:3002"

# Redis for multiplayer scaling
REDIS_URL="redis://localhost:6379"

# CORS settings
CORS_ORIGIN="http://localhost:3000"
```

#### Optional Configuration
```env
# Node environment
NODE_ENV="development"

# Logging level
LOG_LEVEL="debug"

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# File upload limits
MAX_FILE_SIZE=10485760
```

### Environment Files
- **`.env.local`** - Local development (gitignored)
- **`.env.example`** - Template file (committed)
- **`.env.production`** - Production environment (gitignored)
- **`.env.test`** - Testing environment (gitignored)

## 🗄 Database Setup

### Using Prisma (Recommended)

#### 1. Database Migration
```bash
# Run migrations
npx prisma migrate dev

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

#### 2. Database Seeding
```bash
# Seed with sample data
npx prisma db seed

# Custom seed script
npm run db:seed
```

#### 3. Database Management
```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# View database schema
npx prisma db pull

# Format schema file
npx prisma format
```

### Manual Database Setup

If you prefer to set up the database manually:

#### 1. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE game_portal;

-- Create user (optional)
CREATE USER game_portal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE game_portal TO game_portal_user;
```

#### 2. Run SQL Schema
```bash
# Apply schema manually
psql -U postgres -d game_portal -f prisma/schema.sql
```

## 🔧 Development Tools Setup

### VS Code Configuration

#### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### Workspace Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Git Hooks Setup

#### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# Set up commit message hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

## 🧪 Testing Setup

### Test Environment Configuration

#### 1. Install Testing Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

#### 2. Configure Jest
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

#### 3. Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🐳 Docker Development

### Docker Compose Services

#### Development Configuration
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
  
  multiplayer:
    build:
      context: .
      dockerfile: Dockerfile.multiplayer
    ports:
      - "3002:3002"
    volumes:
      - .:/app
      - /app/node_modules
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: game_portal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Docker Commands
```bash
# Build images
docker-compose -f docker-compose.dev.yml build

# Start services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec app npm run migrate

# Stop services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (reset data)
docker-compose -f docker-compose.dev.yml down -v
```

## 🔍 Verification & Testing

### Health Checks

#### 1. Application Health
```bash
# Check Next.js application
curl http://localhost:3000/api/health

# Check multiplayer server
curl http://localhost:3002/health

# Check database connection
npm run db:check
```

#### 2. Service Status
```bash
# Check all services
docker-compose -f docker-compose.dev.yml ps

# Check logs for errors
docker-compose -f docker-compose.dev.yml logs --tail=50
```

### Functionality Testing

#### 1. Basic Features
- [ ] Home page loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Games page displays games
- [ ] Individual games load and play

#### 2. Multiplayer Features
- [ ] Multiplayer server starts
- [ ] Can create multiplayer rooms
- [ ] Can join multiplayer games
- [ ] Real-time synchronization works

#### 3. PWA Features
- [ ] Service worker registers
- [ ] Offline functionality works
- [ ] Install prompt appears
- [ ] Push notifications work (if enabled)

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :3002

# Kill process
kill -9 <PID>

# Or use different ports
PORT=3001 npm run dev
MULTIPLAYER_PORT=3003 npm run dev:multiplayer
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U postgres -h localhost -p 5432 -d game_portal

# Reset database
npx prisma migrate reset
```

#### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml build --no-cache

# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a

# Check Docker logs
docker-compose -f docker-compose.dev.yml logs app
```

### Performance Issues

#### Slow Development Server
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Disable type checking during development
SKIP_TYPE_CHECK=true npm run dev
```

#### Database Performance
```bash
# Analyze slow queries
npx prisma studio

# Check database indexes
psql -U postgres -d game_portal -c "\d+ table_name"
```

## 📚 Next Steps

After successful installation:

1. **Explore the Application** - Browse through different pages and features
2. **Read the Documentation** - Check out other documentation files
3. **Run Tests** - Ensure everything is working correctly
4. **Start Development** - Begin making your changes
5. **Join the Community** - Connect with other developers

### Useful Commands Reference

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:multiplayer  # Start multiplayer server
npm run dev:full         # Start both servers

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate client

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Run linting
npm run type-check       # Check TypeScript

# Building
npm run build            # Build for production
npm run start            # Start production server

# Docker
docker-compose -f docker-compose.dev.yml up -d    # Start dev environment
docker-compose -f docker-compose.dev.yml down     # Stop dev environment
```

You're now ready to start developing with Game Portal! 🎮