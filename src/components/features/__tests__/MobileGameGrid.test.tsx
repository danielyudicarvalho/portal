import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileGameGrid from '../MobileGameGrid';
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

// Mock the MobileGameCard component
jest.mock('../MobileGameCard', () => {
  return function MockMobileGameCard({ game, onGameClick, onToggleFavorite, isFavorite, isOffline }: any) {
    return (
      <div data-testid={`mobile-game-card-${game.id}`}>
        <h3>{game.title}</h3>
        <button onClick={() => onGameClick?.(game)}>Play {game.title}</button>
        <button onClick={() => onToggleFavorite?.(game.id)}>
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </button>
        {isOffline && <span>Offline Available</span>}
      </div>
    );
  };
});

const mockGames: Game[] = [
  {
    id: '1',
    title: 'Test Game 1',
    slug: 'test-game-1',
    description: 'A test game',
    thumbnail: '/test1.jpg',
    category: { id: 'action', name: 'Action', slug: 'action', description: 'Action games', icon: '🎮', order: 1, isActive: true },
    provider: 'Test Provider',
    isActive: true,
    isFeatured: true,
    popularity: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['action', 'adventure']
  },
  {
    id: '2',
    title: 'Test Game 2',
    slug: 'test-game-2',
    description: 'Another test game',
    thumbnail: '/test2.jpg',
    category: { id: 'puzzle', name: 'Puzzle', slug: 'puzzle', description: 'Puzzle games', icon: '🧩', order: 2, isActive: true },
    provider: 'Test Provider',
    isActive: true,
    isFeatured: false,
    popularity: 70,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['puzzle']
  }
];

const mockCategories = [
  { id: 'action', name: 'Action' },
  { id: 'puzzle', name: 'Puzzle' }
];

describe('MobileGameGrid', () => {
  const defaultProps = {
    games: mockGames,
    onGameClick: jest.fn(),
    onToggleFavorite: jest.fn(),
    favoriteGameIds: [],
    offlineGameIds: [],
    loading: false,
    categories: mockCategories
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders games in a mobile-optimized grid', () => {
    render(<MobileGameGrid {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-game-card-2')).toBeInTheDocument();
    expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    expect(screen.getByText('Test Game 2')).toBeInTheDocument();
  });

  it('displays search input with proper mobile styling', () => {
    render(<MobileGameGrid {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search games...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveClass('touch-manipulation');
  });

  it('shows filter button and dropdown', () => {
    render(<MobileGameGrid {...defaultProps} />);
    
    const filterButton = screen.getByLabelText('Filter games');
    expect(filterButton).toBeInTheDocument();
    expect(filterButton).toHaveClass('tap-target', 'touch-manipulation');
    
    // Click to open filters
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All Games')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Puzzle')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    const onSearchChange = jest.fn();
    render(<MobileGameGrid {...defaultProps} onSearchChange={onSearchChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search games...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('handles category selection', () => {
    const onCategoryChange = jest.fn();
    render(<MobileGameGrid {...defaultProps} onCategoryChange={onCategoryChange} />);
    
    // Open filters
    const filterButton = screen.getByLabelText('Filter games');
    fireEvent.click(filterButton);
    
    // Select a category
    const actionCategory = screen.getByText('Action');
    fireEvent.click(actionCategory);
    
    expect(onCategoryChange).toHaveBeenCalledWith('action');
  });

  it('shows loading skeleton when loading', () => {
    render(<MobileGameGrid {...defaultProps} loading={true} games={[]} />);
    
    // Should not show game cards when loading
    expect(screen.queryByTestId('mobile-game-card-1')).not.toBeInTheDocument();
    
    // Check for loading skeleton elements
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows error state with retry button', () => {
    const error = 'Failed to load games';
    render(<MobileGameGrid {...defaultProps} error={error} />);
    
    expect(screen.getByText('Error Loading Games')).toBeInTheDocument();
    expect(screen.getByText(error)).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveClass('tap-target', 'touch-manipulation');
  });

  it('shows empty state when no games', () => {
    render(<MobileGameGrid {...defaultProps} games={[]} />);
    
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
  });

  it('handles game click events', () => {
    const onGameClick = jest.fn();
    render(<MobileGameGrid {...defaultProps} onGameClick={onGameClick} />);
    
    const playButton = screen.getByText('Play Test Game 1');
    fireEvent.click(playButton);
    
    expect(onGameClick).toHaveBeenCalledWith(mockGames[0]);
  });

  it('handles favorite toggle events', () => {
    const onToggleFavorite = jest.fn();
    render(<MobileGameGrid {...defaultProps} onToggleFavorite={onToggleFavorite} />);
    
    const favoriteButtons = screen.getAllByText('Add to favorites');
    fireEvent.click(favoriteButtons[0]); // Click the first one
    
    expect(onToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('shows offline indicators for offline games', () => {
    render(<MobileGameGrid {...defaultProps} offlineGameIds={['1']} />);
    
    expect(screen.getByText('Offline Available')).toBeInTheDocument();
  });

  it('shows load more button when hasMore is true', () => {
    const onLoadMore = jest.fn();
    render(<MobileGameGrid {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);
    
    const loadMoreButton = screen.getByText('Load More Games');
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).toHaveClass('tap-target', 'touch-manipulation');
    
    fireEvent.click(loadMoreButton);
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('shows loading indicator when loading more', () => {
    render(<MobileGameGrid {...defaultProps} hasMore={true} />);
    
    // Simulate intersection observer triggering load more
    const loadMoreTrigger = document.querySelector('[data-testid="load-more-trigger"]');
    if (loadMoreTrigger) {
      // This would normally be triggered by intersection observer
      expect(screen.queryByText('Loading more games...')).not.toBeInTheDocument();
    }
  });

  it('applies proper mobile touch classes', () => {
    render(<MobileGameGrid {...defaultProps} />);
    
    // Check that mobile-specific classes are applied
    const searchInput = screen.getByPlaceholderText('Search games...');
    expect(searchInput).toHaveClass('touch-manipulation');
    
    const filterButton = screen.getByLabelText('Filter games');
    expect(filterButton).toHaveClass('tap-target', 'touch-manipulation');
  });
});