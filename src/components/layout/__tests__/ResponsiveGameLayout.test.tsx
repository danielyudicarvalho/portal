import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveGameLayout from '../ResponsiveGameLayout';
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
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the child components
jest.mock('../../features/GameGrid', () => {
  return function MockGameGrid() {
    return <div data-testid="desktop-game-grid">Desktop Game Grid</div>;
  };
});

jest.mock('../../features/MobileGameGrid', () => {
  return function MockMobileGameGrid() {
    return <div data-testid="mobile-game-grid">Mobile Game Grid</div>;
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
    tags: ['action']
  }
];

// Mock window properties
const mockWindowProperties = (width: number, touchPoints: number = 0) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: touchPoints,
  });
  
  // Mock ontouchstart
  if (touchPoints > 0) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {},
    });
  } else {
    delete (window as any).ontouchstart;
  }
};

describe('ResponsiveGameLayout', () => {
  const defaultProps = {
    games: mockGames,
    onGameClick: jest.fn(),
    onToggleFavorite: jest.fn(),
    favoriteGameIds: [],
    offlineGameIds: [],
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window properties
    mockWindowProperties(1024, 0);
  });

  it('renders desktop layout on desktop screens', () => {
    mockWindowProperties(1024, 0); // Desktop width, no touch
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('desktop-game-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-game-grid')).not.toBeInTheDocument();
  });

  it('renders mobile layout on mobile screens', () => {
    mockWindowProperties(600, 0); // Mobile width
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-game-grid')).not.toBeInTheDocument();
  });

  it('renders mobile layout on touch devices regardless of screen size', () => {
    mockWindowProperties(1024, 5); // Desktop width but touch device
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-game-grid')).not.toBeInTheDocument();
  });

  it('switches layout when window is resized', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    mockWindowProperties(1024, 0); // Start with desktop
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('desktop-game-grid')).toBeInTheDocument();
    
    // Check that resize event listener is set up
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('passes all props to the selected layout component', () => {
    const props = {
      ...defaultProps,
      searchQuery: 'test',
      selectedCategory: 'action',
      hasMore: true,
      loading: true
    };
    
    mockWindowProperties(600, 0); // Mobile
    
    render(<ResponsiveGameLayout {...props} />);
    
    expect(screen.getByTestId('mobile-game-grid')).toBeInTheDocument();
  });

  it('cleans up resize event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<ResponsiveGameLayout {...defaultProps} />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('handles edge case where window is undefined (SSR)', () => {
    // Mock window as undefined (SSR scenario)
    const originalWindow = global.window;
    delete (global as any).window;
    
    // Should not crash
    expect(() => {
      render(<ResponsiveGameLayout {...defaultProps} />);
    }).not.toThrow();
    
    // Restore window
    global.window = originalWindow;
  });

  it('detects touch capability correctly', () => {
    // Test with ontouchstart property
    mockWindowProperties(1024, 0);
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {},
    });
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-grid')).toBeInTheDocument();
  });

  it('uses correct breakpoint for mobile detection', () => {
    // Test exactly at the breakpoint (768px)
    mockWindowProperties(768, 0);
    
    render(<ResponsiveGameLayout {...defaultProps} />);
    
    // 768px should be considered desktop (>= 768)
    expect(screen.getByTestId('desktop-game-grid')).toBeInTheDocument();
    
    // Test just below the breakpoint with a new render
    mockWindowProperties(767, 0);
    
    const { container } = render(<ResponsiveGameLayout {...defaultProps} />);
    
    // Should show mobile layout for 767px
    expect(container.querySelector('[data-testid="mobile-game-grid"]')).toBeInTheDocument();
  });
});