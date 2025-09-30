import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameCard from '../GameCard';
import GameGrid from '../GameGrid';
import { Game } from '@/types';

// Mock game data
const mockGame: Game = {
  id: '1',
  title: 'Test Game',
  slug: 'test-game',
  description: 'A test game for mobile testing',
  thumbnail: '/images/test-game.jpg',
  category: {
    id: '1',
    name: 'Casino',
    slug: 'casino',
    description: 'Casino games',
    icon: '🎰',
    order: 1,
    isActive: true,
    games: []
  },
  provider: 'Test Provider',
  isActive: true,
  isFeatured: true,
  popularity: 85,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['popular', 'new']
};

const mockGames: Game[] = Array.from({ length: 12 }, (_, i) => ({
  ...mockGame,
  id: `${i + 1}`,
  title: `Test Game ${i + 1}`
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Responsive Design', () => {
  describe('GameCard Mobile Interactions', () => {
    it('should have proper touch targets', () => {
      render(
        <GameCard 
          game={mockGame}
          onGameClick={jest.fn()}
          onToggleFavorite={jest.fn()}
        />
      );

      const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
      const playButton = screen.getByRole('button', { name: /play/i });

      // Check if buttons have minimum touch target size
      expect(favoriteButton).toHaveClass('tap-target');
      expect(playButton).toHaveClass('tap-target');
    });

    it('should handle touch events properly', () => {
      const onGameClick = jest.fn();
      const onToggleFavorite = jest.fn();

      render(
        <GameCard 
          game={mockGame}
          onGameClick={onGameClick}
          onToggleFavorite={onToggleFavorite}
        />
      );

      const card = screen.getByRole('button', { name: /play game/i }).closest('div');
      const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);

      // Test touch events
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);
      
      fireEvent.touchStart(favoriteButton);
      fireEvent.click(favoriteButton);

      expect(onToggleFavorite).toHaveBeenCalledWith('1');
    });

    it('should show responsive text on different screen sizes', () => {
      render(
        <GameCard 
          game={mockGame}
          onGameClick={jest.fn()}
          onToggleFavorite={jest.fn()}
        />
      );

      // Check for responsive text classes
      const playButton = screen.getByRole('button', { name: /play game/i });
      expect(playButton).toHaveTextContent('Play Game');
    });
  });

  describe('GameGrid Responsive Layout', () => {
    it('should render with responsive grid classes', () => {
      const { container } = render(
        <GameGrid 
          games={mockGames}
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-3', 'xs:gap-4', 'sm:gap-6');
    });

    it('should handle empty state with responsive padding', () => {
      render(
        <GameGrid 
          games={[]}
          emptyState={{
            title: 'No games found',
            description: 'Try adjusting your filters'
          }}
        />
      );

      const emptyState = screen.getByText('No games found');
      expect(emptyState.closest('div')).toHaveClass('px-4');
    });

    it('should show loading state with responsive spacing', () => {
      const { container } = render(
        <GameGrid 
          games={[]}
          loading={true}
        />
      );

      const loadingContainer = container.querySelector('.space-y-4');
      expect(loadingContainer).toHaveClass('sm:space-y-6');
    });
  });

  describe('Touch Interactions', () => {
    it('should have touch-manipulation class on interactive elements', () => {
      render(
        <GameCard 
          game={mockGame}
          onGameClick={jest.fn()}
          onToggleFavorite={jest.fn()}
        />
      );

      const card = screen.getByRole('button', { name: /play game/i }).closest('div');
      expect(card).toHaveClass('touch-manipulation');
    });

    it('should prevent default touch behavior on buttons', () => {
      const onToggleFavorite = jest.fn();
      
      render(
        <GameCard 
          game={mockGame}
          onGameClick={jest.fn()}
          onToggleFavorite={onToggleFavorite}
        />
      );

      const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
      
      // Test that touch events are handled properly
      fireEvent.touchStart(favoriteButton, { 
        touches: [{ clientX: 0, clientY: 0 }] 
      });
      
      expect(favoriteButton).toHaveClass('touch-manipulation');
    });
  });

  describe('Image Optimization', () => {
    it('should use optimized image component with proper sizes', () => {
      const { container } = render(
        <GameCard 
          game={mockGame}
          onGameClick={jest.fn()}
          onToggleFavorite={jest.fn()}
        />
      );

      // Check if the image container exists (OptimizedImage creates a div wrapper)
      const imageContainer = container.querySelector('[style*="width"]');
      expect(imageContainer).toBeInTheDocument();
    });
  });
});

describe('Mobile Layout Behavior', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('should handle mobile viewport correctly', () => {
    render(
      <GameGrid 
        games={mockGames.slice(0, 4)}
        columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
      />
    );

    const gridContainer = screen.getByRole('grid', { hidden: true }) || 
                         document.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid-cols-1');
  });
});