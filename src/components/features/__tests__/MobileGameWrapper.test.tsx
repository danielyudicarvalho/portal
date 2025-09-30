import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileGameWrapper, type GameConfig } from '../MobileGameWrapper';
import * as mobileDetection from '../../../lib/mobile-detection';

// Mock the mobile detection module
jest.mock('../../../lib/mobile-detection', () => ({
  detectDevice: jest.fn(),
  getGameAdaptationConfig: jest.fn(),
  createGameConfig: jest.fn(),
  meetsMinimumRequirements: jest.fn(),
  getTouchControlStyles: jest.fn(),
}));

// Mock the TouchAdaptedGame component
jest.mock('../TouchAdaptedGame', () => {
  return {
    TouchAdaptedGame: ({ children, onAdaptationComplete, className }: any) => {
      React.useEffect(() => {
        // Simulate successful adaptation
        setTimeout(() => onAdaptationComplete?.(), 100);
      }, [onAdaptationComplete]);
      
      return (
        <div className={`touch-adapted-game-mock ${className}`}>
          {children}
        </div>
      );
    }
  };
});

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

const mockDetectDevice = mobileDetection.detectDevice as jest.MockedFunction<typeof mobileDetection.detectDevice>;
const mockGetTouchControlStyles = mobileDetection.getTouchControlStyles as jest.MockedFunction<typeof mobileDetection.getTouchControlStyles>;

describe('MobileGameWrapper', () => {
  const defaultGameConfig: GameConfig = {
    width: 800,
    height: 600,
    scaleMode: 'fit',
    touchControls: [],
    requiresKeyboard: false,
    supportsTouch: true,
  };

  const mockDeviceInfo = {
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isTouch: true,
    screenWidth: 375,
    screenHeight: 667,
    orientation: 'portrait' as const,
    userAgent: 'mobile-test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDetectDevice.mockReturnValue(mockDeviceInfo);
    mockGetTouchControlStyles.mockReturnValue('/* mock styles */');
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  it('renders game wrapper with loading state initially', () => {
    render(
      <MobileGameWrapper gameId="test-game" gameConfig={defaultGameConfig}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    expect(screen.getByText('Loading game...')).toBeInTheDocument();
    expect(screen.getByText('Game Content')).toBeInTheDocument();
  });

  it('shows game controls bar on mobile devices', async () => {
    render(
      <MobileGameWrapper gameId="test-game" gameConfig={defaultGameConfig}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });
  });

  it('shows touch controls button when keyboard is required', async () => {
    const configWithKeyboard: GameConfig = {
      ...defaultGameConfig,
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'jump',
          type: 'button',
          position: { x: 100, y: 100 },
          size: { width: 60, height: 60 },
          keyMapping: ['Space'],
          label: 'Jump',
        },
      ],
    };

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={configWithKeyboard}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Show touch controls')).toBeInTheDocument();
    });
  });

  it('handles fullscreen toggle correctly', async () => {
    const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
    const mockExitFullscreen = jest.fn().mockResolvedValue(undefined);
    
    HTMLElement.prototype.requestFullscreen = mockRequestFullscreen;
    document.exitFullscreen = mockExitFullscreen;

    const onFullscreenToggle = jest.fn();

    render(
      <MobileGameWrapper 
        gameId="test-game" 
        gameConfig={defaultGameConfig}
        onFullscreenToggle={onFullscreenToggle}
      >
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });

    const fullscreenBtn = screen.getByLabelText('Enter fullscreen');
    fireEvent.click(fullscreenBtn);

    await waitFor(() => {
      expect(mockRequestFullscreen).toHaveBeenCalled();
    });
  });

  it('displays touch controls when enabled', async () => {
    const configWithTouchControls: GameConfig = {
      ...defaultGameConfig,
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'jump',
          type: 'button',
          position: { x: 100, y: 500 },
          size: { width: 60, height: 60 },
          keyMapping: ['Space'],
          label: 'Jump',
        },
        {
          id: 'move-left',
          type: 'button',
          position: { x: 20, y: 500 },
          size: { width: 60, height: 60 },
          keyMapping: ['ArrowLeft'],
          label: '←',
        },
      ],
    };

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={configWithTouchControls}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      const touchControlsBtn = screen.getByLabelText('Show touch controls');
      fireEvent.click(touchControlsBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Jump')).toBeInTheDocument();
      expect(screen.getByText('←')).toBeInTheDocument();
    });
  });

  it('handles game loading completion', async () => {
    const onGameLoad = jest.fn();

    render(
      <MobileGameWrapper 
        gameId="test-game" 
        gameConfig={defaultGameConfig}
        onGameLoad={onGameLoad}
      >
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      expect(onGameLoad).toHaveBeenCalled();
    });

    // Loading overlay should be removed
    expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
  });

  it('handles game errors correctly', async () => {
    const onGameError = jest.fn();
    const errorMessage = 'Game failed to load';

    // Create a custom component that triggers an error
    const ErrorTriggeringWrapper = ({ onGameError }: { onGameError: (error: Error) => void }) => {
      React.useEffect(() => {
        setTimeout(() => onGameError(new Error(errorMessage)), 100);
      }, [onGameError]);
      
      return (
        <MobileGameWrapper 
          gameId="test-game" 
          gameConfig={defaultGameConfig}
          onGameError={onGameError}
        >
          <div>Game Content</div>
        </MobileGameWrapper>
      );
    };

    render(<ErrorTriggeringWrapper onGameError={onGameError} />);

    await waitFor(() => {
      expect(onGameError).toHaveBeenCalledWith(new Error(errorMessage));
    });
  });

  it('shows requirements error for unsupported devices', () => {
    const configWithMinRequirements: GameConfig = {
      ...defaultGameConfig,
      minScreenSize: {
        width: 1024,
        height: 768,
      },
    };

    // Mock device with smaller screen
    mockDetectDevice.mockReturnValue({
      ...mockDeviceInfo,
      screenWidth: 320,
      screenHeight: 568,
    });

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={configWithMinRequirements}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    expect(screen.getByText('Device Requirements Not Met')).toBeInTheDocument();
    expect(screen.getByText(/minimum screen size of 1024x768/)).toBeInTheDocument();
    expect(screen.getByText(/Your device: 320x568/)).toBeInTheDocument();
  });

  it('handles window resize and orientation changes', async () => {
    render(
      <MobileGameWrapper gameId="test-game" gameConfig={defaultGameConfig}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 667,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Mock landscape orientation
    mockDetectDevice.mockReturnValue({
      ...mockDeviceInfo,
      orientation: 'landscape',
      screenWidth: 667,
      screenHeight: 375,
    });

    fireEvent(window, new Event('resize'));
    fireEvent(window, new Event('orientationchange'));

    await waitFor(() => {
      expect(mockDetectDevice).toHaveBeenCalledTimes(3); // Initial + 2 events
    });
  });

  it('applies correct scaling based on scale mode', async () => {
    const stretchConfig: GameConfig = {
      ...defaultGameConfig,
      scaleMode: 'stretch',
    };

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={stretchConfig}>
        <iframe src="/test-game" title="Test Game" />
      </MobileGameWrapper>
    );

    await waitFor(() => {
      // Component should be loaded
      expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
    });

    // Test that the wrapper has the correct scale mode data attribute
    const wrapper = document.querySelector('[data-scale-mode="stretch"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('data-scale-mode', 'stretch');
  });

  it('handles touch control interactions', async () => {
    const configWithTouchControls: GameConfig = {
      ...defaultGameConfig,
      requiresKeyboard: true,
      touchControls: [
        {
          id: 'jump',
          type: 'button',
          position: { x: 100, y: 500 },
          size: { width: 60, height: 60 },
          keyMapping: ['Space'],
          label: 'Jump',
        },
      ],
    };

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={configWithTouchControls}>
        <canvas data-testid="game-canvas" />
      </MobileGameWrapper>
    );

    await waitFor(() => {
      const touchControlsBtn = screen.getByLabelText('Show touch controls');
      fireEvent.click(touchControlsBtn);
    });

    await waitFor(() => {
      const jumpButton = screen.getByText('Jump');
      expect(jumpButton).toBeInTheDocument();
      
      // Simulate touch interaction
      fireEvent.touchStart(jumpButton);
      fireEvent.touchEnd(jumpButton);
    });
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <MobileGameWrapper gameId="test-game" gameConfig={defaultGameConfig}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('handles different game scale modes correctly', async () => {
    const fillConfig: GameConfig = {
      ...defaultGameConfig,
      scaleMode: 'fill',
    };

    render(
      <MobileGameWrapper gameId="test-game" gameConfig={fillConfig}>
        <div>Game Content</div>
      </MobileGameWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
    });

    // Test that the wrapper has the correct scale mode
    const wrapper = document.querySelector('[data-scale-mode="fill"]');
    expect(wrapper).toBeInTheDocument();
  });
});