import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileGameCard from '../MobileGameCard';
import { Game } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, fill, ...props }: any) {
    // Use div instead of img to avoid ESLint warning
    return (
      <div 
        data-src={src} 
        data-alt={alt} 
        data-testid="next-image"
        style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : undefined}
        {...props} 
      />
    );
  };
});

// Mock OptimizedImage component
jest.mock('../../ui/OptimizedImage', () => {
  return function MockOptimizedImage({ src, alt, fallbackSrc, fill, ...props }: any) {
    const Image = require('next/image').default;
    return (
      <div data-testid="optimized-image">
        <Image 
          src={src || fallbackSrc} 
          alt={alt} 
          fill={fill}
          {...props}
        />
      </div>
    );
  };
});

const mockGame: Game = {
  id: '1',
  title: 'Test Mobile Game',
  slug: 'test-mobile-game',
  description: 'A test game optimized for mobile devices with touch controls',
  thumbnail: '/test-game.jpg',
  category: { id: 'action', name: 'Action', slug: 'action', description: 'Action games', icon: '🎮', order: 1, isActive: true },
  provider: 'Test Provider',
  isActive: true,
  isFeatured: true,
  popularity: 85,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['action', 'mobile']
};

describe('MobileGameCard', () => {
  const defaultProps = {
    game: mockGame,
    onGameClick: jest.fn(),
    onToggleFavorite: jest.fn(),
    isFavorite: false,
    isOffline: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders game information correctly', () => {
    render(<MobileGameCard {...defaultProps} />);

    expect(screen.getByText('Test Mobile Game')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('A test game optimized for mobile devices with touch controls')).toBeInTheDocument();
  });

  it('displays game thumbnail with fallback', () => {
    render(<MobileGameCard {...defaultProps} />);

    const optimizedImageContainer = screen.getByTestId('optimized-image');
    expect(optimizedImageContainer).toBeInTheDocument();
    
    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-src', '/test-game.jpg');
    expect(image).toHaveAttribute('data-alt', 'Test Mobile Game');
  });

  it('shows featured badge for featured games', () => {
    render(<MobileGameCard {...defaultProps} />);

    expect(screen.getByText('HOT')).toBeInTheDocument();
  });

  it('shows offline badge when game is available offline', () => {
    render(<MobileGameCard {...defaultProps} isOffline={true} />);

    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  it('shows popular badge for high popularity games', () => {
    render(<MobileGameCard {...defaultProps} />);

    expect(screen.getByText('TOP')).toBeInTheDocument();
  });

  it('handles touch interactions properly', () => {
    const onGameClick = jest.fn();
    render(<MobileGameCard {...defaultProps} onGameClick={onGameClick} />);

    // Find the main card container (the one with touch-manipulation class)
    const card = document.querySelector('.touch-manipulation');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('touch-manipulation');

    // Simulate touch events
    fireEvent.touchStart(card!, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(card!, { changedTouches: [{ clientX: 100, clientY: 100 }] });

    expect(onGameClick).toHaveBeenCalledWith(mockGame);
  });

  it('handles favorite button click', () => {
    const onToggleFavorite = jest.fn();
    render(<MobileGameCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveClass('tap-target', 'touch-manipulation');

    fireEvent.click(favoriteButton);
    expect(onToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('shows filled heart when game is favorite', () => {
    render(<MobileGameCard {...defaultProps} isFavorite={true} />);

    const favoriteButton = screen.getByLabelText('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('handles play button click', () => {
    const onGameClick = jest.fn();
    render(<MobileGameCard {...defaultProps} onGameClick={onGameClick} />);

    const playButton = screen.getByText('Play Game');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveClass('tap-target', 'touch-manipulation');

    fireEvent.click(playButton);
    expect(onGameClick).toHaveBeenCalledWith(mockGame);
  });

  it('prevents event bubbling on button clicks', () => {
    const onGameClick = jest.fn();
    const onToggleFavorite = jest.fn();
    render(<MobileGameCard {...defaultProps} onGameClick={onGameClick} onToggleFavorite={onToggleFavorite} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    // Only favorite handler should be called, not game click
    expect(onToggleFavorite).toHaveBeenCalledWith('1');
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it('renders star rating correctly', () => {
    render(<MobileGameCard {...defaultProps} />);

    // Game has popularity 85, which should translate to 4.25 stars (rounded to 4)
    const stars = document.querySelectorAll('.text-yellow-400');
    expect(stars).toHaveLength(4); // 4 filled stars

    const emptyStars = document.querySelectorAll('.text-gray-600');
    expect(emptyStars).toHaveLength(1); // 1 empty star
  });

  it('applies proper mobile sizing classes', () => {
    render(<MobileGameCard {...defaultProps} size="sm" />);

    const thumbnailContainer = document.querySelector('.aspect-\\[4\\/3\\]');
    expect(thumbnailContainer).toBeInTheDocument();
  });

  it('handles touch move cancellation', () => {
    const onGameClick = jest.fn();
    render(<MobileGameCard {...defaultProps} onGameClick={onGameClick} />);

    const card = document.querySelector('.touch-manipulation');

    // Start touch
    fireEvent.touchStart(card!, { touches: [{ clientX: 100, clientY: 100 }] });

    // Move touch significantly (should cancel the press)
    fireEvent.touchMove(card!, { touches: [{ clientX: 150, clientY: 150 }] });

    // End touch
    fireEvent.touchEnd(card!, { changedTouches: [{ clientX: 150, clientY: 150 }] });

    // Should not trigger click due to movement
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it('shows fallback image when thumbnail is not available', () => {
    const gameWithoutThumbnail = { ...mockGame, thumbnail: '' };
    render(<MobileGameCard {...defaultProps} game={gameWithoutThumbnail} />);

    // Should show play icon as fallback
    const playIcon = document.querySelector('.h-8.w-8.text-white\\/60');
    expect(playIcon).toBeInTheDocument();
  });

  it('applies pressed state styling during touch', () => {
    render(<MobileGameCard {...defaultProps} />);

    const card = document.querySelector('.touch-manipulation');

    // Start touch
    fireEvent.touchStart(card!, { touches: [{ clientX: 100, clientY: 100 }] });

    // Should have pressed styling
    expect(card).toHaveClass('scale-95');

    // End touch
    fireEvent.touchEnd(card!, { changedTouches: [{ clientX: 100, clientY: 100 }] });

    // Should remove pressed styling
    expect(card).not.toHaveClass('scale-95');
  });

  it('hides description on extra small screens', () => {
    render(<MobileGameCard {...defaultProps} />);

    const description = screen.getByText('A test game optimized for mobile devices with touch controls');
    expect(description).toHaveClass('hidden', 'xs:block');
  });
});