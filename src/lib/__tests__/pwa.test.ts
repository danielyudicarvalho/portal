import { isPWAInstalled, isPWAInstallable } from '../pwa'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(display-mode: standalone)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    standalone: false,
  },
})

describe('PWA utilities', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    ;(window as any).deferredPrompt = undefined
  })

  describe('isPWAInstalled', () => {
    it('returns true when display-mode is standalone', () => {
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      expect(isPWAInstalled()).toBe(true)
    })

    it('returns true when navigator.standalone is true', () => {
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
      
      ;(window.navigator as any).standalone = true

      expect(isPWAInstalled()).toBe(true)
    })

    it('returns false when not installed', () => {
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
      
      ;(window.navigator as any).standalone = false

      expect(isPWAInstalled()).toBe(false)
    })
  })

  describe('isPWAInstallable', () => {
    it('returns true when deferredPrompt is available', () => {
      ;(window as any).deferredPrompt = {}
      expect(isPWAInstallable()).toBe(true)
    })

    it('returns false when deferredPrompt is not available', () => {
      ;(window as any).deferredPrompt = undefined
      expect(isPWAInstallable()).toBe(false)
    })
  })
})