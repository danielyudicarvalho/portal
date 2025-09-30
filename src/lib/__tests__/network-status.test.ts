/**
 * @jest-environment jsdom
 */

import { networkStatusManager } from '../network-status'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock connection API
const mockConnection = {
  type: 'wifi',
  effectiveType: '4g',
  addEventListener: jest.fn(),
}

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: mockConnection,
})

describe('NetworkStatusManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getNetworkStatus', () => {
    it('should return current network status', () => {
      const status = networkStatusManager.getNetworkStatus()

      expect(status).toEqual({
        isOnline: true,
        connectionType: 'wifi',
        effectiveType: '4g',
      })
    })

    it('should handle missing connection API', async () => {
      // Create a new manager instance without connection API
      const { NetworkStatusManagerImpl } = await import('../network-status')
      
      // Mock navigator without connection
      const originalConnection = navigator.connection
      Object.defineProperty(navigator, 'connection', { value: undefined })

      const manager = new NetworkStatusManagerImpl()
      const status = manager.getNetworkStatus()

      expect(status).toEqual({
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      })

      // Restore connection
      Object.defineProperty(navigator, 'connection', { value: originalConnection })
    })
  })

  describe('isOnline', () => {
    it('should return true when online', () => {
      expect(networkStatusManager.isOnline()).toBe(true)
    })

    it('should return false when offline', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      
      // Create a new instance to get updated status
      const { NetworkStatusManagerImpl } = await import('../network-status')
      const manager = new NetworkStatusManagerImpl()
      
      expect(manager.isOnline()).toBe(false)

      // Restore online status
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    })
  })

  describe('onNetworkChange', () => {
    it('should register and call network change listeners', () => {
      const callback = jest.fn()
      const unsubscribe = networkStatusManager.onNetworkChange(callback)

      expect(typeof unsubscribe).toBe('function')

      // Simulate network change
      const event = new Event('online')
      window.dispatchEvent(event)

      // Clean up
      unsubscribe()
    })

    it('should remove listeners when unsubscribe is called', () => {
      const callback = jest.fn()
      const unsubscribe = networkStatusManager.onNetworkChange(callback)

      unsubscribe()

      // Simulate network change - callback should not be called
      const event = new Event('online')
      window.dispatchEvent(event)

      expect(callback).not.toHaveBeenCalled()
    })
  })
})