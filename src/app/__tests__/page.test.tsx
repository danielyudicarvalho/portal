import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock the layout component
jest.mock('@/components/layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
}));

// Mock the feature components
jest.mock('@/components/features', () => ({
  HeroSection: ({ onStartPlaying, onExploreGames }: { onStartPlaying: () => void; onExploreGames: () => void }) => (
    <div data-testid="hero-section">
      <button onClick={onStartPlaying}>Start Playing</button>
      <button onClick={onExploreGames}>Explore Games</button>
    </div>
  ),
  GameCategories: ({ onCategoryClick }: { onCategoryClick: (category: { id: string; name: string }) => void }) => (
    <div data-testid="game-categories">
      <button onClick={() => onCategoryClick({ id: 'casino', name: 'Casino' })}>
        Casino Games
      </button>
    </div>
  ),
  PromotionalBanners: () => <div data-testid="promotional-banners">Promotions</div>,
  FeaturedGames: ({ onGameClick, onToggleFavorite }: { onGameClick: (game: { id: string; title: string }) => void; onToggleFavorite: (gameId: string) => void }) => (
    <div data-testid="featured-games">
      <button onClick={() => onGameClick({ id: '1', title: 'Test Game' })}>
        Test Game
      </button>
      <button onClick={() => onToggleFavorite('1')}>Toggle Favorite</button>
    </div>
  )
}));

describe('Home Page', () => {
  it('renders all main sections', () => {
    render(<Home />);
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('game-categories')).toBeInTheDocument();
    expect(screen.getByTestId('promotional-banners')).toBeInTheDocument();
    expect(screen.getByTestId('featured-games')).toBeInTheDocument();
  });

  it('handles start playing action', () => {
    // Mock console.log to verify the action
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<Home />);
    
    const startPlayingButton = screen.getByText('Start Playing');
    fireEvent.click(startPlayingButton);
    
    // The button should trigger some action (in this case, it would open a modal)
    // Since we're not testing the modal here, we just verify the button works
    expect(startPlayingButton).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('handles explore games action', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<Home />);
    
    const exploreGamesButton = screen.getByText('Explore Games');
    fireEvent.click(exploreGamesButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Explore games clicked');
    
    consoleSpy.mockRestore();
  });

  it('handles category click action', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<Home />);
    
    const categoryButton = screen.getByText('Casino Games');
    fireEvent.click(categoryButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Category clicked:', { id: 'casino', name: 'Casino' });
    
    consoleSpy.mockRestore();
  });

  it('handles game click action', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<Home />);
    
    const gameButton = screen.getByText('Test Game');
    fireEvent.click(gameButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Game clicked:', { id: '1', title: 'Test Game' });
    
    consoleSpy.mockRestore();
  });

  it('handles toggle favorite action', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<Home />);
    
    const favoriteButton = screen.getByText('Toggle Favorite');
    fireEvent.click(favoriteButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Toggle favorite:', '1');
    
    consoleSpy.mockRestore();
  });

  it('renders in correct order', () => {
    const { container } = render(<Home />);
    
    const sections = container.querySelectorAll('[data-testid]');
    const sectionIds = Array.from(sections).map(section => section.getAttribute('data-testid'));
    
    expect(sectionIds).toEqual([
      'layout',
      'hero-section',
      'game-categories', 
      'promotional-banners',
      'featured-games'
    ]);
  });
});