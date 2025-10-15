# Troubleshooting Guide

## 🚨 Common Issues & Solutions

This guide covers the most frequently encountered issues when developing, deploying, or using the Game Portal application, along with step-by-step solutions.

## 🔧 Development Issues

### Node.js & NPM Issues

#### Issue: `npm install` fails with permission errors
```bash
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solutions:**
```bash
# Option 1: Use a Node version manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Option 2: Change npm's default directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

#### Issue: `Module not found` errors after installation
```bash
Error: Cannot find module '@next/swc-linux-x64-gnu'
```

**Solutions:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# For platform-specific modules
npm rebuild

# If using Docker, ensure correct platform
docker build --platform linux/amd64 .
```

#### Issue: TypeScript compilation errors
```bash
Error: Type 'string' is not assignable to type 'never'
```

**Solutions:**
```bash
# Update TypeScript and regenerate types
npm update typescript
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run build

# Check tsconfig.json for strict settings
{
  "compilerOptions": {
    "strict": false,  // Temporarily disable for debugging
    "skipLibCheck": true
  }
}
```

### Database Issues

#### Issue: Database connection fails
```bash
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS

# Check connection string in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Test connection
psql -h localhost -p 5432 -U username -d database_name
```

#### Issue: Prisma migration fails
```bash
Error: P3009: migrate found failed migration
```

**Solutions:**
```bash
# Reset database (development only)
npx prisma migrate reset

# Mark migration as applied
npx prisma migrate resolve --applied "migration_name"

# Force reset and reseed
npx prisma db push --force-reset
npx prisma db seed
```

#### Issue: Database schema out of sync
```bash
Error: The database schema is not in sync with your Prisma schema
```

**Solutions:**
```bash
# Generate new migration
npx prisma migrate dev --name fix_schema

# Push schema changes without migration
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### Next.js Issues

#### Issue: Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# Find process using port
lsof -ti:3000
netstat -tulpn | grep :3000

# Kill process
kill -9 $(lsof -ti:3000)

# Use different port
PORT=3001 npm run dev

# Or set in package.json
"dev": "next dev -p 3001"
```

#### Issue: Build fails with memory errors
```bash
Error: JavaScript heap out of memory
```

**Solutions:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"

# For Docker builds
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

#### Issue: Hot reload not working
```bash
# Changes not reflected in browser
```

**Solutions:**
```bash
# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev

# Check for file permission issues
sudo chown -R $(whoami) .
```

### Multiplayer Server Issues

#### Issue: WebSocket connection fails
```bash
Error: WebSocket connection to 'ws://localhost:3002' failed
```

**Solutions:**
```bash
# Check if multiplayer server is running
curl http://localhost:3002/health

# Start multiplayer server
npm run dev:multiplayer

# Check firewall settings
sudo ufw allow 3002  # Linux
# Windows: Add firewall rule for port 3002

# Verify WebSocket URL in client
const client = new Client('ws://localhost:3002');
```

#### Issue: Redis connection fails
```bash
Error: Redis connection to localhost:6379 failed
```

**Solutions:**
```bash
# Check Redis status
redis-cli ping

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis  # macOS

# Check Redis configuration
redis-cli config get bind
redis-cli config get port

# Update Redis URL in environment
REDIS_URL="redis://localhost:6379"
```

#### Issue: Room creation fails
```bash
Error: Room "snake_game" not found
```

**Solutions:**
```bash
# Check room registration in multiplayer-server.js
gameServer.define('snake_game', SnakeRoom, {
  maxClients: 8,
});

# Restart multiplayer server
npm run dev:multiplayer

# Check server logs for errors
docker-compose logs multiplayer-server
```

## 🐳 Docker Issues

### Container Issues

#### Issue: Docker build fails
```bash
Error: failed to solve: process "/bin/sh -c npm install" did not complete successfully
```

**Solutions:**
```bash
# Clear Docker cache
docker system prune -a

# Build without cache
docker build --no-cache -t game-portal .

# Check Dockerfile syntax
docker build --progress=plain .

# Use multi-stage build for debugging
FROM node:18-alpine AS debug
WORKDIR /app
COPY package*.json ./
RUN npm install --verbose
```

#### Issue: Container exits immediately
```bash
Error: Container exits with code 0 or 1
```

**Solutions:**
```bash
# Check container logs
docker logs container_name

# Run container interactively
docker run -it game-portal /bin/sh

# Check health status
docker inspect --format='{{.State.Health.Status}}' container_name

# Verify environment variables
docker exec container_name env
```

#### Issue: Port binding fails
```bash
Error: bind: address already in use
```

**Solutions:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Use different port mapping
docker run -p 3001:3000 game-portal

# Stop conflicting containers
docker stop $(docker ps -q --filter "publish=3000")
```

### Docker Compose Issues

#### Issue: Services can't communicate
```bash
Error: getaddrinfo ENOTFOUND postgres
```

**Solutions:**
```bash
# Check network configuration
docker network ls
docker network inspect bridge

# Use service names for internal communication
DATABASE_URL="postgresql://postgres:password@postgres:5432/gameportal"

# Verify services are on same network
docker-compose ps
docker-compose logs postgres
```

#### Issue: Volume mounting fails
```bash
Error: invalid mount config for type "bind"
```

**Solutions:**
```bash
# Use absolute paths
volumes:
  - /absolute/path/to/project:/app

# Or use relative paths correctly
volumes:
  - .:/app
  - /app/node_modules  # Exclude node_modules

# Check file permissions
sudo chown -R $(whoami):$(whoami) .
```

## 🌐 Production Issues

### Deployment Issues

#### Issue: Build fails in production
```bash
Error: Module not found in production build
```

**Solutions:**
```bash
# Check dependencies vs devDependencies
npm install --production

# Verify all imports are correct
# Use absolute imports with path mapping
import { Component } from '@/components/Component';

# Check Next.js configuration
module.exports = {
  experimental: {
    outputStandalone: true,
  },
};
```

#### Issue: Environment variables not loaded
```bash
Error: process.env.DATABASE_URL is undefined
```

**Solutions:**
```bash
# Check environment file location
ls -la .env*

# Verify variable names (no spaces)
DATABASE_URL=postgresql://...
# Not: DATABASE_URL = postgresql://...

# For Docker, pass environment variables
docker run -e DATABASE_URL="..." game-portal

# Or use environment file
docker run --env-file .env.production game-portal
```

#### Issue: SSL/HTTPS issues
```bash
Error: Mixed content blocked
```

**Solutions:**
```bash
# Update all URLs to HTTPS
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Configure NGINX for SSL
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}

# Force HTTPS redirects
if ($scheme != "https") {
    return 301 https://$server_name$request_uri;
}
```

### Performance Issues

#### Issue: Slow page load times
```bash
# Pages taking >5 seconds to load
```

**Solutions:**
```bash
# Analyze bundle size
npm run build
npm run analyze

# Enable compression
# In next.config.js
module.exports = {
  compress: true,
  swcMinify: true,
};

# Optimize images
# Use Next.js Image component
import Image from 'next/image';

# Enable caching headers
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
```

#### Issue: High memory usage
```bash
# Server running out of memory
```

**Solutions:**
```bash
# Monitor memory usage
docker stats
htop

# Increase container memory
docker run -m 2g game-portal

# Optimize Node.js memory
NODE_OPTIONS="--max-old-space-size=2048"

# Check for memory leaks
node --inspect server.js
# Use Chrome DevTools for profiling
```

#### Issue: Database performance problems
```bash
# Slow database queries
```

**Solutions:**
```bash
# Add database indexes
CREATE INDEX idx_games_category_id ON games(category_id);
CREATE INDEX idx_users_email ON users(email);

# Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM games WHERE category_id = 1;

# Optimize Prisma queries
const games = await prisma.game.findMany({
  include: {
    category: true,  // Only include what you need
  },
  take: 20,  // Limit results
});
```

## 🎮 Game-Specific Issues

### Multiplayer Game Issues

#### Issue: Players can't join rooms
```bash
Error: Room not found or full
```

**Solutions:**
```bash
# Check room capacity
const room = await client.joinOrCreate('snake_game', {}, {
  maxClients: 8,
});

# Verify room registration
gameServer.define('snake_game', SnakeRoom);

# Check server logs
docker-compose logs multiplayer-server

# Test room creation manually
curl -X POST http://localhost:3002/api/rooms/create
```

#### Issue: Game state not synchronizing
```bash
# Players see different game states
```

**Solutions:**
```bash
# Check schema definitions
class GameState extends Schema {
  @type('string') gameId = '';
  @type({ map: Player }) players = new MapSchema();
}

# Verify state updates
this.state.players.set(client.sessionId, player);

# Check network connectivity
ping multiplayer-server
traceroute multiplayer-server
```

#### Issue: High latency in multiplayer games
```bash
# Delayed responses in real-time games
```

**Solutions:**
```bash
# Optimize tick rate
setSimulationInterval((deltaTime) => {
  this.update(deltaTime);
}, 100); // 10 FPS instead of 60 FPS

# Use delta compression
// Only send changed data
const deltaState = this.getStateDelta();

# Implement client-side prediction
// Predict movement locally, reconcile with server
```

### PWA Issues

#### Issue: Service worker not updating
```bash
# New version not loading
```

**Solutions:**
```bash
# Force service worker update
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.update());
});

# Clear service worker cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

# Check service worker registration
navigator.serviceWorker.getRegistration().then(registration => {
  console.log('SW registration:', registration);
});
```

#### Issue: App not installable
```bash
# Install prompt not showing
```

**Solutions:**
```bash
# Check manifest.json
curl https://yourdomain.com/manifest.json

# Verify HTTPS
# PWA requires HTTPS (except localhost)

# Check service worker
navigator.serviceWorker.controller

# Validate PWA criteria
# Use Chrome DevTools > Application > Manifest
```

#### Issue: Offline functionality not working
```bash
# App doesn't work offline
```

**Solutions:**
```bash
# Check cache strategies
// In service worker
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

# Verify cached resources
caches.open('app-cache').then(cache => {
  cache.keys().then(keys => console.log('Cached:', keys));
});
```

## 🔍 Debugging Tools & Techniques

### Browser Developer Tools

#### Chrome DevTools for PWA
```bash
# Application tab
- Manifest: Check PWA manifest
- Service Workers: Debug service worker
- Storage: Inspect caches and storage
- Background Services: Monitor background sync

# Network tab
- Offline: Test offline functionality
- Throttling: Simulate slow connections

# Performance tab
- Record: Profile app performance
- Lighthouse: PWA audit
```

#### Firefox Developer Tools
```bash
# Application tab (similar to Chrome)
# Network Monitor
# Performance Tools
# Storage Inspector
```

### Server-Side Debugging

#### Node.js Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Use Node.js inspector
node --inspect server/multiplayer-server.js

# Debug with VS Code
# Add to launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/multiplayer-server.js",
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### Database Debugging
```bash
# Enable Prisma query logging
// In schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}

# Use Prisma Studio
npx prisma studio

# Raw SQL debugging
const result = await prisma.$queryRaw`
  SELECT * FROM games WHERE title ILIKE ${'%snake%'}
`;
```

### Logging & Monitoring

#### Application Logging
```typescript
// Enhanced logging utility
class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  }

  static error(message: string, error?: Error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
}
```

#### Health Check Endpoints
```bash
# Application health
curl http://localhost:3000/api/health

# Multiplayer server health
curl http://localhost:3002/health

# Database health
curl http://localhost:3000/api/health/database
```

## 📞 Getting Help

### Before Asking for Help

1. **Check the logs** - Look at browser console, server logs, and Docker logs
2. **Search existing issues** - Check GitHub issues and documentation
3. **Reproduce the issue** - Create minimal reproduction steps
4. **Check environment** - Verify Node.js version, dependencies, and configuration

### Creating Bug Reports

#### Information to Include
```markdown
## Bug Report

### Environment
- OS: [e.g., macOS 12.0, Ubuntu 20.04, Windows 11]
- Node.js version: [e.g., 18.17.0]
- npm version: [e.g., 9.6.7]
- Browser: [e.g., Chrome 115.0]

### Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior
A clear description of what you expected to happen.

### Actual Behavior
A clear description of what actually happened.

### Screenshots/Logs
If applicable, add screenshots or log output.

### Additional Context
Any other context about the problem.
```

### Community Resources

- **GitHub Issues** - Report bugs and request features
- **Documentation** - Check all documentation files
- **Stack Overflow** - Search for similar issues
- **Discord/Slack** - Real-time community help (if available)

### Professional Support

For production issues or urgent problems:
1. **Priority Support** - Contact maintainers directly
2. **Consulting Services** - Professional development help
3. **Code Review** - Expert code review services

Remember: The more information you provide, the easier it is to help you solve the problem!