import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameCard from '../GameCard';
import { Game } from '@/types';
import { describe } from 'node:test';

// Mock the UI components
jest.mock('@/components/ui', () => ({
  Card: ({ children, onClick, className }: any) => (
    <div data-testid="card" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, className, size, variant }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  PlayIcon: () => <div data-testid="play-icon" />,
  HeartIcon: () => <div data-testid="heart-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  FireIcon: () => <div data-testid="fire-icon" />
}));

jest.mock('@heroicons/react/24/outline', () => ({
  HeartIcon: () => <div data-testid="heart-outline-icon" />
}));

const mockGame: Game = {
  id: '1',
  title: 'Test Game',
  slug: 'test-game',
  description: 'A test game description',
  thumbnail: 'https://example.com/thumbnail.jpg',
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
  isFeatured: true,
  popularity: 85,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['popular', 'new']
};

describe('GameCard', () => {
  const mockOnGameClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders game information correctly', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('by Test Provider')).toBeInTheDocument();
    expect(screen.getByText('A test game description')).toBeInTheDocument();
    expect(screen.getByText('Slots')).toBeInTheDocument();
  });

  it('displays game thumbnail when provided', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const thumbnail = screen.getByAltText('Test Game');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
  });

  it('displays placeholder when no thumbnail provided', () => {
    const gameWithoutThumbnail = { ...mockGame, thumbnail: '' };
    
    render(
      <GameCard 
        game={gameWithoutThumbnail}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const playIcons = screen.getAllByTestId('play-icon');
    expect(playIcons.length).toBeGreaterThan(0);
  });

  it('shows HOT badge for featured games', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('HOT')).toBeInTheDocument();
    expect(screen.getByTestId('fire-icon')).toBeInTheDocument();
  });

  it('shows POPULAR badge for high popularity games', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('POPULAR')).toBeInTheDocument();
  });

  it('displays correct star rating based on popularity', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Popularity 85 should convert to 4.3 stars
    expect(screen.getByText('4.3')).toBeInTheDocument();
    
    // Should have 5 star icons (4 filled, 1 empty)
    const starIcons = screen.getAllByTestId('star-icon');
    expect(starIcons).toHaveLength(5);
  });

  it('calls onGameClick when card is clicked', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    fireEvent.click(screen.getByTestId('card'));
    expect(mockOnGameClick).toHaveBeenCalledWith(mockGame);
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);
    
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
    expect(mockOnGameClick).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('shows filled heart when game is favorite', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={true}
      />
    );

    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
  });

  it('shows outline heart when game is not favorite', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    );

    expect(screen.getByTestId('heart-outline-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
  });

  it('hides provider when showProvider is false', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        showProvider={false}
      />
    );

    expect(screen.queryByText('by Test Provider')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        size="sm"
      />
    );

    // Check for small size aspect ratio
    expect(document.querySelector('.aspect-\\[4\\/3\\]')).toBeInTheDocument();

    rerender(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
        size="lg"
      />
    );

    // Check for large size aspect ratio
    expect(document.querySelector('.aspect-\\[16\\/10\\]')).toBeInTheDocument();
  });

  it('calls onGameClick when play button is clicked', () => {
    render(
      <GameCard 
        game={mockGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const playButtons = screen.getAllByTestId('button');
    const playButton = playButtons.find(button => 
      button.textContent?.includes('Play')
    );
    
    if (playButton) {
      fireEvent.click(playButton);
      expect(mockOnGameClick).toHaveBeenCalledWith(mockGame);
    }
  });

  it('handles missing game data gracefully', () => {
    const incompleteGame = {
      ...mockGame,
      description: '',
      provider: ''
    };

    render(
      <GameCard 
        game={incompleteGame}
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.queryByText('by Test Provider')).not.toBeInTheDocument();
  });
});