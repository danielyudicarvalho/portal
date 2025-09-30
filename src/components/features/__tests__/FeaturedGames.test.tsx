import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturedGames from '../FeaturedGames';
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

describe('FeaturedGames', () => {
  const mockOnGameClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section title and description', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('Featured Games')).toBeInTheDocument();
    expect(screen.getByText(/Handpicked games with the best graphics/)).toBeInTheDocument();
  });

  it('renders default featured games', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('Mega Fortune Slots')).toBeInTheDocument();
    expect(screen.getByText('Live Blackjack Pro')).toBeInTheDocument();
    expect(screen.getByText('Football Champions')).toBeInTheDocument();
    expect(screen.getByText("Dragon's Gold")).toBeInTheDocument();
  });

  it('displays game providers', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('by NetEnt')).toBeInTheDocument();
    expect(screen.getByText('by Evolution Gaming')).toBeInTheDocument();
    expect(screen.getByText('by Pragmatic Play')).toBeInTheDocument();
    expect(screen.getByText('by Red Tiger')).toBeInTheDocument();
  });

  it('shows game ratings with stars', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('displays game badges (HOT, NEW)', () => {
    render(<FeaturedGames />);
    
    const hotBadges = screen.getAllByText('HOT');
    const newBadges = screen.getAllByText('NEW');
    
    expect(hotBadges.length).toBeGreaterThan(0);
    expect(newBadges.length).toBeGreaterThan(0);
  });

  it('calls onGameClick when game card is clicked', () => {
    render(
      <FeaturedGames 
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );
    
    const gameCard = screen.getByText('Mega Fortune Slots').closest('div[class*="cursor-pointer"]');
    expect(gameCard).toBeInTheDocument();
    fireEvent.click(gameCard!);
    
    expect(mockOnGameClick).toHaveBeenCalledTimes(1);
    expect(mockOnGameClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Mega Fortune Slots'
      })
    );
  });

  it('calls onToggleFavorite when favorite button is clicked', () => {
    render(
      <FeaturedGames 
        onGameClick={mockOnGameClick}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );
    
    // Find the first favorite button (heart icon)
    const favoriteButtons = screen.getAllByRole('button');
    const favoriteButton = favoriteButtons.find(button => 
      button.querySelector('svg') && button.closest('.absolute.top-2.right-2')
    );
    
    fireEvent.click(favoriteButton!);
    
    expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1);
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('renders play buttons for each game', () => {
    render(<FeaturedGames />);
    
    const playButtons = screen.getAllByText('Play Game');
    expect(playButtons).toHaveLength(4); // One for each default game
  });

  it('renders View All Games button', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('View All Games')).toBeInTheDocument();
  });

  it('renders Load More Games button', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText('Load More Games')).toBeInTheDocument();
  });

  it('has proper responsive grid layout', () => {
    const { container } = render(<FeaturedGames />);
    
    const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  it('displays game categories', () => {
    render(<FeaturedGames />);
    
    const slotsElements = screen.getAllByText('Slots');
    expect(slotsElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Live Casino')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });

  it('shows game descriptions', () => {
    render(<FeaturedGames />);
    
    expect(screen.getByText(/Progressive jackpot slot with luxury theme/)).toBeInTheDocument();
    expect(screen.getByText(/Professional live blackjack with real dealers/)).toBeInTheDocument();
  });

  it('handles custom games prop', () => {
    const customGames = [{
      id: 'custom-1',
      title: 'Custom Game',
      provider: 'Custom Provider',
      thumbnail: '/custom-thumb.jpg',
      category: 'Custom',
      rating: 5.0,
      isFavorite: false,
      description: 'A custom game for testing'
    }];

    render(<FeaturedGames games={customGames} />);
    
    expect(screen.getByText('Custom Game')).toBeInTheDocument();
    expect(screen.getByText('by Custom Provider')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});