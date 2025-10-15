# Usage Instructions

## 🎮 Getting Started

This guide covers how to use, test, and deploy the Game Portal application for different user types: end users, developers, and administrators.

## 👤 End User Guide

### Accessing the Application

#### Web Browser
1. **Open your browser** and navigate to the application URL
2. **Create an account** or log in with existing credentials
3. **Browse games** from the home page or games section
4. **Click on any game** to start playing immediately

#### Progressive Web App (PWA)
1. **Visit the website** in a supported browser (Chrome, Firefox, Safari, Edge)
2. **Look for the install prompt** or click the install button in the address bar
3. **Add to home screen** on mobile devices
4. **Launch like a native app** from your device's app drawer or desktop

### Playing Games

#### Single Player Games
1. **Browse the game catalog** on the home page
2. **Click on a game card** to open the game
3. **Read the instructions** if provided
4. **Use keyboard/mouse or touch controls** to play
5. **Your progress is automatically saved** to your profile

#### Multiplayer Games
1. **Navigate to multiplayer games** section
2. **Choose a game** (Snake Battle, Box Jump Challenge, etc.)
3. **Select game mode**:
   - **Quick Match**: Join an existing room or create a new one
   - **Create Private Room**: Get a room code to share with friends
   - **Join Private Room**: Enter a room code from a friend
4. **Wait in the lobby** for other players to join
5. **Set your ready status** when you're prepared to play
6. **Play the game** with real-time multiplayer action
7. **View results** and vote for rematch if desired

### User Profile Management

#### Profile Settings
1. **Click on your profile icon** in the top navigation
2. **Edit your information**:
   - Username and display name
   - Avatar image
   - Email preferences
   - Privacy settings
3. **Save changes** to update your profile

#### Game History
1. **Access your profile** from the navigation menu
2. **View your game history** including:
   - Games played and time spent
   - Scores and achievements
   - Multiplayer match results
   - Favorite games list
3. **Filter and search** your gaming history

#### Favorites Management
1. **Click the heart icon** on any game card to add to favorites
2. **Access favorites** from your profile or navigation menu
3. **Remove favorites** by clicking the heart icon again
4. **Organize favorites** by categories or custom lists

### Offline Usage

#### PWA Offline Features
1. **Install the PWA** for best offline experience
2. **Previously visited games** are cached automatically
3. **Core navigation** works without internet
4. **Offline indicator** shows connection status
5. **Background sync** queues actions when connection returns

## 👨‍💻 Developer Guide

### Development Workflow

#### Starting Development
```bash
# Clone and setup (see Installation Guide)
git clone <repository-url>
cd game-portal
npm install

# Start development servers
npm run dev:full  # Starts both Next.js and multiplayer server

# Or start individually
npm run dev              # Next.js only
npm run dev:multiplayer  # Multiplayer server only
```

#### Development URLs
- **Next.js App**: http://localhost:3000
- **Multiplayer Server**: ws://localhost:3002
- **Colyseus Monitor**: http://localhost:3002/colyseus
- **Database Studio**: Run `npx prisma studio`

### Code Development

#### Adding New Games

##### Single Player Game
1. **Create game directory** in `public/games/your-game/`
2. **Add game files**:
   ```
   your-game/
   ├── index.html    # Game entry point
   ├── game.js       # Game logic
   ├── style.css     # Game styles
   └── assets/       # Game assets
   ```
3. **Register in database** through admin interface or seed script
4. **Test the game** by accessing `/games/your-game-slug`

##### Multiplayer Game
1. **Create room class** in `server/rooms/YourGameRoom.js`:
   ```javascript
   const { BaseGameRoom } = require('./BaseGameRoom');
   
   class YourGameRoom extends BaseGameRoom {
     onCreate(options = {}) {
       super.onCreate(options);
       // Your game initialization
     }
     
     onGameMessage(client, type, message) {
       // Handle game-specific messages
     }
   }
   ```

2. **Register room** in `server/multiplayer-server.js`:
   ```javascript
   gameServer.define('your_game', YourGameRoom, {
     maxClients: 8,
   });
   ```

3. **Create client integration** using the Multiplayer SDK:
   ```javascript
   const sdk = new MultiplayerSDK({
     serverUrl: 'ws://localhost:3002'
   });
   
   // Join game
   await sdk.createRoom('your_game');
   ```

#### Adding New Features

##### Frontend Components
1. **Create component** in appropriate `src/components/` subdirectory
2. **Follow naming conventions** (PascalCase for components)
3. **Add TypeScript interfaces** for props and state
4. **Include tests** in `__tests__` directory
5. **Export from index file** for clean imports

##### API Endpoints
1. **Create API route** in `src/app/api/` directory
2. **Follow REST conventions** for URL structure
3. **Add input validation** and error handling
4. **Include authentication** where required
5. **Document the endpoint** in API documentation

##### Database Changes
1. **Modify Prisma schema** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name your-migration-name
   ```
3. **Update seed data** if necessary
4. **Regenerate Prisma client**:
   ```bash
   npx prisma generate
   ```

### Testing

#### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- GameCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

#### Writing Tests

##### Component Tests
```javascript
import { render, screen } from '@testing-library/react';
import { GameCard } from '../GameCard';

describe('GameCard', () => {
  it('should render game title', () => {
    const game = { id: '1', title: 'Test Game', slug: 'test-game' };
    render(<GameCard game={game} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });
});
```

##### API Tests
```javascript
import { createMocks } from 'node-mocks-http';
import handler from '../api/games';

describe('/api/games', () => {
  it('should return games list', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

#### Integration Testing

##### Multiplayer Testing
```bash
# Test multiplayer server
node test-connection-management.js

# Test specific game rooms
node test-lobby-unit.js
node test-matchmaking.js

# Test room monitoring
node test-room-monitoring.js
```

### Debugging

#### Frontend Debugging
1. **Use React DevTools** browser extension
2. **Enable Next.js debug mode**:
   ```bash
   DEBUG=* npm run dev
   ```
3. **Check browser console** for errors and warnings
4. **Use VS Code debugger** with launch configuration

#### Backend Debugging
1. **Enable debug logging**:
   ```bash
   LOG_LEVEL=debug npm run dev:multiplayer
   ```
2. **Use Colyseus Monitor** at http://localhost:3002/colyseus
3. **Check server logs** for errors and performance metrics
4. **Use Node.js debugger** with `--inspect` flag

#### Database Debugging
1. **Use Prisma Studio** for visual database inspection
2. **Enable query logging** in Prisma configuration
3. **Check PostgreSQL logs** for slow queries
4. **Use database performance monitoring** tools

## 🛠 Administrator Guide

### Admin Interface Access

#### Accessing Admin Panel
1. **Log in** with an admin account
2. **Navigate to** `/admin` URL
3. **Use admin navigation** to access different sections
4. **Admin privileges** are required for all admin operations

### Content Management

#### Game Management
1. **Add New Games**:
   - Navigate to Admin → Games → Add New
   - Fill in game details (title, description, thumbnail)
   - Set category and tags
   - Configure game settings
   - Publish or save as draft

2. **Edit Existing Games**:
   - Find game in games list
   - Click edit button
   - Modify game information
   - Update publication status

3. **Game Categories**:
   - Manage game categories and subcategories
   - Set category icons and descriptions
   - Organize category hierarchy
   - Control category visibility

#### User Management
1. **View Users**:
   - Access user list with search and filters
   - View user profiles and activity
   - Check user statistics and engagement

2. **Moderate Users**:
   - Suspend or ban problematic users
   - Reset user passwords
   - Manage user roles and permissions
   - Handle user reports and complaints

3. **User Analytics**:
   - Track user registration trends
   - Monitor user engagement metrics
   - Analyze user behavior patterns
   - Generate user reports

### System Monitoring

#### Server Health
1. **Health Dashboard**:
   - Monitor server uptime and performance
   - Check database connection status
   - View Redis cache performance
   - Monitor multiplayer server status

2. **Performance Metrics**:
   - Track response times and throughput
   - Monitor memory and CPU usage
   - Check error rates and logs
   - Analyze performance trends

#### Game Analytics
1. **Game Performance**:
   - Track game popularity and usage
   - Monitor game load times
   - Check game error rates
   - Analyze player engagement per game

2. **Multiplayer Metrics**:
   - Monitor active rooms and players
   - Track connection quality
   - Check matchmaking efficiency
   - Analyze multiplayer engagement

### Configuration Management

#### System Settings
1. **Application Configuration**:
   - Update site settings and branding
   - Configure authentication providers
   - Set rate limiting and security policies
   - Manage feature flags

2. **Game Settings**:
   - Configure game categories and tags
   - Set game approval workflows
   - Manage game metadata requirements
   - Control game visibility rules

#### Security Management
1. **Access Control**:
   - Manage admin roles and permissions
   - Configure authentication settings
   - Set password policies
   - Monitor security events

2. **Content Moderation**:
   - Set content filtering rules
   - Configure automated moderation
   - Manage reported content
   - Handle abuse reports

## 🚀 Deployment Guide

### Development Deployment

#### Local Development
```bash
# Standard development setup
npm run dev:full

# With specific environment
NODE_ENV=development npm run dev:full

# With debugging enabled
DEBUG=* npm run dev:full
```

#### Docker Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Staging Deployment

#### Staging Environment Setup
```bash
# Build for staging
NODE_ENV=staging npm run build

# Start staging server
NODE_ENV=staging npm start

# Or use Docker
docker-compose -f docker-compose.staging.yml up -d
```

#### Staging Testing
1. **Functional Testing**: Test all features in staging environment
2. **Performance Testing**: Load test with realistic data
3. **Security Testing**: Verify security configurations
4. **Integration Testing**: Test third-party integrations

### Production Deployment

#### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup procedures tested

#### Production Build
```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm start

# Or build Docker images
docker build -f Dockerfile.nextjs -t game-portal:latest .
docker build -f Dockerfile.multiplayer -t game-portal-multiplayer:latest .
```

#### Production Deployment
```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.multiplayer.yml up -d

# Or deploy to cloud platform
# (AWS, Google Cloud, Azure, etc.)
```

### Post-Deployment

#### Health Checks
```bash
# Check application health
curl https://yourdomain.com/api/health

# Check multiplayer server
curl https://yourdomain.com/multiplayer/health

# Monitor logs
docker-compose logs -f
```

#### Monitoring Setup
1. **Application Monitoring**: Set up APM tools
2. **Infrastructure Monitoring**: Monitor servers and databases
3. **User Analytics**: Track user behavior and engagement
4. **Error Tracking**: Set up error reporting and alerting

#### Backup Procedures
1. **Database Backups**: Automated daily backups
2. **File Backups**: Static assets and user uploads
3. **Configuration Backups**: Environment and configuration files
4. **Recovery Testing**: Regular backup restoration tests

## 📊 Performance Optimization

### Frontend Optimization

#### Bundle Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize images
npm run optimize:images

# Generate PWA assets
npm run generate:pwa-assets
```

#### Performance Monitoring
1. **Lighthouse Audits**: Regular performance audits
2. **Core Web Vitals**: Monitor loading, interactivity, visual stability
3. **User Experience**: Track real user performance metrics
4. **Mobile Performance**: Optimize for mobile devices

### Backend Optimization

#### Database Optimization
```bash
# Analyze query performance
npx prisma studio

# Optimize database indexes
psql -d game_portal -c "EXPLAIN ANALYZE SELECT ..."

# Monitor slow queries
tail -f /var/log/postgresql/postgresql.log
```

#### Server Optimization
1. **Caching Strategy**: Implement Redis caching
2. **Connection Pooling**: Optimize database connections
3. **Load Balancing**: Distribute traffic across servers
4. **CDN Integration**: Serve static assets from CDN

This comprehensive usage guide should help users, developers, and administrators effectively work with the Game Portal application. For specific technical issues, refer to the troubleshooting documentation.