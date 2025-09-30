import { renderHook, act } from '@testing-library/react'
import { usePWAInstallation } from '../usePWAInstallation'
import { usePWA } from '@/components/providers/PWAProvider'

// Mock the PWAProvider hook
jest.mock('@/components/providers/PWAProvider', () => ({
  usePWA: jest.fn(),
}))

const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>

describe('usePWAInstallation', () => {
  const mockPromptInstall = jest.fn()
  const mockUpdateUserPreferences = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePWA.mockReturnValue({
      isInstalled: false,
      isInstallable: true,
      installPromptEvent: { prompt: jest.fn() } as any,
      installationDate: null,
      userPreferences: {
        autoInstallPrompt: true,
        offlineNotifications: true,
      },
      promptInstall: mockPromptInstall,
      updateUserPreferences: mockUpdateUserPreferences,
      // Other PWA context properties
      isOnline: true,
      serviceWorkerStatus: { isRegistered: true, isControlling: true, isWaiting: false },
      offlineGamesCount: 0,
      lastOfflineSync: null,
      updateOfflineGamesCount: jest.fn(),
      clearPWAData: jest.fn(),
    })
  })

  it('returns correct installation state', () => {
    const { result } = renderHook(() => usePWAInstallation())

    expect(result.current.isInstalled).toBe(false)
    expect(result.current.isInstallable).toBe(true)
    expect(result.current.canPromptInstall).toBe(true)
    expect(result.current.autoInstallPrompt).toBe(true)
    expect(result.current.installationInfo).toBeNull()
  })

  it('handles successful installation', async () => {
    mockPromptInstall.mockResolvedValue(undefined)
    const { result } = renderHook(() => usePWAInstallation())

    let installResult: boolean | undefined
    await act(async () => {
      installResult = await result.current.install()
    })

    expect(installResult).toBe(true)
    expect(mockPromptInstall).toHaveBeenCalled()
  })

  it('handles failed installation', async () => {
    mockPromptInstall.mockRejectedValue(new Error('Installation failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => usePWAInstallation())

    let installResult: boolean | undefined
    await act(async () => {
      installResult = await result.current.install()
    })

    expect(installResult).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to install PWA:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('throws error when not installable', async () => {
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isInstallable: false,
      installPromptEvent: null,
    })

    const { result } = renderHook(() => usePWAInstallation())

    await expect(result.current.install()).rejects.toThrow(
      'PWA is not installable at this time'
    )
  })

  it('toggles auto install prompt preference', () => {
    const { result } = renderHook(() => usePWAInstallation())

    act(() => {
      result.current.toggleAutoInstallPrompt(false)
    })

    expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ autoInstallPrompt: false })
  })

  it('returns installation info when installed', () => {
    const installDate = '2023-01-01T00:00:00.000Z'
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isInstalled: true,
      installationDate: installDate,
    })

    const { result } = renderHook(() => usePWAInstallation())

    expect(result.current.installationInfo).toEqual({
      installDate: new Date(installDate),
      daysSinceInstall: expect.any(Number),
      isNewInstallation: expect.any(Boolean),
    })
  })

  it('identifies new installations', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isInstalled: true,
      installationDate: recentDate,
    })

    const { result } = renderHook(() => usePWAInstallation())

    expect(result.current.installationInfo?.isNewInstallation).toBe(true)
  })

  it('identifies old installations', () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
    mockUsePWA.mockReturnValue({
      ...mockUsePWA(),
      isInstalled: true,
      installationDate: oldDate,
    })

    const { result } = renderHook(() => usePWAInstallation())

    expect(result.current.installationInfo?.isNewInstallation).toBe(false)
    expect(result.current.installationInfo?.daysSinceInstall).toBe(7)
  })
})