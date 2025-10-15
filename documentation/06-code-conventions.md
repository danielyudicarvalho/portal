# Code Conventions

## 📋 Overview

This document outlines the coding standards, naming conventions, formatting rules, and best practices for the Game Portal project. Following these conventions ensures code consistency, maintainability, and team collaboration.

## 🎯 General Principles

### Code Quality Standards
- **Readability First**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns throughout the codebase
- **Maintainability**: Write code that's easy to modify and extend
- **Performance**: Consider performance implications of code decisions
- **Security**: Always consider security implications
- **Accessibility**: Ensure code supports accessibility requirements

### Development Philosophy
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Follow object-oriented design principles
- **Separation of Concerns**: Keep different aspects of functionality separate
- **Progressive Enhancement**: Build features that work without JavaScript first
- **Mobile First**: Design and develop for mobile devices first

## 📝 Naming Conventions

### Files and Directories

#### File Naming
```bash
# React Components (PascalCase)
GameCard.tsx
UserProfile.tsx
MultiplayerLobby.tsx

# Hooks (camelCase with 'use' prefix)
useGameData.ts
useMultiplayerConnection.ts
usePWAInstallation.ts

# Utilities and Libraries (camelCase)
gameUtils.ts
apiClient.ts
dateHelpers.ts

# Constants (UPPER_SNAKE_CASE)
API_ENDPOINTS.ts
GAME_CONSTANTS.ts
ERROR_MESSAGES.ts

# Types and Interfaces (PascalCase)
GameTypes.ts
UserInterfaces.ts
APIResponses.ts

# Pages (kebab-case for URLs, PascalCase for components)
# URL: /games/snake-battle
# File: src/app/games/snake-battle/page.tsx

# API Routes (kebab-case)
# URL: /api/user-profile
# File: src/app/api/user-profile/route.ts
```

#### Directory Naming
```bash
# Feature directories (kebab-case)
src/components/game-management/
src/hooks/multiplayer-hooks/
src/lib/performance-monitoring/

# Component directories (PascalCase when representing components)
src/components/ui/Button/
src/components/features/GameCard/

# Route directories (kebab-case, matching URLs)
src/app/games/snake-battle/
src/app/user/profile-settings/
```

### Variables and Functions

#### JavaScript/TypeScript
```typescript
// Variables (camelCase)
const gameData = fetchGameData();
const isUserLoggedIn = checkAuthStatus();
const multiplayerConnection = new WebSocket(url);

// Functions (camelCase)
function calculateScore(points: number): number { }
const handleUserLogin = async (credentials: LoginData) => { };
const validateGameInput = (input: GameInput): boolean => { };

// Constants (UPPER_SNAKE_CASE)
const MAX_PLAYERS = 8;
const API_BASE_URL = 'https://api.gameportal.com';
const DEFAULT_GAME_SETTINGS = { difficulty: 'normal' };

// Classes (PascalCase)
class GameManager { }
class MultiplayerRoom { }
class UserProfileService { }

// Interfaces and Types (PascalCase)
interface GameData {
  id: string;
  title: string;
  category: GameCategory;
}

type UserRole = 'admin' | 'user' | 'moderator';
type GameState = 'lobby' | 'playing' | 'finished';

// Enums (PascalCase)
enum GameStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}
```

#### React Components
```typescript
// Component names (PascalCase)
const GameCard: React.FC<GameCardProps> = ({ game }) => { };
const UserProfileModal: React.FC<ModalProps> = ({ isOpen }) => { };

// Props interfaces (ComponentName + Props)
interface GameCardProps {
  game: GameData;
  onSelect: (gameId: string) => void;
  isSelected?: boolean;
}

// Event handlers (handle + Action)
const handleGameSelect = (gameId: string) => { };
const handleUserLogin = async (credentials: LoginData) => { };
const handleFormSubmit = (event: FormEvent) => { };

// State variables (descriptive names)
const [isLoading, setIsLoading] = useState(false);
const [gameData, setGameData] = useState<GameData | null>(null);
const [userPreferences, setUserPreferences] = useState(defaultPreferences);
```

### Database and API

#### Database Naming (snake_case)
```sql
-- Tables
users
game_categories
user_favorites
game_sessions
multiplayer_rooms

-- Columns
user_id
created_at
updated_at
is_active
game_category_id

-- Indexes
idx_users_email
idx_games_category_id
idx_sessions_user_id_created_at
```

#### API Endpoints (kebab-case)
```bash
# RESTful endpoints
GET    /api/games
GET    /api/games/snake-battle
POST   /api/user-favorites
DELETE /api/user-favorites/game-123

# Nested resources
GET    /api/users/123/game-history
POST   /api/multiplayer-rooms/abc123/join
PUT    /api/admin/game-categories/action-games
```

## 🎨 Code Formatting

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling"],
      "newlines-between": "always"
    }]
  }
}
```

### Code Structure

#### Import Organization
```typescript
// 1. Node modules
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

// 2. Internal modules (absolute imports)
import { GameCard } from '@/components/ui/GameCard';
import { useGameData } from '@/hooks/useGameData';
import { gameApi } from '@/lib/api/gameApi';

// 3. Relative imports
import './GamePage.css';
import { GamePageProps } from './types';

// 4. Type-only imports (separate)
import type { GameData, UserPreferences } from '@/types';
```

#### Function Structure
```typescript
// Function declaration with proper typing
const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  isSelected = false,
  className = '',
}) => {
  // 1. Hooks (in order of dependency)
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // 2. Derived state and computations
  const isOwner = user?.id === game.ownerId;
  const cardClasses = clsx(
    'game-card',
    { 'game-card--selected': isSelected },
    className
  );
  
  // 3. Event handlers
  const handleClick = useCallback(() => {
    if (!isLoading) {
      onSelect(game.id);
    }
  }, [game.id, isLoading, onSelect]);
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 5. Early returns
  if (!game) {
    return <div>No game data</div>;
  }
  
  // 6. Main render
  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Component JSX */}
    </div>
  );
};
```

## 📚 TypeScript Best Practices

### Type Definitions

#### Interface vs Type
```typescript
// Use interfaces for object shapes that might be extended
interface GameData {
  id: string;
  title: string;
  category: string;
}

interface MultiplayerGameData extends GameData {
  maxPlayers: number;
  currentPlayers: number;
}

// Use types for unions, primitives, and computed types
type GameStatus = 'pending' | 'active' | 'completed';
type GameWithStatus = GameData & { status: GameStatus };
type GameKeys = keyof GameData;
```

#### Generic Types
```typescript
// Generic interfaces
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Generic functions
function createApiClient<T>(baseUrl: string): ApiClient<T> {
  // Implementation
}

// Usage
const gameApi = createApiClient<GameData>('/api/games');
const userApi = createApiClient<UserData>('/api/users');
```

#### Utility Types
```typescript
// Use built-in utility types
type PartialGameData = Partial<GameData>;
type RequiredGameData = Required<GameData>;
type GameDataKeys = keyof GameData;
type GameTitle = Pick<GameData, 'title'>;
type GameWithoutId = Omit<GameData, 'id'>;

// Custom utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};
```

### Error Handling

#### Error Types
```typescript
// Define specific error types
class GameNotFoundError extends Error {
  constructor(gameId: string) {
    super(`Game with ID ${gameId} not found`);
    this.name = 'GameNotFoundError';
  }
}

class MultiplayerConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MultiplayerConnectionError';
  }
}

// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
async function fetchGameData(id: string): Promise<Result<GameData>> {
  try {
    const data = await gameApi.getGame(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## ⚛️ React Best Practices

### Component Structure

#### Functional Components
```typescript
// Component with proper typing and default props
interface GameCardProps {
  game: GameData;
  onSelect: (gameId: string) => void;
  isSelected?: boolean;
  className?: string;
}

const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  isSelected = false,
  className = '',
}) => {
  // Component implementation
};

// Export with display name for debugging
GameCard.displayName = 'GameCard';
export { GameCard };
```

#### Custom Hooks
```typescript
// Custom hook with proper typing
interface UseGameDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGameDataReturn {
  games: GameData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useGameData = (
  options: UseGameDataOptions = {}
): UseGameDataReturn => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  // Hook implementation
  
  return {
    games,
    isLoading,
    error,
    refetch,
  };
};
```

### State Management

#### useState Best Practices
```typescript
// Use specific types for state
const [gameData, setGameData] = useState<GameData | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Use functional updates for complex state
const [gameState, setGameState] = useState<GameState>({
  players: [],
  status: 'lobby',
  settings: defaultSettings,
});

const addPlayer = useCallback((player: Player) => {
  setGameState(prevState => ({
    ...prevState,
    players: [...prevState.players, player],
  }));
}, []);
```

#### useEffect Best Practices
```typescript
// Effect with proper dependencies
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await gameApi.getGames();
      setGames(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchData();
}, [gameApi]); // Include all dependencies

// Cleanup effects
useEffect(() => {
  const subscription = multiplayerService.subscribe(handleUpdate);
  
  return () => {
    subscription.unsubscribe();
  };
}, [multiplayerService, handleUpdate]);
```

## 🎨 CSS and Styling

### Tailwind CSS Conventions

#### Class Organization
```tsx
// Organize classes by category
<div className={clsx(
  // Layout
  'flex flex-col items-center justify-center',
  // Spacing
  'p-4 m-2 gap-4',
  // Sizing
  'w-full max-w-md h-auto',
  // Colors and appearance
  'bg-white border border-gray-200 rounded-lg shadow-md',
  // Typography
  'text-center text-gray-800',
  // States
  'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
  // Responsive
  'sm:p-6 md:max-w-lg lg:max-w-xl',
  // Conditional classes
  {
    'opacity-50 cursor-not-allowed': isDisabled,
    'bg-blue-50 border-blue-200': isSelected,
  }
)}>
```

#### Custom CSS Classes
```css
/* Use CSS custom properties for theming */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* Component-specific styles */
.game-card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
  @apply transition-all duration-200 ease-in-out;
  @apply hover:shadow-md hover:border-gray-300;
}

.game-card--selected {
  @apply border-blue-500 bg-blue-50;
}

.game-card__title {
  @apply text-lg font-semibold text-gray-900;
  @apply truncate;
}
```

## 🔧 Performance Best Practices

### React Performance

#### Memoization
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Memoize components
const GameCard = React.memo<GameCardProps>(({ game, onSelect }) => {
  // Component implementation
});

// Custom comparison for memo
const GameList = React.memo<GameListProps>(
  ({ games, onGameSelect }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return prevProps.games.length === nextProps.games.length &&
           prevProps.games.every((game, index) => 
             game.id === nextProps.games[index].id
           );
  }
);
```

#### Code Splitting
```typescript
// Lazy load components
const GameEditor = lazy(() => import('./GameEditor'));
const AdminPanel = lazy(() => import('./AdminPanel'));

// Lazy load with named exports
const MultiplayerLobby = lazy(() => 
  import('./MultiplayerLobby').then(module => ({
    default: module.MultiplayerLobby
  }))
);

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <GameEditor gameId={gameId} />
</Suspense>
```

### Bundle Optimization

#### Import Optimization
```typescript
// Avoid importing entire libraries
import { debounce } from 'lodash'; // ❌ Imports entire lodash
import debounce from 'lodash/debounce'; // ✅ Imports only debounce

// Use tree-shakable imports
import { Button, Modal } from '@/components/ui'; // ✅ Tree-shakable
import * as UI from '@/components/ui'; // ❌ Imports everything
```

## 🧪 Testing Conventions

### Test File Organization
```bash
# Test files alongside source files
src/components/GameCard/
├── GameCard.tsx
├── GameCard.test.tsx
├── GameCard.stories.tsx
└── index.ts

# Or in __tests__ directories
src/components/GameCard/
├── __tests__/
│   ├── GameCard.test.tsx
│   └── GameCard.integration.test.tsx
├── GameCard.tsx
└── index.ts
```

### Test Naming
```typescript
// Describe blocks (component or function name)
describe('GameCard', () => {
  describe('when game is selected', () => {
    // Test cases (should + behavior)
    it('should apply selected styling', () => {});
    it('should call onSelect when clicked', () => {});
  });
  
  describe('when game is loading', () => {
    it('should show loading spinner', () => {});
    it('should disable click interactions', () => {});
  });
});

// API tests
describe('GET /api/games', () => {
  it('should return list of games', async () => {});
  it('should return 401 when not authenticated', async () => {});
});
```

### Test Structure
```typescript
// Arrange, Act, Assert pattern
it('should calculate correct score', () => {
  // Arrange
  const gameData = {
    points: 100,
    multiplier: 2,
    bonus: 50,
  };
  
  // Act
  const score = calculateScore(gameData);
  
  // Assert
  expect(score).toBe(250);
});

// Use descriptive test data
const mockGameData: GameData = {
  id: 'test-game-1',
  title: 'Test Game',
  category: 'action',
  isActive: true,
};
```

## 📖 Documentation Standards

### Code Comments
```typescript
/**
 * Calculates the final score for a game session
 * @param points - Base points earned during gameplay
 * @param multiplier - Score multiplier based on difficulty
 * @param timeBonus - Bonus points for completing quickly
 * @returns The calculated final score
 */
function calculateFinalScore(
  points: number,
  multiplier: number,
  timeBonus: number = 0
): number {
  // Apply multiplier to base points
  const baseScore = points * multiplier;
  
  // Add time bonus (capped at 50% of base score)
  const cappedBonus = Math.min(timeBonus, baseScore * 0.5);
  
  return Math.round(baseScore + cappedBonus);
}

// TODO: Add support for combo multipliers
// FIXME: Handle negative scores properly
// NOTE: This function assumes positive input values
```

### README Files
```markdown
# Component Name

Brief description of what this component does.

## Usage

```tsx
import { ComponentName } from './ComponentName';

<ComponentName
  prop1="value1"
  prop2={value2}
  onAction={handleAction}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | number | 0 | Description of prop2 |

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]
```

These conventions ensure consistent, maintainable, and high-quality code across the Game Portal project. All team members should follow these guidelines to maintain code quality and facilitate collaboration.