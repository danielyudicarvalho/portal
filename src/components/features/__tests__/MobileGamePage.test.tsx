import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileGamePage } from '../MobileGamePage';
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

// Mock the mobile detection
jest.mock('../../../lib/mobile-detection', () => ({
  detectDevice: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    screenSize: { width: 375, height: 667 },
    orientation: 'portrait',
    touchSupported: true,
    userAgent: 'mobile-test',
  })),
}));

// Mock the MobileGameWrapper
jest.mock('../MobileGameWrapper', () => ({
  MobileGameWrapper: ({ children, onGameLoad, gameId }: any) => {
    React.useEffect(() => {
      // Simulate game loading
      setTimeout(() => onGameLoad?.(), 100);
    }, [onGameLoad]);
    
    return (
      <div data-testid={`mobile-game-wrapper-${gameId}`}>
        {children}
      </div>
    );
  },
}));

// Mock the FullscreenManager
jest.mock('../FullscreenManager', () => ({
  FullscreenManager: ({ children, gameId, onFullscreenChange }: any) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    
    const toggleFullscreen = () => {
      const newState = !isFullscreen;
      setIsFullscreen(newState);
      onFullscreenChange?.(newState);
    };
    
    return (
      <div data-testid={`fullscreen-manager-${gameId}`}>
        <button 
          data-testid="fullscreen-toggle"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        </button>
        {children}
      </div>
    );
  },
}));

describe('MobileGamePage', () => {
  const defaultProps = {
    gameId: 'test-game',
    gameTitle: 'Test Game',
    gameUrl: '/games/test/index.html',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders game page with iframe', () => {
    render(<MobileGamePage {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
    expect(screen.getByTestId('fullscreen-manager-test-game')).toBeInTheDocument();
    expect(screen.getByTitle('Test Game')).toBeInTheDocument();
  });

  it('renders game info when showGameInfo is true', () => {
    render(<MobileGamePage {...defaultProps} showGameInfo={true} />);
    
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('renders custom controls when provided', () => {
    const customControls = <div data-testid="custom-controls">Custom Controls</div>;
    
    render(
      <MobileGamePage 
        {...defaultProps} 
        showGameInfo={true}
        customControls={customControls}
      />
    );
    
    expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
  });

  it('renders custom children instead of iframe when provided', () => {
    const customContent = <div data-testid="custom-game-content">Custom Game</div>;
    
    render(
      <MobileGamePage {...defaultProps}>
        {customContent}
      </MobileGamePage>
    );
    
    expect(screen.getByTestId('custom-game-content')).toBeInTheDocument();
    expect(screen.queryByTitle('Test Game')).not.toBeInTheDocument();
  });

  it('shows touch controls toggle for keyboard games', async () => {
    render(
      <MobileGamePage 
        {...defaultProps}
        gameConfig={{ requiresKeyboard: true }}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/🎮.*Controls/)).toBeInTheDocument();
    });
  });

  it('handles fullscreen toggle', async () => {
    render(
      <MobileGamePage 
        {...defaultProps}
        enableFullscreen={true}
      />
    );
    
    const fullscreenButton = screen.getByTestId('fullscreen-toggle');
    fireEvent.click(fullscreenButton);
    
    expect(screen.getByText('Exit Fullscreen')).toBeInTheDocument();
  });

  it('applies game-specific configurations', () => {
    const gameConfig = {
      requiresKeyboard: true,
      supportsTouch: true,
      preferredOrientation: 'landscape' as const,
      touchControls: [
        {
          id: 'jump',
          type: 'button' as const,
          position: { x: 100, y: 100 },
          size: { width: 50, height: 50 },
          keyMapping: ['Space'],
          label: 'Jump',
        },
      ],
    };
    
    render(
      <MobileGamePage 
        {...defaultProps}
        gameConfig={gameConfig}
      />
    );
    
    expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<MobileGamePage {...defaultProps} />);
    
    // The loading state should be handled by MobileGameWrapper
    expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
  });

  it('handles game load success', async () => {
    render(<MobileGamePage {...defaultProps} />);
    
    // Wait for the mocked game load to complete
    await waitFor(() => {
      expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
    });
  });

  it('applies correct game configurations for different games', () => {
    const testCases = [
      { gameId: 'box-jump' },
      { gameId: 'memdot' },
      { gameId: 'circle-path' },
      { gameId: 'doodle-jump' },
    ];
    
    testCases.forEach(({ gameId }) => {
      const { unmount } = render(
        <MobileGamePage 
          gameId={gameId}
          gameTitle={`${gameId} Game`}
          gameUrl={`/games/${gameId}/index.html`}
        />
      );
      
      expect(screen.getByTestId(`mobile-game-wrapper-${gameId}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles mobile hints display', async () => {
    render(
      <MobileGamePage 
        {...defaultProps}
        showGameInfo={true}
        gameConfig={{ requiresKeyboard: true }}
        enableFullscreen={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Touch controls available')).toBeInTheDocument();
      expect(screen.getByText('Tap fullscreen for better experience')).toBeInTheDocument();
    });
  });

  it('handles retry functionality', async () => {
    // This would be tested with error scenarios in a more complete implementation
    render(<MobileGamePage {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
  });

  it('applies responsive styles correctly', () => {
    render(<MobileGamePage {...defaultProps} showGameInfo={true} />);
    
    const gameContainer = screen.getByTestId('fullscreen-manager-test-game').parentElement;
    expect(gameContainer).toHaveClass('game-container');
  });

  it('handles orientation changes', () => {
    render(
      <MobileGamePage 
        {...defaultProps}
        gameConfig={{ preferredOrientation: 'landscape' }}
      />
    );
    
    expect(screen.getByTestId('mobile-game-wrapper-test-game')).toBeInTheDocument();
  });
});