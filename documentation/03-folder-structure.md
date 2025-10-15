# Folder Structure Guide

## 📁 Project Root Structure

```
game-portal/
├── 📁 .git/                    # Git version control
├── 📁 .kiro/                   # Kiro AI assistant configuration
├── 📁 .next/                   # Next.js build output (auto-generated)
├── 📁 .swc/                    # SWC compiler cache
├── 📁 .vscode/                 # VS Code workspace settings
├── 📁 documentation/           # Project documentation (this folder)
├── 📁 games-to-add/           # Games pending integration
├── 📁 node_modules/           # NPM dependencies (auto-generated)
├── 📁 prisma/                 # Database schema and migrations
├── 📁 public/                 # Static assets and games
├── 📁 scripts/                # Build and utility scripts
├── 📁 server/                 # Multiplayer server code
├── 📁 src/                    # Next.js application source code
├── 📄 .dockerignore           # Docker ignore patterns
├── 📄 .env.example            # Environment variables template
├── 📄 .env.local              # Local environment variables (gitignored)
├── 📄 .eslintrc.json          # ESLint configuration
├── 📄 .gitignore              # Git ignore patterns
├── 📄 docker-compose.*.yml    # Docker composition files
├── 📄 Dockerfile.*            # Docker build configurations
├── 📄 jest.config.js          # Jest testing configuration
├── 📄 next.config.js          # Next.js configuration
├── 📄 nginx.conf              # NGINX reverse proxy configuration
├── 📄 package.json            # NPM package configuration
├── 📄 postcss.config.js       # PostCSS configuration
├── 📄 README.md               # Project overview
├── 📄 tailwind.config.js      # Tailwind CSS configuration
├── 📄 tsconfig.json           # TypeScript configuration
└── 📄 *.md                    # Various documentation files
```

## 📂 Source Code Structure (`src/`)

### Overview
The `src/` directory contains all the Next.js application code, organized following Next.js 14 App Router conventions and modern React best practices.

```
src/
├── 📁 __tests__/              # Global test files
├── 📁 app/                    # Next.js App Router (routes and layouts)
├── 📁 components/             # Reusable React components
├── 📁 hooks/                  # Custom React hooks
├── 📁 lib/                    # Utility functions and configurations
├── 📁 styles/                 # Global styles and CSS
└── 📁 types/                  # TypeScript type definitions
```

### App Directory (`src/app/`)
**Purpose**: Contains all routes, layouts, and page components using Next.js 14 App Router.

```
app/
├── 📁 (auth)/                 # Authentication route group
│   ├── 📁 login/              # Login page
│   ├── 📁 register/           # Registration page
│   └── 📄 layout.tsx          # Auth layout wrapper
├── 📁 (dashboard)/            # Dashboard route group
│   ├── 📁 profile/            # User profile pages
│   ├── 📁 favorites/          # User favorites
│   └── 📄 layout.tsx          # Dashboard layout
├── 📁 admin/                  # Admin interface
│   ├── 📁 games/              # Game management
│   ├── 📁 users/              # User management
│   ├── 📁 analytics/          # Analytics dashboard
│   └── 📄 layout.tsx          # Admin layout
├── 📁 api/                    # API routes
│   ├── 📁 auth/               # Authentication endpoints
│   ├── 📁 games/              # Game-related endpoints
│   ├── 📁 users/              # User-related endpoints
│   └── 📁 admin/              # Admin endpoints
├── 📁 games/                  # Game-related pages
│   ├── 📁 [slug]/             # Dynamic game pages
│   ├── 📁 categories/         # Game category pages
│   └── 📄 page.tsx            # Games listing page
├── 📄 globals.css             # Global CSS styles
├── 📄 layout.tsx              # Root layout component
├── 📄 page.tsx                # Home page
├── 📄 loading.tsx             # Global loading component
├── 📄 error.tsx               # Global error component
└── 📄 not-found.tsx           # 404 page component
```

**Key Features**:
- **Route Groups**: `(auth)` and `(dashboard)` for organized routing without affecting URL structure
- **Dynamic Routes**: `[slug]` for dynamic game pages
- **API Routes**: RESTful endpoints for frontend-backend communication
- **Layouts**: Nested layouts for different sections of the application
- **Special Files**: Loading, error, and not-found pages for better UX

### Components Directory (`src/components/`)
**Purpose**: Reusable React components organized by feature and complexity.

```
components/
├── 📁 features/               # Feature-specific components
│   ├── 📁 auth/               # Authentication components
│   │   ├── 📄 LoginForm.tsx
│   │   ├── 📄 RegisterForm.tsx
│   │   └── 📄 AuthProvider.tsx
│   ├── 📁 games/              # Game-related components
│   │   ├── 📄 GameCard.tsx
│   │   ├── 📄 GameGrid.tsx
│   │   ├── 📄 GameSearch.tsx
│   │   └── 📄 GameFilters.tsx
│   ├── 📁 user/               # User-related components
│   │   ├── 📄 UserProfile.tsx
│   │   ├── 📄 UserStats.tsx
│   │   └── 📄 FavoritesList.tsx
│   └── 📁 admin/              # Admin interface components
│       ├── 📄 AdminDashboard.tsx
│       ├── 📄 UserManagement.tsx
│       └── 📄 GameManagement.tsx
├── 📁 layout/                 # Layout components
│   ├── 📄 Header.tsx          # Main navigation header
│   ├── 📄 Footer.tsx          # Site footer
│   ├── 📄 Sidebar.tsx         # Navigation sidebar
│   └── 📄 Navigation.tsx      # Navigation components
├── 📁 providers/              # Context providers
│   ├── 📄 AuthProvider.tsx    # Authentication context
│   ├── 📄 ThemeProvider.tsx   # Theme context
│   └── 📄 PWAProvider.tsx     # PWA functionality
├── 📁 ui/                     # Base UI components
│   ├── 📄 Button.tsx          # Button component
│   ├── 📄 Input.tsx           # Input component
│   ├── 📄 Modal.tsx           # Modal component
│   ├── 📄 Card.tsx            # Card component
│   ├── 📄 Badge.tsx           # Badge component
│   ├── 📄 Loading.tsx         # Loading indicators
│   └── 📄 ErrorBoundary.tsx   # Error boundary component
├── 📄 MultiplayerGameCard.tsx # Multiplayer game component
└── 📄 PWAInit.tsx             # PWA initialization
```

**Organization Principles**:
- **Feature-Based**: Components grouped by application feature
- **Atomic Design**: UI components follow atomic design principles
- **Reusability**: Components designed for maximum reusability
- **Type Safety**: All components have proper TypeScript interfaces

### Hooks Directory (`src/hooks/`)
**Purpose**: Custom React hooks for shared logic and state management.

```
hooks/
├── 📁 __tests__/              # Hook tests
├── 📄 index.ts                # Hook exports
├── 📄 useGameCompatibility.ts # Game compatibility detection
├── 📄 useMobileAnalytics.ts   # Mobile analytics tracking
├── 📄 useMobilePerformance.ts # Mobile performance monitoring
├── 📄 useNotifications.ts     # Push notification management
├── 📄 useOfflineGames.ts      # Offline game functionality
├── 📄 useOrientation.ts       # Device orientation handling
├── 📄 usePWAInstallation.ts   # PWA installation prompts
├── 📄 usePWAOfflineState.ts   # PWA offline state management
└── 📄 useTouchInputAdapter.ts # Touch input optimization
```

**Hook Categories**:
- **PWA Hooks**: Progressive Web App functionality
- **Mobile Hooks**: Mobile-specific optimizations
- **Game Hooks**: Game-related state and logic
- **Performance Hooks**: Performance monitoring and optimization

### Library Directory (`src/lib/`)
**Purpose**: Utility functions, configurations, and shared logic.

```
lib/
├── 📁 __tests__/              # Library tests
├── 📄 bundle-analyzer.ts      # Bundle size analysis
├── 📄 game-asset-preloader.ts # Game asset preloading
├── 📄 game-cache-manager.ts   # Game caching strategies
├── 📄 lazy-loader.ts          # Lazy loading utilities
├── 📄 memory-manager.ts       # Memory optimization
├── 📄 mobile-analytics.ts     # Mobile analytics implementation
├── 📄 mobile-detection.ts     # Mobile device detection
├── 📄 mobile-game-compatibility.ts # Game compatibility checks
├── 📄 mobile-performance-monitor.ts # Performance monitoring
├── 📄 mobile-performance-optimizer.ts # Performance optimization
├── 📄 network-status.ts       # Network connectivity monitoring
├── 📄 notification-manager.ts # Notification management
├── 📄 notification-service-worker.ts # Service worker notifications
├── 📄 optimized-image-loader.ts # Image optimization
├── 📄 orientation-manager.ts  # Screen orientation handling
├── 📄 performance-monitor.ts  # General performance monitoring
├── 📄 pwa.ts                  # PWA configuration
├── 📄 touch-input-adapter.ts  # Touch input handling
├── 📄 utils.ts                # General utility functions
├── 📄 MOBILE_GAME_COMPATIBILITY_README.md
└── 📄 MOBILE_PERFORMANCE_README.md
```

**Library Categories**:
- **Performance**: Optimization and monitoring utilities
- **Mobile**: Mobile-specific functionality
- **PWA**: Progressive Web App utilities
- **Games**: Game-related utilities
- **General**: Common utility functions

### Types Directory (`src/types/`)
**Purpose**: TypeScript type definitions and interfaces.

```
types/
├── 📄 index.ts                # Main type exports
├── 📄 d3-ease.d.ts           # D3 library type definitions
└── 📄 jest.d.ts              # Jest testing type definitions
```

## 🎮 Public Directory (`public/`)

### Overview
Contains static assets, games, and PWA configuration files.

```
public/
├── 📁 games/                  # Browser games
│   ├── 📁 snake-multiplayer/  # Original Snake game
│   ├── 📁 snake-multiplayer-v2/ # Colyseus Snake game
│   ├── 📁 box-jump/           # Box Jump game
│   ├── 📁 tetris/             # Tetris game
│   ├── 📁 pong/               # Pong game
│   └── 📁 breakout/           # Breakout game
├── 📁 icons/                  # PWA icons and splash screens
│   ├── 📄 icon-192x192.png    # PWA icon (192x192)
│   ├── 📄 icon-512x512.png    # PWA icon (512x512)
│   ├── 📄 apple-touch-icon.png # Apple touch icon
│   └── 📄 splash-*.png        # Various splash screens
├── 📁 images/                 # Static images
│   ├── 📄 logo.png            # Application logo
│   ├── 📄 hero-bg.jpg         # Hero background
│   └── 📄 game-thumbnails/    # Game thumbnail images
├── 📁 js/                     # Client-side JavaScript
│   └── 📄 multiplayer-sdk.js  # Multiplayer SDK
├── 📄 favicon.ico             # Site favicon
├── 📄 manifest.json           # PWA manifest
├── 📄 robots.txt              # Search engine robots file
└── 📄 sitemap.xml             # Site map for SEO
```

### Game Structure
Each game in `public/games/` follows this structure:
```
game-name/
├── 📄 index.html              # Game entry point
├── 📄 game.js                 # Game logic
├── 📄 style.css               # Game styles
├── 📁 assets/                 # Game assets
│   ├── 📁 images/             # Game images
│   ├── 📁 sounds/             # Game sounds
│   └── 📁 fonts/              # Game fonts
└── 📄 config.json             # Game configuration
```

## 🗄 Server Directory (`server/`)

### Overview
Contains the multiplayer server implementation using Colyseus.

```
server/
├── 📁 rooms/                  # Game room implementations
│   ├── 📄 BaseGameRoom.js     # Abstract base room class
│   ├── 📄 GameLobby.js        # Matchmaking lobby
│   ├── 📄 SnakeRoom.js        # Snake game room
│   └── 📄 BoxJumpRoom.js      # Box Jump game room
├── 📁 schemas/                # Colyseus state schemas
│   ├── 📄 BaseGameState.js    # Base game state schema
│   ├── 📄 SnakeGameState.js   # Snake game state
│   └── 📄 BoxJumpGameState.js # Box Jump game state
├── 📄 multiplayer-server.js   # Main Colyseus server
├── 📄 snake-server.js         # Legacy Snake server
└── 📄 box-jump-server.js      # Legacy Box Jump server
```

### Room Architecture
- **BaseGameRoom**: Abstract class providing common multiplayer functionality
- **Game-Specific Rooms**: Extend BaseGameRoom with game-specific logic
- **GameLobby**: Central matchmaking and room discovery
- **State Schemas**: Define synchronized game state structure

## 🗃 Database Directory (`prisma/`)

### Overview
Contains database schema, migrations, and configuration.

```
prisma/
├── 📁 migrations/             # Database migrations (auto-generated)
│   ├── 📄 001_initial.sql     # Initial database schema
│   ├── 📄 002_add_games.sql   # Game-related tables
│   └── 📄 003_add_sessions.sql # Session tracking
├── 📄 schema.prisma           # Database schema definition
└── 📄 seed.ts                 # Database seeding script
```

### Schema Organization
- **User Management**: Users, authentication, profiles
- **Game Catalog**: Games, categories, tags
- **User Engagement**: Favorites, sessions, history
- **Admin Features**: Content management, analytics

## 📜 Scripts Directory (`scripts/`)

### Overview
Build scripts, utilities, and automation tools.

```
scripts/
├── 📄 generate-icons.js       # PWA icon generation
├── 📄 generate-splash-screens.js # PWA splash screen generation
├── 📄 setup-multiplayer.sh    # Multiplayer setup automation
├── 📄 build-production.sh     # Production build script
├── 📄 deploy.sh               # Deployment automation
└── 📄 test-runner.js          # Test execution script
```

## 🐳 Docker Configuration

### Docker Files
- **Dockerfile.nextjs**: Next.js application container
- **Dockerfile.multiplayer**: Multiplayer server container
- **docker-compose.dev.yml**: Development environment
- **docker-compose.multiplayer.yml**: Production environment

### Container Architecture
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Next.js App   │  │ Multiplayer     │  │   PostgreSQL    │
│   (Port 3000)   │  │   Server        │  │   Database      │
│                 │  │ (Port 3002)     │  │   (Port 5432)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │   (Port 6379)   │
                    └─────────────────┘
```

## 📋 Configuration Files

### Root Level Configuration
- **package.json**: NPM dependencies and scripts
- **tsconfig.json**: TypeScript compiler configuration
- **next.config.js**: Next.js framework configuration
- **tailwind.config.js**: Tailwind CSS customization
- **jest.config.js**: Testing framework configuration
- **eslintrc.json**: Code linting rules
- **.env.example**: Environment variables template

### Development Configuration
- **.vscode/**: VS Code workspace settings
- **.gitignore**: Git ignore patterns
- **.dockerignore**: Docker ignore patterns
- **postcss.config.js**: PostCSS processing configuration

## 🎯 Best Practices

### File Naming Conventions
- **Components**: PascalCase (e.g., `GameCard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useGameData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase (e.g., `GameData.ts`)

### Directory Organization
- **Feature-First**: Group related files by feature when possible
- **Atomic Design**: UI components follow atomic design principles
- **Separation of Concerns**: Logic separated from presentation
- **Reusability**: Components designed for maximum reuse

### Import/Export Patterns
- **Barrel Exports**: Use index.ts files for clean imports
- **Named Exports**: Prefer named exports over default exports
- **Absolute Imports**: Use absolute imports with path mapping
- **Type-Only Imports**: Use `import type` for TypeScript types

This folder structure provides a solid foundation for maintaining and scaling the Game Portal application while keeping code organized and discoverable.