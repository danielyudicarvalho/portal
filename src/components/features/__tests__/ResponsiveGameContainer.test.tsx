import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ResponsiveGameContainer } from '../ResponsiveGameContainer';
import { getOrientationManager } from '@/lib/orientation-manager';

// Mock the orientation manager
jest.mock('@/lib/orientation-manager', () => ({
  getOrientationManager: jest.fn()
}));

const mockOrientationManager = {
  getCurrentOrientation: jest.fn(),
  getOptimalViewport: jest.fn(),
  setViewportConfig: jest.fn(),
  resetViewport: jest.fn(),
  addOrientationListener: jest.fn(),
  calculateScaleFactor: jest.fn()
};

describe('ResponsiveGameContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrientationManager as jest.Mock).mockReturnValue(mockOrientationManager);
    
    mockOrientationManager.getCurrentOrientation.mockReturnValue('portrait');
    mockOrientationManager.getOptimalViewport.mockReturnValue({ width: 375, height: 667 });
    mockOrientationManager.addOrientationListener.mockReturnValue(() => {});
    mockOrientationManager.calculateScaleFactor.mockReturnValue(1);
  });

  it('should render children correctly', () => {
    render(
      <ResponsiveGameContainer gameId="test-game">
        <div data-testid="game-content">Test Game</div>
      </ResponsiveGameContainer>
    );

    expect(screen.getByTestId('responsive-game-container')).toBeInTheDocument();
    expect(screen.getByTestId('game-content-wrapper')).toBeInTheDocument();
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should apply correct data attributes', () => {
    render(
      <ResponsiveGameContainer gameId="test-game">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    const container = screen.getByTestId('responsive-game-container');
    expect(container).toHaveAttribute('data-game-id', 'test-game');
    expect(container).toHaveAttribute('data-orientation', 'portrait');
  });

  it('should apply viewport configuration', () => {
    const viewportConfig = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    render(
      <ResponsiveGameContainer gameId="test-game" viewportConfig={viewportConfig}>
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(viewportConfig);
  });

  it('should handle orientation changes', () => {
    const onOrientationChange = jest.fn();
    let orientationListener: (event: any) => void;

    mockOrientationManager.addOrientationListener.mockImplementation((listener) => {
      orientationListener = listener;
      return () => {};
    });

    render(
      <ResponsiveGameContainer 
        gameId="test-game" 
        onOrientationChange={onOrientationChange}
      >
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    // Simulate orientation change
    const orientationEvent = {
      orientation: 'landscape',
      angle: 90,
      width: 667,
      height: 375
    };

    act(() => {
      orientationListener!(orientationEvent);
    });

    expect(onOrientationChange).toHaveBeenCalledWith(orientationEvent);
  });

  it('should apply scaling when viewport config has dimensions', () => {
    const viewportConfig = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    mockOrientationManager.calculateScaleFactor.mockReturnValue(0.5);

    render(
      <ResponsiveGameContainer gameId="test-game" viewportConfig={viewportConfig}>
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    expect(mockOrientationManager.calculateScaleFactor).toHaveBeenCalledWith(800, 600, 'fit');
  });

  it('should apply custom className', () => {
    render(
      <ResponsiveGameContainer gameId="test-game" className="custom-class">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    const container = screen.getByTestId('responsive-game-container');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveClass('portrait');
  });

  it('should update orientation class on orientation change', () => {
    let orientationListener: (event: any) => void;

    mockOrientationManager.addOrientationListener.mockImplementation((listener) => {
      orientationListener = listener;
      return () => {};
    });

    render(
      <ResponsiveGameContainer gameId="test-game">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    const container = screen.getByTestId('responsive-game-container');
    expect(container).toHaveClass('portrait');

    // Simulate orientation change to landscape
    act(() => {
      orientationListener!({
        orientation: 'landscape',
        angle: 90,
        width: 667,
        height: 375
      });
    });

    expect(container).toHaveClass('landscape');
  });

  it('should clean up on unmount', () => {
    const unsubscribe = jest.fn();
    mockOrientationManager.addOrientationListener.mockReturnValue(unsubscribe);

    const { unmount } = render(
      <ResponsiveGameContainer gameId="test-game">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockOrientationManager.resetViewport).toHaveBeenCalled();
  });

  it('should handle missing viewport config gracefully', () => {
    render(
      <ResponsiveGameContainer gameId="test-game">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    // Should not call setViewportConfig without config
    expect(mockOrientationManager.setViewportConfig).not.toHaveBeenCalled();
  });

  it('should apply correct game content styles with viewport config', () => {
    const viewportConfig = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    render(
      <ResponsiveGameContainer gameId="test-game" viewportConfig={viewportConfig}>
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    const gameContent = screen.getByTestId('game-content-wrapper');
    expect(gameContent).toHaveStyle({
      width: '800px',
      height: '600px'
    });
  });

  it('should apply default styles without viewport config', () => {
    render(
      <ResponsiveGameContainer gameId="test-game">
        <div>Test Game</div>
      </ResponsiveGameContainer>
    );

    const gameContent = screen.getByTestId('game-content-wrapper');
    expect(gameContent).toHaveStyle({
      width: '100%',
      height: '100%'
    });
  });
});