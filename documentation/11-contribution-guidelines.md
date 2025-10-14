# Contribution Guidelines

## 🤝 Welcome Contributors!

Thank you for your interest in contributing to Game Portal! This document provides guidelines and information for contributors to help maintain code quality, consistency, and a positive collaborative environment.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Pull Request Process](#pull-request-process)
6. [Issue Guidelines](#issue-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Standards](#documentation-standards)
9. [Release Process](#release-process)
10. [Recognition](#recognition)

## 🌟 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, experience level, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- **Be respectful** - Treat all community members with respect and kindness
- **Be collaborative** - Work together constructively and help others learn
- **Be inclusive** - Welcome newcomers and help them get started
- **Be constructive** - Provide helpful feedback and suggestions
- **Be patient** - Remember that everyone has different experience levels

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without permission
- Spam or excessive self-promotion
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Violations of the code of conduct should be reported to the project maintainers. All reports will be reviewed and investigated promptly and fairly.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your name and email
- **Docker** (optional but recommended)
- **Basic knowledge** of TypeScript, React, and Next.js

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/game-portal.git
   cd game-portal
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/game-portal.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

6. **Run the development server**:
   ```bash
   npm run dev:full
   ```

### First Contribution

For your first contribution, look for issues labeled:
- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements
- `bug` - Bug fixes (start with simple ones)

## 🔄 Development Workflow

### Branch Strategy

We use a **Git Flow** inspired branching strategy:

```
main (production-ready code)
├── develop (integration branch)
│   ├── feature/user-authentication
│   ├── feature/multiplayer-improvements
│   ├── bugfix/game-loading-issue
│   └── hotfix/critical-security-fix
└── release/v1.2.0
```

### Branch Naming Conventions

- **Feature branches**: `feature/short-description`
- **Bug fixes**: `bugfix/issue-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/section-name`
- **Refactoring**: `refactor/component-name`

### Development Process

1. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add user authentication system"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Commit Message Format

We follow the **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

#### Examples
```bash
feat(auth): add OAuth2 authentication
fix(multiplayer): resolve connection timeout issue
docs(api): update endpoint documentation
style(components): format GameCard component
refactor(hooks): simplify useGameData hook
test(utils): add tests for date helpers
chore(deps): update dependencies
```

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface GameData {
  id: string;
  title: string;
  category: string;
}

// Use types for unions and computed types
type GameStatus = 'active' | 'inactive' | 'pending';
type GameWithStatus = GameData & { status: GameStatus };

// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}
```

#### Function Definitions
```typescript
// Explicit return types for public functions
export const fetchGameData = async (id: string): Promise<GameData> => {
  // Implementation
};

// Use proper error handling
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};
```

### React Component Guidelines

#### Component Structure
```typescript
// Component with proper typing
interface GameCardProps {
  game: GameData;
  onSelect: (gameId: string) => void;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  className = '',
}) => {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  
  // Event handlers
  const handleClick = useCallback(() => {
    onSelect(game.id);
  }, [game.id, onSelect]);
  
  // Early returns
  if (!game) return null;
  
  // Main render
  return (
    <div className={`game-card ${className}`} onClick={handleClick}>
      {/* Component JSX */}
    </div>
  );
};

// Display name for debugging
GameCard.displayName = 'GameCard';
```

#### Custom Hooks
```typescript
// Custom hook with proper typing
interface UseGameDataReturn {
  games: GameData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useGameData = (): UseGameDataReturn => {
  const [games, setGames] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Implementation
  
  return { games, isLoading, error, refetch };
};
```

### CSS and Styling

#### Tailwind CSS Usage
```tsx
// Organize classes logically
<div className={clsx(
  // Layout
  'flex flex-col items-center',
  // Spacing
  'p-4 m-2 gap-4',
  // Appearance
  'bg-white border border-gray-200 rounded-lg',
  // States
  'hover:shadow-lg focus:outline-none',
  // Responsive
  'sm:p-6 md:flex-row',
  // Conditional
  { 'opacity-50': isDisabled }
)}>
```

#### Custom CSS Classes
```css
/* Use CSS custom properties */
.game-card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
  @apply transition-all duration-200 ease-in-out;
  @apply hover:shadow-md hover:border-gray-300;
}

/* Component variants */
.game-card--featured {
  @apply border-blue-500 bg-blue-50;
}
```

## 🔍 Pull Request Process

### Before Submitting

1. **Update your branch** with latest changes:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Update documentation** if needed

4. **Test manually** in browser

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings or errors
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing** by reviewer if significant changes
4. **Approval** and merge by maintainer

### Review Criteria

Reviewers will check for:
- **Code quality** - Follows coding standards
- **Functionality** - Works as intended
- **Performance** - No significant performance regressions
- **Security** - No security vulnerabilities
- **Documentation** - Adequate documentation provided
- **Tests** - Appropriate test coverage

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try latest version** to see if issue is resolved
4. **Gather information** about your environment

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
A clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 115.0]
- Node.js: [e.g., 18.17.0]
- Version: [e.g., 1.2.0]

## Screenshots/Logs
If applicable, add screenshots or error logs.

## Additional Context
Any other relevant information.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Any other relevant information.
```

### Issue Labels

We use these labels to categorize issues:

- **Type**: `bug`, `feature`, `enhancement`, `documentation`
- **Priority**: `critical`, `high`, `medium`, `low`
- **Difficulty**: `good first issue`, `easy`, `medium`, `hard`
- **Status**: `needs-triage`, `in-progress`, `blocked`, `help-wanted`
- **Component**: `frontend`, `backend`, `multiplayer`, `pwa`, `database`

## 🧪 Testing Requirements

### Test Coverage

We aim for:
- **Unit tests**: 80%+ coverage for utilities and hooks
- **Component tests**: All components should have basic tests
- **Integration tests**: Critical user flows
- **E2E tests**: Main application features

### Writing Tests

#### Unit Tests
```typescript
// utils/dateHelpers.test.ts
import { formatDate, isValidDate } from './dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('January 15, 2024');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('Invalid Date');
    });
  });
});
```

#### Component Tests
```typescript
// components/GameCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';

const mockGame = {
  id: '1',
  title: 'Test Game',
  slug: 'test-game',
};

describe('GameCard', () => {
  it('should render game title', () => {
    render(<GameCard game={mockGame} onSelect={jest.fn()} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<GameCard game={mockGame} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Test Game'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

#### Integration Tests
```typescript
// __tests__/api/games.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../src/app/api/games/route';

describe('/api/games', () => {
  it('should return games list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('games');
    expect(Array.isArray(data.games)).toBe(true);
  });
});
```

### Running Tests

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

## 📚 Documentation Standards

### Code Documentation

#### JSDoc Comments
```typescript
/**
 * Calculates the final score for a game session
 * @param baseScore - The base score earned during gameplay
 * @param multiplier - Score multiplier based on difficulty level
 * @param timeBonus - Bonus points for completing quickly (optional)
 * @returns The calculated final score
 * @example
 * ```typescript
 * const score = calculateFinalScore(100, 1.5, 25);
 * console.log(score); // 175
 * ```
 */
export const calculateFinalScore = (
  baseScore: number,
  multiplier: number,
  timeBonus: number = 0
): number => {
  return Math.round((baseScore * multiplier) + timeBonus);
};
```

#### README Files
Each major component or feature should have a README:

```markdown
# Component Name

Brief description of the component's purpose.

## Usage

```tsx
import { ComponentName } from './ComponentName';

<ComponentName
  prop1="value"
  prop2={value}
  onAction={handleAction}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description |
| prop2 | number | 0 | Description |

## Examples

### Basic Usage
[Code example]

### Advanced Usage
[Code example]
```

### API Documentation

Update API documentation when adding or modifying endpoints:

```typescript
/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get all games
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 */
```

## 🚀 Release Process

### Version Numbering

We follow **Semantic Versioning** (SemVer):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Workflow

1. **Create release branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b release/v1.2.0
   ```

2. **Update version numbers**:
   ```bash
   npm version minor  # or major/patch
   ```

3. **Update CHANGELOG.md**:
   ```markdown
   ## [1.2.0] - 2024-01-15
   
   ### Added
   - New multiplayer game support
   - PWA offline functionality
   
   ### Changed
   - Improved game loading performance
   
   ### Fixed
   - Fixed user authentication bug
   ```

4. **Test release candidate**:
   ```bash
   npm run build
   npm run test
   npm run e2e
   ```

5. **Merge to main** and tag:
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push upstream main --tags
   ```

6. **Deploy to production**

7. **Merge back to develop**:
   ```bash
   git checkout develop
   git merge main
   git push upstream develop
   ```

## 🏆 Recognition

### Contributor Recognition

We recognize contributors in several ways:

1. **Contributors file** - Listed in CONTRIBUTORS.md
2. **Release notes** - Mentioned in release announcements
3. **GitHub profile** - Contributions show on your GitHub profile
4. **Special badges** - For significant contributions

### Types of Contributions

We value all types of contributions:
- **Code** - Features, bug fixes, improvements
- **Documentation** - Writing, editing, translating
- **Testing** - Writing tests, manual testing, bug reports
- **Design** - UI/UX improvements, graphics, icons
- **Community** - Helping others, moderating discussions
- **Ideas** - Feature suggestions, architectural improvements

### Becoming a Maintainer

Regular contributors may be invited to become maintainers. Maintainers have:
- **Commit access** to the repository
- **Review responsibilities** for pull requests
- **Release management** duties
- **Community leadership** roles

## 📞 Getting Help

### Where to Ask Questions

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Discord/Slack** - Real-time chat (if available)
- **Email** - Direct contact with maintainers

### Mentorship Program

New contributors can request mentorship:
- **Pair programming** sessions
- **Code review** guidance
- **Architecture** discussions
- **Career advice** in open source

## 📄 License

By contributing to Game Portal, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Game Portal! Your efforts help make this project better for everyone. 🎮✨