import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineErrorHandler } from '../OfflineErrorHandler';
import { useOfflineGames } from '@/hooks/useOfflineGames';
import { usePWAOfflineState } from '@/hooks/usePWAOfflineState';

// Mock hooks
jest.mock('@/hooks/useOfflineGames');
jest.mock('@/hooks/usePWAOfflineState');

const mockUseOfflineGames = useOfflineGames as jest.MockedFunction<typeof useOfflineGames>;
const mockUsePWAOfflineState = usePWAOfflineState as jest.MockedFunction<typeof usePWAOfflineState>;

describe('OfflineErrorHandler', () => {
  const mockError = new Error('Network error');
  const mockOnRetry = jest.fn();
  const mockOnOfflineGameSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseOfflineGames.mockReturnValue({
      offlineGames: ['game1', 'game2', 'game3'],
      isGameAvailableOffline: jest.fn().mockResolvedValue(false),
      cacheGame: jest.fn(),
      clearGameCache: jest.fn(),
      getCacheSize: jest.fn(),
    });

    mockUsePWAOfflineState.mockReturnValue({
      isOnline: true,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });
  });

  it('renders connection error for online errors', () => {
    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading content.')).toBeInTheDocument();
  });

  it('renders offline error when offline', () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText("You're Offline")).toBeInTheDocument();
    expect(screen.getByText("You're offline and this content is not available offline.")).toBeInTheDocument();
  });

  it('shows retry button for online errors', () => {
    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Try Again (3 attempts left)')).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    fireEvent.click(screen.getByText('Try Again (3 attempts left)'));
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  it('decreases retry attempts on each retry', async () => {
    const { rerender } = render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    fireEvent.click(screen.getByText('Try Again (3 attempts left)'));
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalled();
    });

    rerender(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Try Again (2 attempts left)')).toBeInTheDocument();
  });

  it('shows offline games when offline', () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Available offline games:')).toBeInTheDocument();
    expect(screen.getByText('Play game1')).toBeInTheDocument();
    expect(screen.getByText('Play game2')).toBeInTheDocument();
    expect(screen.getByText('Play game3')).toBeInTheDocument();
  });

  it('handles offline game selection', () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    fireEvent.click(screen.getByText('Play game1'));
    expect(mockOnOfflineGameSelect).toHaveBeenCalledWith('game1');
  });

  it('shows limited offline games list', () => {
    mockUseOfflineGames.mockReturnValue({
      offlineGames: Array.from({ length: 10 }, (_, i) => `game${i + 1}`),
      isGameAvailableOffline: jest.fn().mockResolvedValue(false),
      cacheGame: jest.fn(),
      clearGameCache: jest.fn(),
      getCacheSize: jest.fn(),
    });

    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('+5 more games available')).toBeInTheDocument();
  });

  it('shows retry button for offline games that are available offline', async () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    const mockIsGameAvailableOffline = jest.fn().mockResolvedValue(true);
    mockUseOfflineGames.mockReturnValue({
      offlineGames: ['game1', 'game2'],
      isGameAvailableOffline: mockIsGameAvailableOffline,
      cacheGame: jest.fn(),
      clearGameCache: jest.fn(),
      getCacheSize: jest.fn(),
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        gameId="game1"
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    await waitFor(() => {
      expect(mockIsGameAvailableOffline).toHaveBeenCalledWith('game1');
    });

    expect(screen.getByText('Try Again (3 attempts left)')).toBeInTheDocument();
  });

  it('shows connection status indicator', () => {
    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows offline status when offline', () => {
    mockUsePWAOfflineState.mockReturnValue({
      isOnline: false,
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('handles back to games button', () => {
    const mockBack = jest.fn();
    Object.defineProperty(window.history, 'back', {
      value: mockBack,
      writable: true,
    });
    Object.defineProperty(window.history, 'length', {
      value: 2,
      writable: true,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    fireEvent.click(screen.getByText('Back to Games'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('handles reload page button', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window.location, 'reload', {
      value: mockReload,
      writable: true,
    });

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <OfflineErrorHandler
        error={mockError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('handles fetch errors specifically', () => {
    const fetchError = new Error('fetch failed');
    
    render(
      <OfflineErrorHandler
        error={fetchError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('Failed to load content. Please check your internet connection.')).toBeInTheDocument();
  });

  it('handles timeout errors specifically', () => {
    const timeoutError = new Error('timeout exceeded');
    
    render(
      <OfflineErrorHandler
        error={timeoutError}
        onRetry={mockOnRetry}
        onOfflineGameSelect={mockOnOfflineGameSelect}
      />
    );

    expect(screen.getByText('The request timed out. Please try again.')).toBeInTheDocument();
  });
});