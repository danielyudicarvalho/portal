import { renderHook, act } from '@testing-library/react'
import { usePWAOfflineState } from '../usePWAOfflineState'
import { usePWA } from '@/components/providers/PWAProvider'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the PWAProvider hook
jest.mock('@/components/providers/PWAProvider', () => ({
  usePWA: jest.fn(),
}))

const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>

// Mock navigator.connection
const mockConnection = {
  effectiveType: '4g',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

Object.defineProperty(navigator, 'connection', {
  value: mockConnection,
  writable: true,
})

describe('usePWAOfflineState', () => {
  const mockUpdateOfflineGamesCount = jest.fn()
  const mockUpdateUserPreferences = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockConnection.effectiveType = '4g'
    
    mockUsePWA.mockReturnValue({
      isOnline: true,
      offlineGamesCount: 3,
      lastOfflineSync: '2023-01-01T00:00:00.000Z',
      userPreferences: {
        autoInstallPrompt: true,
        offlineNotifications: true,
      },
      serviceWorkerStatus: {
        isRegistered: true,
        isControlling: true,
        isWaiting: false,
      },
      updateOfflineGamesCount: mockUpdateOfflineGamesCount,
      updateUserPreferences: mockUpdateUserPreferences,
      // Other PWA context properties
      isInstalled: false,
      isInstallable: false,
      installPromptEvent: null,
      installationDate: null,
      promptInstall: jest.fn(),
      clearPWAData: jest.fn(),
    })
  })

  it('returns correct offline status', () => {
    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.offlineStatus).toEqual({
      isOnline: true,
      hasOfflineGames: true,
      hasServiceWorker: true,
      offlineCapability: 'full',
      lastSync: new Date('2023-01-01T00:00:00.000Z'),
      timeSinceLastSync: expect.any(Number),
      connectionType: '4g',
      isSlowConnection: false,
    })
  })

  it('detects slow connection', () => {
    mockConnection.effectiveType = '2g'
    
    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.offlineStatus.isSlowConnection).toBe(true)
    expect(result.current.offlineStatus.connectionType).toBe('2g')
  })

  it('determines partial offline capability', () => {
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      offlineGamesCount: 0,
    })

    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.offlineStatus.offlineCapability).toBe('partial')
    expect(result.current.offlineStatus.hasOfflineGames).toBe(false)
  })

  it('determines no offline capability', () => {
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      offlineGamesCount: 0,
      serviceWorkerStatus: {
        isRegistered: false,
        isControlling: false,
        isWaiting: false,
      },
    })

    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.offlineStatus.offlineCapability).toBe('none')
  })

  it('provides network advice for offline state', () => {
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isOnline: false,
      offlineGamesCount: 2,
    })

    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.networkAdvice).toEqual({
      type: 'offline',
      message: "You're offline, but 2 games are available to play",
      action: 'browse-offline-games',
    })
  })

  it('provides network advice for offline state with no cached games', () => {
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isOnline: false,
      offlineGamesCount: 0,
    })

    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.networkAdvice).toEqual({
      type: 'offline',
      message: "You're offline and no games are cached for offline play",
      action: 'wait-for-connection',
    })
  })

  it('provides network advice for slow connection', () => {
    mockConnection.effectiveType = 'slow-2g'

    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.networkAdvice).toEqual({
      type: 'slow',
      message: 'Slow connection detected. Consider caching games for offline play',
      action: 'cache-games',
    })
  })

  it('provides network advice for good connection', () => {
    const { result } = renderHook(() => usePWAOfflineState())

    expect(result.current.networkAdvice).toEqual({
      type: 'good',
      message: 'Good connection - all features available',
      action: null,
    })
  })

  it('refreshes offline data successfully', async () => {
    mockUpdateOfflineGamesCount.mockResolvedValue(undefined)
    const { result } = renderHook(() => usePWAOfflineState())

    let refreshResult: boolean | undefined
    await act(async () => {
      refreshResult = await result.current.refreshOfflineData()
    })

    expect(refreshResult).toBe(true)
    expect(mockUpdateOfflineGamesCount).toHaveBeenCalled()
  })

  it('handles refresh offline data failure', async () => {
    mockUpdateOfflineGamesCount.mockRejectedValue(new Error('Refresh failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => usePWAOfflineState())

    let refreshResult: boolean | undefined
    await act(async () => {
      refreshResult = await result.current.refreshOfflineData()
    })

    expect(refreshResult).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh offline data:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('toggles offline notifications preference', () => {
    const { result } = renderHook(() => usePWAOfflineState())

    act(() => {
      result.current.toggleOfflineNotifications(false)
    })

    expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ offlineNotifications: false })
  })


})