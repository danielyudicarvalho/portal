import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TouchAdaptedGame from '../TouchAdaptedGame';
import * as mobileDetection from '../../../lib/mobile-detection';
import * as useTouchInputAdapterModule from '../../../hooks/useTouchInputAdapter';

// Mock the mobile detection module
jest.mock('../../../lib/mobile-detection', () => ({
  detectDevice: jest.fn(),
  getGameAdaptationConfig: jest.fn(),
  createGameConfig: jest.fn(),
  meetsMinimumRequirements: jest.fn(),
  getTouchControlStyles: jest.fn()
}));

// Mock the useTouchInputAdapter hook
jest.mock('../../../hooks/useTouchInputAdapter', () => ({
  useTouchInputAdapter: jest.fn()
}));

const mockDetectDevice = mobileDetection.detectDevice as jest.MockedFunction<typeof mobileDetection.detectDevice>;
const mockGetGameAdaptationConfig = mobileDetection.getGameAdaptationConfig as jest.MockedFunction<typeof mobileDetection.getGameAdaptationConfig>;
const mockCreateGameConfig = mobileDetection.createGameConfig as jest.MockedFunction<typeof mobileDetection.createGameConfig>;
const mockMeetsMinimumRequirements = mobileDetection.meetsMinimumRequirements as jest.MockedFunction<typeof mobileDetection.meetsMinimumRequirements>;
const mockGetTouchControlStyles = mobileDetection.getTouchControlStyles as jest.MockedFunction<typeof mobileDetection.getTouchControlStyles>;
const mockUseTouchInputAdapter = useTouchInputAdapterModule.useTouchInputAdapter as jest.MockedFunction<typeof useTouchInputAdapterModule.useTouchInputAdapter>;

describe('TouchAdaptedGame', () => {
  const mockDeviceInfo = {
    isMobile: true,
    isTablet: false,
    isTouch: true,
    screenSize: { width: 375, height: 667 },
    orientation: 'portrait' as const,
    pixelRatio: 2,
    platform: 'ios'
  };

  const mockAdaptationConfig = {
    needsTouchControls: true,
    recommendedControls: [{
      type: 'button' as const,
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      keyMapping: ['Space'],
      action: 'JUMP'
    }],
    viewportOptimization: 'fit' as const,
    preferredOrientation: 'landscape' as const
  };

  const mockGameConfig = {
    width: 800,
    height: 600,
    scaleMode: 'fit' as const,
    touchControls: mockAdaptationConfig.recommendedControls
  };

  const mockTouchAdapter = {
    adaptGameElement: jest.fn(),
    handleOrientationChange: jest.fn(),
    optimizeViewport: jest.fn(),
    cleanup: jest.fn(),
    isEnabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDetectDevice.mockReturnValue(mockDeviceInfo);
    mockGetGameAdaptationConfig.mockReturnValue(mockAdaptationConfig);
    mockCreateGameConfig.mockReturnValue(mockGameConfig);
    mockMeetsMinimumRequirements.mockReturnValue(true);
    mockGetTouchControlStyles.mockReturnValue('.touch-control { opacity: 0.3; }');
    mockUseTouchInputAdapter.mockReturnValue(mockTouchAdapter);
  });

  it('should render children when adaptation is successful', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div data-testid="game-content">Game Content</div>
      </TouchAdaptedGame>
    );

    expect(screen.getByTestId('game-content')).toBeInTheDocument();
  });

  it('should detect device on mount', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    expect(mockDetectDevice).toHaveBeenCalled();
  });

  it('should inject touch control styles', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    expect(mockGetTouchControlStyles).toHaveBeenCalledWith(mockDeviceInfo);
    expect(document.createElement).toHaveBeenCalledWith('style');
  });

  it('should create game configuration', async () => {
    render(
      <TouchAdaptedGame gameId="test-game" gameWidth={1024} gameHeight={768}>
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(mockGetGameAdaptationConfig).toHaveBeenCalledWith('test-game', mockDeviceInfo);
      expect(mockCreateGameConfig).toHaveBeenCalledWith('test-game', mockAdaptationConfig, 1024, 768);
    });
  });

  it('should initialize touch input adapter', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(mockUseTouchInputAdapter).toHaveBeenCalledWith({
        gameConfig: mockGameConfig,
        enabled: true,
        onAdaptationComplete: expect.any(Function),
        onAdaptationError: expect.any(Function)
      });
    });
  });

  it('should show loading overlay while adapting', () => {
    mockTouchAdapter.isEnabled = true;
    mockUseTouchInputAdapter.mockReturnValue({
      ...mockTouchAdapter,
      isEnabled: true
    });

    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    expect(screen.getByText('Optimizing for your device...')).toBeInTheDocument();
  });

  it('should hide loading overlay when adaptation is complete', async () => {
    const { rerender } = render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    // Simulate adaptation completion
    const onAdaptationComplete = mockUseTouchInputAdapter.mock.calls[0][0].onAdaptationComplete;
    onAdaptationComplete();

    rerender(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(screen.queryByText('Optimizing for your device...')).not.toBeInTheDocument();
    });
  });

  it('should show touch instructions for mobile devices', async () => {
    const onAdaptationComplete = jest.fn();
    
    render(
      <TouchAdaptedGame gameId="test-game" onAdaptationComplete={onAdaptationComplete}>
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    // Simulate adaptation completion
    const adapterOnComplete = mockUseTouchInputAdapter.mock.calls[0][0].onAdaptationComplete;
    adapterOnComplete();

    await waitFor(() => {
      expect(screen.getByText('Touch controls are now active. Tap anywhere to dismiss.')).toBeInTheDocument();
    });
  });

  it('should handle adaptation errors', async () => {
    const onAdaptationError = jest.fn();
    const error = new Error('Adaptation failed');

    render(
      <TouchAdaptedGame gameId="test-game" onAdaptationError={onAdaptationError}>
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    // Simulate adaptation error
    const adapterOnError = mockUseTouchInputAdapter.mock.calls[0][0].onAdaptationError;
    adapterOnError(error);

    await waitFor(() => {
      expect(screen.getByText('Game Adaptation Error')).toBeInTheDocument();
      expect(screen.getByText('Adaptation failed')).toBeInTheDocument();
    });

    expect(onAdaptationError).toHaveBeenCalledWith(error);
  });

  it('should show error when minimum requirements are not met', async () => {
    mockMeetsMinimumRequirements.mockReturnValue(false);

    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(screen.getByText('Device does not meet minimum requirements for this game')).toBeInTheDocument();
    });
  });

  it('should handle retry button click', async () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    mockMeetsMinimumRequirements.mockReturnValue(false);

    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it('should adapt game element when container is ready', async () => {
    const mockGameElement = document.createElement('canvas');
    const mockContainer = {
      querySelector: jest.fn(() => mockGameElement)
    };

    // Mock ref
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockContainer });

    render(
      <TouchAdaptedGame gameId="test-game">
        <canvas>Game Content</canvas>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(mockTouchAdapter.adaptGameElement).toHaveBeenCalledWith(mockGameElement);
    });
  });

  it('should handle orientation changes', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    // Simulate orientation change
    fireEvent(window, new Event('orientationchange'));

    await waitFor(() => {
      expect(mockDetectDevice).toHaveBeenCalledTimes(2); // Initial + orientation change
      expect(mockTouchAdapter.handleOrientationChange).toHaveBeenCalled();
    });
  });

  it('should handle window resize', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    // Simulate window resize
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      expect(mockTouchAdapter.handleOrientationChange).toHaveBeenCalled();
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    unmount();

    expect(mockTouchAdapter.cleanup).toHaveBeenCalled();
  });

  it('should set correct data attributes', async () => {
    const { container } = render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      const gameContainer = container.querySelector('.touch-adapted-game');
      expect(gameContainer).toHaveAttribute('data-game-id', 'test-game');
      expect(gameContainer).toHaveAttribute('data-device-type', 'mobile');
      expect(gameContainer).toHaveAttribute('data-orientation', 'portrait');
    });
  });

  it('should not enable touch adapter for desktop devices', () => {
    mockDetectDevice.mockReturnValue({
      ...mockDeviceInfo,
      isMobile: false,
      isTablet: false,
      isTouch: false
    });

    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    expect(mockUseTouchInputAdapter).toHaveBeenCalledWith({
      gameConfig: expect.any(Object),
      enabled: false,
      onAdaptationComplete: expect.any(Function),
      onAdaptationError: expect.any(Function)
    });
  });

  it('should use default game dimensions when not provided', async () => {
    render(
      <TouchAdaptedGame gameId="test-game">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    await waitFor(() => {
      expect(mockCreateGameConfig).toHaveBeenCalledWith('test-game', mockAdaptationConfig, 800, 600);
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TouchAdaptedGame gameId="test-game" className="custom-class">
        <div>Game Content</div>
      </TouchAdaptedGame>
    );

    expect(container.querySelector('.touch-adapted-game')).toHaveClass('custom-class');
  });
});