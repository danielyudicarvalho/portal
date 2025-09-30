import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  const mockOnStartPlaying = jest.fn();
  const mockOnExploreGames = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders hero section with main heading', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('Welcome to GamePortal')).toBeInTheDocument();
    expect(screen.getByText(/Experience the ultimate gaming platform/)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(
      <HeroSection 
        onStartPlaying={mockOnStartPlaying}
        onExploreGames={mockOnExploreGames}
      />
    );
    
    expect(screen.getByText('Start Playing')).toBeInTheDocument();
    expect(screen.getByText('Explore Games')).toBeInTheDocument();
  });

  it('calls onStartPlaying when Start Playing button is clicked', () => {
    render(
      <HeroSection 
        onStartPlaying={mockOnStartPlaying}
        onExploreGames={mockOnExploreGames}
      />
    );
    
    fireEvent.click(screen.getByText('Start Playing'));
    expect(mockOnStartPlaying).toHaveBeenCalledTimes(1);
  });

  it('calls onExploreGames when Explore Games button is clicked', () => {
    render(
      <HeroSection 
        onStartPlaying={mockOnStartPlaying}
        onExploreGames={mockOnExploreGames}
      />
    );
    
    fireEvent.click(screen.getByText('Explore Games'));
    expect(mockOnExploreGames).toHaveBeenCalledTimes(1);
  });

  it('renders statistics section', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('2,500+')).toBeInTheDocument();
    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Active Players')).toBeInTheDocument();
    expect(screen.getByText('$1M+')).toBeInTheDocument();
    expect(screen.getByText('Daily Jackpots')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
  });

  it('has proper responsive classes', () => {
    const { container } = render(<HeroSection />);
    
    // Check for responsive text classes
    const heading = screen.getByText('Welcome to GamePortal');
    expect(heading).toHaveClass('text-4xl', 'md:text-6xl', 'lg:text-7xl');
    
    // Check for responsive button layout
    const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
    expect(buttonContainer).toBeInTheDocument();
  });

  it('has proper animation classes', () => {
    const { container } = render(<HeroSection />);
    
    // Check for animation classes
    const animatedElements = container.querySelectorAll('.animate-fade-in, .animate-slide-up');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
});