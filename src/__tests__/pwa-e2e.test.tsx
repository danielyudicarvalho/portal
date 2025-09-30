/**
 * PWA End-to-End Integration Tests
 * 
 * Complete workflow tests for PWA functionality including:
 * - App installation flow
 * - Offline game playing
 * - Mobile optimization
 * - Cross-component integration
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';

// Import components for integration testing
import { PWAProvider } from '@/components/providers/PWAProvider';
import { InstallPrompt } from '@/components/features/InstallPrompt';
import { MobileGameWrapper } from '@/components/features/MobileGameWrapper';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

// Mock external dependencies
jest.mock('@/lib/pwa', () => ({
  registerServiceWorker: jest.fn().mockResolvedValue(undefined),
  getServiceWorkerStatus: jest.fn().mockResolvedValue({
    isRegistered: true,
    isControlling: true,
    isWaiting: false,
  }),
  isServiceWorkerSupported: jest.fn(() => true),
}));

jest.mock('@/lib/game-cache-manager', () => ({
  gameCacheManager: {
    cacheGameAssets: jest.fn().mockResolvedValue(undefined),
    isGameAvailableOffline: jest.fn().mockResolvedValue(true),
    getOfflineGames: jest.fn().mockResolvedValue(['memdot', 'clocks']),
    clearGameCache: jest.fn().mockResolvedValue(undefined),
    getCacheSize: jest.fn().mockResolvedValue(50 * 1024 * 1024), // 50MB
    preloadCriticalAssets: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/mobile-detection', () => ({
  detectDevice: jest.fn(() => ({
    isMobile: true,
    deviceType: 'mobile',
    orientation: 'portrait',
    screenSize: { width: 375, height: 667 },
    touchSupport: true,
    platform: 'iOS',
    browser: 'Safari',
  })),
  isMobileDevice: jest.fn(() => true),
}));

jest.mock('@/lib/network-status', () => ({
  useNetworkStatus: jest.fn(() => ({
    isOnline: true,
    connectionType: '4g',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  })),
}));

jest.mock('@/hooks/useMobilePerformance', () => ({
  useMobilePerformance: jest.fn(() => ({
    isOptimizing: false,
    isOptimized: true,
    metrics: {
      averageFPS: 60,
      gameLoadTime: 1200,
      frameCount: 3600,
    },
    recommendations: [],
    warnings: [],
    startOptimization: jest.fn(),
    stopOptimization: jest.fn(),
    isMobileDevice: true,
    shouldOptimize: false,
  })),
  usePreloadProgress: jest.fn(() => ({
    percentage: 100,
    loaded: 10,
    total: 10,
    currentAsset: null,
  })),
}));

jest.mock('@/hooks/useMobileAnalytics', () => ({
  useMobileAnalytics: jest.fn(() => ({
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    startPerformanceSession: jest.fn(),
    endPerformanceSession: jest.fn(),
    measureTouchLatency: jest.fn(),
    markRenderStart: jest.fn(),
    markRenderEnd: jest.fn(),
    currentSession: null,
  })),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PWAProvider>
      {children}
    </PWAProvider>
  );
}

// Mock game config for testing
const mockGameConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fit' as const,
  touchControls: [
    {
      id: 'jump',
      type: 'button' as const,
      position: { x: 50, y: 500 },
      size: { width: 60, height: 60 },
      keyMapping: ['Space'],
      label: 'Jump',
    },
  ],
  requiresKeyboard: true,
  supportsTouch: true,
};

describe('PWA End-to-End Integration Tests', () => {
  let mockInstallPromptEvent: any;

  beforeAll(() => {
    // Setup global mocks
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: {
          register: jest.fn().mockResolvedValue({}),
          ready: Promise.resolve({}),
        },
        onLine: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
      writable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock BeforeInstallPromptEvent
    mockInstallPromptEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      platforms: ['web'],
    };

    global.BeforeInstallPromptEvent = jest.fn().mockImplementation(() => mockInstallPromptEvent);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete PWA Installation Flow', () => {
    it('should complete the full installation workflow', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <InstallPrompt variant="card" showDismiss={true} />
        </TestWrapper>
      );

      // Wait for PWA provider to initialize
      await waitFor(() => {
        expect(screen.queryByText('Install Game Portal')).toBeInTheDocument();
      });

      // Simulate beforeinstallprompt event
      act(() => {
        window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
          detail: mockInstallPromptEvent,
        }));
      });

      // Click install button
      const installButton = screen.getByText('Install Now');
      await user.click(installButton);

      // Verify installation process
      expect(mockInstallPromptEvent.preventDefault).toHaveBeenCalled();
      expect(mockInstallPromptEvent.prompt).toHaveBeenCalled();

      // Wait for installation success
      await waitFor(() => {
        expect(screen.queryByText('Installing...')).not.toBeInTheDocument();
      });
    });

    it('should handle installation cancellation gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock user cancellation
      mockInstallPromptEvent.userChoice = Promise.resolve({ 
        outcome: 'dismissed', 
        platform: 'web' 
      });

      render(
        <TestWrapper>
          <InstallPrompt variant="button" />
        </TestWrapper>
      );

      // Simulate install prompt availability
      act(() => {
        window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
          detail: mockInstallPromptEvent,
        }));
      });

      const installButton = screen.getByText('Install App');
      await user.click(installButton);

      // Should handle cancellation without errors
      expect(mockInstallPromptEvent.prompt).toHaveBeenCalled();
    });

    it('should show iOS-specific installation instructions', async () => {
      // Mock iOS Safari
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(
        <TestWrapper>
          <div data-testid="ios-install-instructions">
            Add to Home Screen instructions for iOS
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('ios-install-instructions')).toBeInTheDocument();
    });
  });

  describe('Offline Functionality Integration', () => {
    it('should handle complete offline workflow', async () => {
      render(
        <TestWrapper>
          <OfflineIndicator showOnlineStatus={true} />
        </TestWrapper>
      );

      // Initially online
      expect(screen.getByText('Online')).toBeInTheDocument();

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true,
        });
        window.dispatchEvent(new Event('offline'));
      });

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });

      // Should show limited functionality message
      expect(screen.getByText('- Limited functionality')).toBeInTheDocument();

      // Simulate coming back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: true,
          writable: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // Should show online status again
      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
      });
    });

    it('should cache and play games offline', async () => {
      const { gameCacheManager } = await import('@/lib/game-cache-manager');

      // Cache a game
      await gameCacheManager.cacheGameAssets('memdot');
      expect(gameCacheManager.cacheGameAssets).toHaveBeenCalledWith('memdot');

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      // Check if game is available offline
      const isAvailable = await gameCacheManager.isGameAvailableOffline('memdot');
      expect(isAvailable).toBe(true);

      // Get list of offline games
      const offlineGames = await gameCacheManager.getOfflineGames();
      expect(offlineGames).toContain('memdot');
    });
  });

  describe('Mobile Game Integration', () => {
    it('should render and adapt games for mobile', async () => {
      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
            onGameLoad={jest.fn()}
            onGameError={jest.fn()}
          >
            <div data-testid="game-content">Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Should render game wrapper
      expect(screen.getByTestId('game-content')).toBeInTheDocument();

      // Should show mobile controls
      await waitFor(() => {
        expect(document.querySelector('.game-controls-bar')).toBeInTheDocument();
      });

      // Should show fullscreen button
      expect(document.querySelector('.fullscreen-btn')).toBeInTheDocument();

      // Should show touch controls button (since requiresKeyboard is true)
      expect(document.querySelector('.touch-controls-btn')).toBeInTheDocument();
    });

    it('should handle fullscreen toggle', async () => {
      const user = userEvent.setup();
      
      // Mock fullscreen API
      const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
      const mockExitFullscreen = jest.fn().mockResolvedValue(undefined);

      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: mockRequestFullscreen,
        writable: true,
      });

      Object.defineProperty(document, 'exitFullscreen', {
        value: mockExitFullscreen,
        writable: true,
      });

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
            onFullscreenToggle={jest.fn()}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      const fullscreenButton = document.querySelector('.fullscreen-btn') as HTMLElement;
      expect(fullscreenButton).toBeInTheDocument();

      // Click fullscreen button
      await user.click(fullscreenButton);

      expect(mockRequestFullscreen).toHaveBeenCalled();
    });

    it('should show touch controls when needed', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      const touchControlsButton = document.querySelector('.touch-controls-btn') as HTMLElement;
      expect(touchControlsButton).toBeInTheDocument();

      // Click to show touch controls
      await user.click(touchControlsButton);

      // Should show touch controls overlay
      await waitFor(() => {
        expect(document.querySelector('.touch-controls-overlay')).toBeInTheDocument();
      });
    });

    it('should handle orientation changes', async () => {
      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Simulate orientation change
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });
        window.dispatchEvent(new Event('orientationchange'));
      });

      // Game should adapt to new orientation
      await waitFor(() => {
        expect(window.innerWidth).toBe(667);
        expect(window.innerHeight).toBe(375);
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor and display performance metrics', async () => {
      const { useMobilePerformance } = await import('@/hooks/useMobilePerformance');
      
      // Mock performance data
      (useMobilePerformance as any).mockReturnValue({
        isOptimizing: false,
        isOptimized: true,
        metrics: {
          averageFPS: 45, // Below 60 FPS
          gameLoadTime: 2500, // Slow load time
          frameCount: 2700,
        },
        recommendations: ['Reduce texture quality', 'Disable particle effects'],
        warnings: [{ type: 'low_fps', message: 'FPS below 60' }],
        startOptimization: jest.fn(),
        stopOptimization: jest.fn(),
        isMobileDevice: true,
        shouldOptimize: true,
      });

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
            enablePerformanceMonitoring={true}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Should show performance indicator
      await waitFor(() => {
        const performanceIndicator = document.querySelector('.performance-indicator');
        expect(performanceIndicator).toBeInTheDocument();
      });

      // Should show FPS indicator with poor performance class
      const fpsIndicator = document.querySelector('.fps-indicator.poor');
      expect(fpsIndicator).toBeInTheDocument();
    });

    it('should trigger optimization when performance is poor', async () => {
      const { useMobilePerformance } = await import('@/hooks/useMobilePerformance');
      const mockStartOptimization = jest.fn();
      
      (useMobilePerformance as any).mockReturnValue({
        isOptimizing: true,
        isOptimized: false,
        metrics: null,
        recommendations: [],
        warnings: [],
        startOptimization: mockStartOptimization,
        stopOptimization: jest.fn(),
        isMobileDevice: true,
        shouldOptimize: true,
      });

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
            optimizationStrategy="aggressive"
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Should show optimization overlay
      await waitFor(() => {
        expect(screen.getByText('Optimizing for mobile...')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle game loading errors gracefully', async () => {
      const mockOnGameError = jest.fn();

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="broken-game"
            gameConfig={mockGameConfig}
            onGameError={mockOnGameError}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Simulate game error
      const error = new Error('Game failed to load');
      act(() => {
        mockOnGameError(error);
      });

      expect(mockOnGameError).toHaveBeenCalledWith(error);
    });

    it('should show error overlay for critical failures', async () => {
      render(
        <TestWrapper>
          <div data-testid="error-overlay" className="error-overlay">
            <h3>Game Error</h3>
            <p>Failed to load game assets</p>
            <button>Reload Game</button>
          </div>
        </TestWrapper>
      );

      expect(screen.getByTestId('error-overlay')).toBeInTheDocument();
      expect(screen.getByText('Game Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load game assets')).toBeInTheDocument();
      expect(screen.getByText('Reload Game')).toBeInTheDocument();
    });

    it('should handle service worker errors', async () => {
      const { registerServiceWorker } = await import('@/lib/pwa');
      
      // Mock service worker registration failure
      (registerServiceWorker as any).mockRejectedValue(new Error('SW registration failed'));

      // Should not crash the app
      await expect(registerServiceWorker()).rejects.toThrow('SW registration failed');
    });
  });

  describe('Analytics Integration', () => {
    it('should track PWA and mobile events', async () => {
      const { useMobileAnalytics } = await import('@/hooks/useMobileAnalytics');
      const mockTrackEvent = jest.fn();

      (useMobileAnalytics as any).mockReturnValue({
        trackEvent: mockTrackEvent,
        trackError: jest.fn(),
        startPerformanceSession: jest.fn(),
        endPerformanceSession: jest.fn(),
        measureTouchLatency: jest.fn(),
        markRenderStart: jest.fn(),
        markRenderEnd: jest.fn(),
        currentSession: null,
      });

      render(
        <TestWrapper>
          <MobileGameWrapper
            gameId="memdot"
            gameConfig={mockGameConfig}
          >
            <div>Game Content</div>
          </MobileGameWrapper>
        </TestWrapper>
      );

      // Should track game start event
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          'game_start',
          expect.objectContaining({
            gameId: 'memdot',
          })
        );
      });
    });

    it('should track installation events', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <InstallPrompt variant="button" />
        </TestWrapper>
      );

      // Simulate install prompt
      act(() => {
        window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
          detail: mockInstallPromptEvent,
        }));
      });

      const installButton = screen.getByText('Install App');
      await user.click(installButton);

      // Should track installation attempt
      expect(mockInstallPromptEvent.prompt).toHaveBeenCalled();
    });
  });

  describe('Cross-Component Integration', () => {
    it('should integrate all PWA components together', async () => {
      render(
        <TestWrapper>
          <div>
            <OfflineIndicator />
            <InstallPrompt variant="banner" showDismiss={true} />
            <MobileGameWrapper
              gameId="memdot"
              gameConfig={mockGameConfig}
            >
              <div data-testid="integrated-game">Integrated Game</div>
            </MobileGameWrapper>
          </div>
        </TestWrapper>
      );

      // All components should render without conflicts
      expect(screen.getByTestId('integrated-game')).toBeInTheDocument();

      // PWA provider should manage state across all components
      await waitFor(() => {
        // Components should be initialized
        expect(document.querySelector('.mobile-game-wrapper')).toBeInTheDocument();
      });
    });

    it('should maintain consistent state across components', async () => {
      render(
        <TestWrapper>
          <div>
            <OfflineIndicator showOnlineStatus={true} />
            <InstallPrompt variant="card" />
          </div>
        </TestWrapper>
      );

      // Both components should reflect the same online state
      expect(screen.getByText('Online')).toBeInTheDocument();

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true,
        });
        window.dispatchEvent(new Event('offline'));
      });

      // Both components should update consistently
      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across all PWA components', async () => {
      render(
        <TestWrapper>
          <div>
            <InstallPrompt variant="card" />
            <MobileGameWrapper
              gameId="memdot"
              gameConfig={mockGameConfig}
            >
              <div role="application" aria-label="Memory Dots Game">
                Game Content
              </div>
            </MobileGameWrapper>
          </div>
        </TestWrapper>
      );

      // Install prompt should be accessible
      const installButton = screen.getByRole('button', { name: /install/i });
      expect(installButton).toBeInTheDocument();

      // Game wrapper should maintain accessibility
      const gameApplication = screen.getByRole('application');
      expect(gameApplication).toHaveAttribute('aria-label', 'Memory Dots Game');

      // Touch controls should have proper labels
      const fullscreenButton = document.querySelector('[aria-label*="fullscreen"]');
      expect(fullscreenButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {

      render(
        <TestWrapper>
          <InstallPrompt variant="card" showDismiss={true} />
        </TestWrapper>
      );

      // Should be able to navigate with keyboard
      const installButton = screen.getByText('Install Now');
      const laterButton = screen.getByText('Maybe Later');
      
      expect(installButton).toBeInTheDocument();
      expect(laterButton).toBeInTheDocument();

      // Simulate keyboard activation
      installButton.click();
      expect(mockInstallPromptEvent.prompt).toHaveBeenCalled();
    });
  });
});