import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameCategory from '../GameCategory';
import { Game, GameCategory as GameCategoryType } from '@/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock GameGrid component
jest.mock('../GameGrid', () => {
  return function MockGameGrid({ games, onGameClick, onToggleFavorite, favoriteGameIds, emptyState }: any) {
    if (games.length === 0) {
      return (
        <div data-testid="empty-state">
          <h3>{emptyState?.title}</h3>
          <p>{emptyState?.description}</p>
        </div>
      );
    }
    
    return (
      <div data-testid="game-grid">
        {games.map((game: Game) => (
          <div key={game.id} data-testid={`game-${game.id}`}>
            <h4>{game.title}</h4>
            <button onClick={() => onGameClick?.(game)}>Play {game.title}</button>
            <button onClick={() => onToggleFavorite?.(game.id)}>
              {favoriteGameIds?.includes(game.id) ? 'Unfavorite' : 'Favorite'}
            </button>
          </div>
        ))}
      </div>
    );
  };
});

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      onClick={onClick}
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronRightIcon: () => <div data-testid="chevron-right-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  GamepadIcon: () => <div data-testid="gamepad-icon" />
}));

const createMockGame = (id: string, title: string): Game => ({
  id,
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  description: `Description for ${title}`,
  thumbnail: `https://example.com/${id}.jpg`,
  category: {
    id: '1',
    name: 'Slots',
    slug: 'slots',
    description: 'Slot games',
    icon: 'slot-icon.svg',
    order: 1,
    isActive: true
  },
  provider: 'Test Provider',
  isActive: true,
  isFeatured: false,
  popularity: 75,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: []
});

const mockCategory: GameCategoryType = {
  id: '1',
  name: 'Slot Games',
  slug: 'slots',
  description: 'Exciting slot machine games',
  icon: 'https://example.com/slot-icon.svg',
  order: 1,
  isActive: true,
  games: [
    createMockGame('1', 'Mega Slots'),
    createMockGame('2', 'Lucky Sevens'),
    createMockGame('3', 'Fruit Machine'),
    createMockGame('4', 'Diamond Rush'),
    createMockGame('5', 'Golden Coins'),
    createMockGame('6', 'Wild West'),
    createMockGame('7', 'Ocean Adventure'),
    createMockGame('8', 'Space Quest'),
    createMockGame('9', 'Dragon Fire'),
    createMockGame('10', 'Treasure Hunt')
  ]
};

describe('GameCategory', () => {
  const mockOnGameClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnViewAllClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category information correctly', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Slot Games')).toBeInTheDocument();
    expect(screen.getByText('Exciting slot machine games')).toBeInTheDocument();
  });

  it('displays category icon when provided', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const icon = screen.getByAltText('Slot Games');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'https://example.com/slot-icon.svg');
  });

  it('displays default icon when no icon provided', () => {
    const categoryWithoutIcon = { ...mockCategory, icon: '' };
    
    render(
      <GameCategory 
        category={categoryWithoutIcon}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByTestId('gamepad-icon')).toBeInTheDocument();
  });

  it('shows limited games initially when maxGamesShown is set', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    // Should show first 4 games
    expect(screen.getByTestId('game-1')).toBeInTheDocument();
    expect(screen.getByTestId('game-2')).toBeInTheDocument();
    expect(screen.getByTestId('game-3')).toBeInTheDocument();
    expect(screen.getByTestId('game-4')).toBeInTheDocument();
    
    // Should not show games beyond the limit
    expect(screen.queryByTestId('game-5')).not.toBeInTheDocument();
  });

  it('shows View All button when there are more games than maxGamesShown', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    const viewAllButton = screen.getByText(`View All ${mockCategory.games!.length} Games`);
    expect(viewAllButton).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('hides View All button when showViewAll is false', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
        showViewAll={false}
      />
    );

    expect(screen.queryByText(`View All ${mockCategory.games!.length} Games`)).not.toBeInTheDocument();
  });

  it('calls onViewAllClick when View All button is clicked', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        onViewAllClick={mockOnViewAllClick}
        maxGamesShown={4}
      />
    );

    const viewAllButton = screen.getByText(`View All ${mockCategory.games!.length} Games`);
    fireEvent.click(viewAllButton);

    expect(mockOnViewAllClick).toHaveBeenCalledWith(mockCategory);
  });

  it('expands to show all games when View All is clicked and no onViewAllClick provided', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    const viewAllButton = screen.getByText(`View All ${mockCategory.games!.length} Games`);
    fireEvent.click(viewAllButton);

    // Should now show all games
    expect(screen.getByTestId('game-5')).toBeInTheDocument();
    expect(screen.getByTestId('game-10')).toBeInTheDocument();
  });

  it('shows Show Less button when expanded', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    // Expand first
    const viewAllButton = screen.getByText(`View All ${mockCategory.games!.length} Games`);
    fireEvent.click(viewAllButton);

    // Should show Show Less button
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });

  it('collapses games when Show Less is clicked', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    // Expand first
    const viewAllButton = screen.getByText(`View All ${mockCategory.games!.length} Games`);
    fireEvent.click(viewAllButton);

    // Then collapse
    const showLessButton = screen.getByText('Show Less');
    fireEvent.click(showLessButton);

    // Should hide games beyond the limit again
    expect(screen.queryByTestId('game-5')).not.toBeInTheDocument();
  });

  it('passes game interactions to GameGrid', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        favoriteGameIds={['1', '3']}
      />
    );

    // Click on a game
    const playButton = screen.getByText('Play Mega Slots');
    fireEvent.click(playButton);
    expect(mockOnGameClick).toHaveBeenCalledWith(mockCategory.games![0]);

    // Click favorite button - get the first unfavorite button (for game 1)
    const favoriteButtons = screen.getAllByText('Unfavorite');
    fireEvent.click(favoriteButtons[0]); // Game 1 is in favorites
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('shows loading state', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        loading={true}
      />
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load category';
    
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        error={errorMessage}
      />
    );

    expect(screen.getByText('Error Loading Slot Games')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when category has no games', () => {
    const emptyCategory = { ...mockCategory, games: [] };
    
    render(
      <GameCategory 
        category={emptyCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('No games available')).toBeInTheDocument();
    expect(screen.getByText('Games in this category are coming soon!')).toBeInTheDocument();
    expect(screen.getByTestId('gamepad-icon')).toBeInTheDocument();
  });

  it('handles carousel layout', () => {
    render(
      <GameCategory 
        category={mockCategory}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        layout="carousel"
        maxGamesShown={4}
      />
    );

    // Should render carousel layout (simplified version)
    const carousel = document.querySelector('.overflow-x-auto');
    expect(carousel).toBeInTheDocument();
    
    const carouselItems = document.querySelectorAll('.flex-shrink-0');
    expect(carouselItems.length).toBe(4); // maxGamesShown
  });

  it('handles category without description', () => {
    const categoryWithoutDescription = { ...mockCategory, description: '' };
    
    render(
      <GameCategory 
        category={categoryWithoutDescription}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Slot Games')).toBeInTheDocument();
    expect(screen.queryByText('Exciting slot machine games')).not.toBeInTheDocument();
  });

  it('does not show View All button when games count equals maxGamesShown', () => {
    const categoryWithFewGames = {
      ...mockCategory,
      games: mockCategory.games!.slice(0, 4)
    };
    
    render(
      <GameCategory 
        category={categoryWithFewGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        maxGamesShown={4}
      />
    );

    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });
});