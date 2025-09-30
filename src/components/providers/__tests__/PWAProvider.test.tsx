import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PWAProvider, usePWA } from '../PWAProvider'

// Mock the PWA library
jest.mock('@/lib/pwa', () => ({
  getServiceWorkerStatus: jest.fn().mockResolvedValue({
    isRegistered: true,
    isControlling: true,
    isWaiting: false,
  }),
}))

// Mock the game cache manager
jest.mock('@/lib/game-cache-manager', () => ({
  gameCacheManager: {
    getOfflineGames: jest.fn().mockResolvedValue(['game1', 'game2']),
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock window.matchMedia
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
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Test component that uses the PWA hook
function TestComponent() {
  const pwa = usePWA()
  
  return (
    <div>
      <div data-testid="installed">{pwa.isInstalled ? 'installed' : 'not-installed'}</div>
      <div data-testid="installable">{pwa.isInstallable ? 'installable' : 'not-installable'}</div>
      <div data-testid="online">{pwa.isOnline ? 'online' : 'offline'}</div>
      <div data-testid="offline-games">{pwa.offlineGamesCount}</div>
      <div data-testid="installation-date">{pwa.installationDate || 'null'}</div>
      <div data-testid="auto-install">{pwa.userPreferences.autoInstallPrompt.toString()}</div>
      <button 
        onClick={() => pwa.updateUserPreferences({ autoInstallPrompt: false })} 
        data-testid="disable-auto-install"
      >
        Disable Auto Install
      </button>
      <button onClick={pwa.clearPWAData} data-testid="clear-data">
        Clear Data
      </button>
    </div>
  )
}

describe('PWAProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('provides PWA state to children', async () => {
    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    expect(screen.getByTestId('installed')).toHaveTextContent('not-installed')
    expect(screen.getByTestId('installable')).toHaveTextContent('not-installable')
    expect(screen.getByTestId('online')).toHaveTextContent('online')
    expect(screen.getByTestId('installation-date')).toHaveTextContent('null')
    expect(screen.getByTestId('auto-install')).toHaveTextContent('true')

    await waitFor(() => {
      expect(screen.getByTestId('offline-games')).toHaveTextContent('2')
    })
  })

  it('loads state from localStorage on initialization', () => {
    const storedState = {
      installationDate: '2023-01-01T00:00:00.000Z',
      lastOfflineSync: '2023-01-02T00:00:00.000Z',
      userPreferences: {
        autoInstallPrompt: false,
        offlineNotifications: false,
      },
    }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState))

    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    expect(screen.getByTestId('installation-date')).toHaveTextContent('2023-01-01T00:00:00.000Z')
    expect(screen.getByTestId('auto-install')).toHaveTextContent('false')
  })

  it('persists state changes to localStorage', async () => {
    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    fireEvent.click(screen.getByTestId('disable-auto-install'))

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pwa-state',
        expect.stringContaining('"autoInstallPrompt":false')
      )
    })
  })

  it('updates user preferences', async () => {
    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    expect(screen.getByTestId('auto-install')).toHaveTextContent('true')

    fireEvent.click(screen.getByTestId('disable-auto-install'))

    await waitFor(() => {
      expect(screen.getByTestId('auto-install')).toHaveTextContent('false')
    })
  })

  it('clears PWA data', async () => {
    const storedState = {
      installationDate: '2023-01-01T00:00:00.000Z',
      userPreferences: { autoInstallPrompt: false, offlineNotifications: false },
    }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState))

    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    expect(screen.getByTestId('installation-date')).toHaveTextContent('2023-01-01T00:00:00.000Z')

    fireEvent.click(screen.getByTestId('clear-data'))

    await waitFor(() => {
      expect(screen.getByTestId('installation-date')).toHaveTextContent('null')
      expect(screen.getByTestId('auto-install')).toHaveTextContent('true')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pwa-state')
    })
  })

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <PWAProvider>
        <TestComponent />
      </PWAProvider>
    )

    expect(screen.getByTestId('auto-install')).toHaveTextContent('true')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load PWA state from localStorage:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('usePWA must be used within a PWAProvider')
    
    consoleSpy.mockRestore()
  })
})