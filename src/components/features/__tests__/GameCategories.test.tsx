import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameCategories from '../GameCategories';
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

describe('GameCategories', () => {
  const mockOnCategoryClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section title and description', () => {
    render(<GameCategories />);
    
    expect(screen.getByText('Game Categories')).toBeInTheDocument();
    expect(screen.getByText(/Discover your favorite games/)).toBeInTheDocument();
  });

  it('renders all game categories', () => {
    render(<GameCategories />);
    
    expect(screen.getByText('Casino Games')).toBeInTheDocument();
    expect(screen.getByText('Sports Betting')).toBeInTheDocument();
    expect(screen.getByText('Live Games')).toBeInTheDocument();
    expect(screen.getByText('Slot Machines')).toBeInTheDocument();
    expect(screen.getByText('Arcade Games')).toBeInTheDocument();
    expect(screen.getByText('Player Favorites')).toBeInTheDocument();
  });

  it('displays game counts for each category', () => {
    render(<GameCategories />);
    
    expect(screen.getByText('850')).toBeInTheDocument(); // Casino games
    expect(screen.getByText('120')).toBeInTheDocument(); // Sports betting
    expect(screen.getByText('45')).toBeInTheDocument();  // Live games
    expect(screen.getByText((1200).toLocaleString())).toBeInTheDocument(); // Slot machines
    expect(screen.getByText('280')).toBeInTheDocument(); // Arcade games
    expect(screen.getByText('150')).toBeInTheDocument(); // Player favorites
  });

  it('calls onCategoryClick when a category is clicked', () => {
    render(<GameCategories onCategoryClick={mockOnCategoryClick} />);
    
    // Find the card containing "Casino Games" and click it
    const casinoCard = screen.getByText('Casino Games').closest('div[class*="cursor-pointer"]');
    expect(casinoCard).toBeInTheDocument();
    fireEvent.click(casinoCard!);
    
    expect(mockOnCategoryClick).toHaveBeenCalledTimes(1);
    expect(mockOnCategoryClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'casino',
        name: 'Casino Games'
      })
    );
  });

  it('renders explore buttons for each category', () => {
    render(<GameCategories />);
    
    const exploreButtons = screen.getAllByText('Explore Now');
    expect(exploreButtons).toHaveLength(6); // One for each category
  });

  it('renders View All Categories button', () => {
    render(<GameCategories />);
    
    expect(screen.getByText('View All Categories')).toBeInTheDocument();
  });

  it('has proper responsive grid layout', () => {
    const { container } = render(<GameCategories />);
    
    const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('has hover effects on category cards', () => {
    const { container } = render(<GameCategories />);
    
    const categoryCards = container.querySelectorAll('.hover\\:scale-105');
    expect(categoryCards.length).toBeGreaterThan(0);
  });

  it('displays category descriptions', () => {
    render(<GameCategories />);
    
    expect(screen.getByText('Classic slots, poker, blackjack and more')).toBeInTheDocument();
    expect(screen.getByText('Live sports betting with best odds')).toBeInTheDocument();
    expect(screen.getByText('Real dealers, real-time action')).toBeInTheDocument();
  });
});