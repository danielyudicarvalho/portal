/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useOfflineGames } from '../useOfflineGames'

// Mock the dependencies
jest.mock('@/lib/game-cache-manager', () => ({
  gameCacheManager: {
    getOfflineGames: jest.fn(),
    cacheGameAssets: jest.fn(),
    clearGameCache: jest.fn(),
  },
}))

jest.mock('@/lib/network-status', () => ({
  useNetworkStatus: jest.fn(),
}))

import { gameCacheManager } from '@/lib/game-cache-manager'
import { useNetworkStatus } from '@/lib/network-status'
const mockGameCacheManager = gameCacheManager as jest.Mocked<typeof gameCacheManager>
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>

describe('useOfflineGames', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      connectionType: 'wifi',
      effectiveType: '4g',
    })
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])
  })

  it('should initialize with empty offline games list', async () => {
    const { result } = renderHook(() => useOfflineGames())

    expect(result.current.offlineGames).toEqual([])
    expect(result.current.isCaching).toBe(false)
    expect(result.current.cachingGame).toBeNull()
    expect(result.current.isOnline).toBe(true)
  })

  it('should load offline games on mount', async () => {
    const mockOfflineGames = ['game1', 'game2']
    mockGameCacheManager.getOfflineGames.mockResolvedValue(mockOfflineGames)

    const { result } = renderHook(() => useOfflineGames())

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.offlineGames).toEqual(mockOfflineGames)
    expect(mockGameCacheManager.getOfflineGames).toHaveBeenCalled()
  })

  it('should check if game is offline', async () => {
    const mockOfflineGames = ['game1', 'game2']
    mockGameCacheManager.getOfflineGames.mockResolvedValue(mockOfflineGames)

    const { result } = renderHook(() => useOfflineGames())

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isGameOffline('game1')).toBe(true)
    expect(result.current.isGameOffline('game3')).toBe(false)
  })

  it('should cache game when online', async () => {
    mockGameCacheManager.cacheGameAssets.mockResolvedValue(undefined)
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['test-game'])

    const { result } = renderHook(() => useOfflineGames())

    await act(async () => {
      await result.current.cacheGame('test-game')
    })

    expect(mockGameCacheManager.cacheGameAssets).toHaveBeenCalledWith('test-game')
    expect(mockGameCacheManager.getOfflineGames).toHaveBeenCalled()
  })

  it('should not cache game when offline', async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      connectionType: 'none',
      effectiveType: 'slow-2g',
    })

    const { result } = renderHook(() => useOfflineGames())

    await act(async () => {
      await result.current.cacheGame('test-game')
    })

    expect(mockGameCacheManager.cacheGameAssets).not.toHaveBeenCalled()
  })

  it('should clear game cache', async () => {
    mockGameCacheManager.clearGameCache.mockResolvedValue(undefined)
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])

    const { result } = renderHook(() => useOfflineGames())

    await act(async () => {
      await result.current.clearGameCache('test-game')
    })

    expect(mockGameCacheManager.clearGameCache).toHaveBeenCalledWith('test-game')
    expect(mockGameCacheManager.getOfflineGames).toHaveBeenCalled()
  })

  it('should refresh offline games', async () => {
    const mockOfflineGames = ['game1', 'game2']
    mockGameCacheManager.getOfflineGames.mockResolvedValue(mockOfflineGames)

    const { result } = renderHook(() => useOfflineGames())

    await act(async () => {
      await result.current.refreshOfflineGames()
    })

    expect(result.current.offlineGames).toEqual(mockOfflineGames)
    expect(mockGameCacheManager.getOfflineGames).toHaveBeenCalled()
  })

  it('should handle caching state correctly', async () => {
    let resolveCache: () => void
    const cachePromise = new Promise<void>((resolve) => {
      resolveCache = resolve
    })
    mockGameCacheManager.cacheGameAssets.mockReturnValue(cachePromise)

    const { result } = renderHook(() => useOfflineGames())

    // Start caching
    act(() => {
      result.current.cacheGame('test-game')
    })

    expect(result.current.isCaching).toBe(true)
    expect(result.current.cachingGame).toBe('test-game')

    // Complete caching
    await act(async () => {
      resolveCache!()
      await cachePromise
    })

    expect(result.current.isCaching).toBe(false)
    expect(result.current.cachingGame).toBeNull()
  })
})