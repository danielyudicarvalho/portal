import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameGrid from '../GameGrid';
import { Game } from '@/types';
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

// Mock GameCard component
jest.mock('../GameCard', () => {
  return function MockGameCard({ game, onGameClick, onToggleFavorite, isFavorite }: any) {
    return (
      <div data-testid={`game-card-${game.id}`}>
        <h3>{game.title}</h3>
        <button onClick={() => onGameClick?.(game)}>Play {game.title}</button>
        <button 
          onClick={() => onToggleFavorite?.(game.id)}
          data-testid={`favorite-${game.id}`}
        >
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </button>
      </div>
    );
  };
});

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronLeftIcon: () => <div data-testid="chevron-left-icon" />,
  ChevronRightIcon: () => <div data-testid="chevron-right-icon" />,
  ArrowPathIcon: () => <div data-testid="arrow-path-icon" />
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

const mockGames = [
  createMockGame('1', 'Game 1'),
  createMockGame('2', 'Game 2'),
  createMockGame('3', 'Game 3'),
  createMockGame('4', 'Game 4'),
  createMockGame('5', 'Game 5')
];

describe('GameGrid', () => {
  const mockOnGameClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', {
      value: jest.fn(),
      writable: true
    });
  });

  it('renders games correctly', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    mockGames.forEach(game => {
      expect(screen.getByTestId(`game-card-${game.id}`)).toBeInTheDocument();
      expect(screen.getByText(game.title)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(
      <GameGrid 
        games={[]}
        loading={true}
        pagination={{ enabled: true, pageSize: 4 }}
      />
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load games';
    
    render(
      <GameGrid 
        games={[]}
        error={errorMessage}
      />
    );

    expect(screen.getByText('Error Loading Games')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows empty state when no games', () => {
    render(
      <GameGrid 
        games={[]}
        emptyState={{
          title: 'No games found',
          description: 'Try different filters'
        }}
      />
    );

    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try different filters')).toBeInTheDocument();
  });

  it('handles pagination correctly', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        pagination={{ enabled: true, pageSize: 2 }}
      />
    );

    // Should only show first 2 games initially
    expect(screen.getByTestId('game-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('game-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('game-card-3')).not.toBeInTheDocument();

    // Should show pagination controls
    const pageButtons = screen.getAllByTestId('button');
    expect(pageButtons.length).toBeGreaterThan(0);
  });

  it('handles load more functionality', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        pagination={{ enabled: true, pageSize: 2, showLoadMore: true }}
      />
    );

    // Should show load more button
    const loadMoreButton = screen.getByText('Load More Games');
    expect(loadMoreButton).toBeInTheDocument();

    // Click load more
    fireEvent.click(loadMoreButton);

    // Should now show more games
    waitFor(() => {
      expect(screen.getByTestId('game-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('game-card-4')).toBeInTheDocument();
    });
  });

  it('handles infinite scroll', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        infiniteScroll={{ 
          enabled: true, 
          onLoadMore: mockOnLoadMore,
          hasMore: true,
          loading: false
        }}
      />
    );

    // Simulate scroll to bottom
    Object.defineProperty(window, 'innerHeight', { value: 1000 });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 2000 });
    Object.defineProperty(document.documentElement, 'offsetHeight', { value: 2500 });

    fireEvent.scroll(window);

    waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalled();
    });
  });

  it('shows infinite scroll loading state', () => {
    render(
      <GameGrid 
        games={mockGames}
        infiniteScroll={{ 
          enabled: true, 
          onLoadMore: mockOnLoadMore,
          hasMore: true,
          loading: true
        }}
      />
    );

    expect(screen.getByText('Loading more games...')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-path-icon')).toBeInTheDocument();
  });

  it('calls onGameClick when game is clicked', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const playButton = screen.getByText('Play Game 1');
    fireEvent.click(playButton);

    expect(mockOnGameClick).toHaveBeenCalledWith(mockGames[0]);
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        favoriteGameIds={['1']}
      />
    );

    const favoriteButton = screen.getByTestId('favorite-1');
    fireEvent.click(favoriteButton);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('shows correct favorite state', () => {
    render(
      <GameGrid 
        games={mockGames}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        favoriteGameIds={['1', '3']}
      />
    );

    expect(screen.getAllByText('Remove from favorites')).toHaveLength(2); // Games 1, 3
    expect(screen.getAllByText('Add to favorites')).toHaveLength(3); // Games 2, 4, 5
  });

  it('applies custom grid columns', () => {
    render(
      <GameGrid 
        games={mockGames}
        columns={{ sm: 2, md: 3, lg: 4, xl: 5 }}
      />
    );

    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-2');
    expect(gridContainer).toHaveClass('sm:grid-cols-3');
    expect(gridContainer).toHaveClass('md:grid-cols-4');
    expect(gridContainer).toHaveClass('lg:grid-cols-5');
  });

  it('handles page navigation', () => {
    render(
      <GameGrid 
        games={mockGames}
        pagination={{ enabled: true, pageSize: 2 }}
      />
    );

    // Should show page 1 initially
    expect(screen.getByTestId('game-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('game-card-2')).toBeInTheDocument();

    // Find and click page 2 button
    const pageButtons = screen.getAllByTestId('button');
    const page2Button = pageButtons.find(button => button.textContent === '2');
    
    if (page2Button) {
      fireEvent.click(page2Button);
      
      waitFor(() => {
        expect(screen.getByTestId('game-card-3')).toBeInTheDocument();
        expect(screen.getByTestId('game-card-4')).toBeInTheDocument();
        expect(screen.queryByTestId('game-card-1')).not.toBeInTheDocument();
      });
    }
  });

  it('disables navigation buttons appropriately', () => {
    render(
      <GameGrid 
        games={mockGames}
        pagination={{ enabled: true, pageSize: 2 }}
      />
    );

    const buttons = screen.getAllByTestId('button');
    const prevButton = buttons.find(button => 
      button.querySelector('[data-testid="chevron-left-icon"]')
    );
    
    // Previous button should be disabled on first page
    expect(prevButton).toBeDisabled();
  });
});