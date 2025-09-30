/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { OfflineIndicator } from '../OfflineIndicator'

// Mock the network status hook
jest.mock('@/lib/network-status', () => ({
  useNetworkStatus: jest.fn(),
}))

import { useNetworkStatus } from '@/lib/network-status'
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when online and showOnlineStatus is false', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    const { container } = render(<OfflineIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('should render online status when showOnlineStatus is true', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    render(<OfflineIndicator showOnlineStatus={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('should render offline status when offline', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      connectionType: 'none',
      effectiveType: 'slow-2g',
    })

    render(<OfflineIndicator />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('- Limited functionality')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      connectionType: 'none',
      effectiveType: 'slow-2g',
    })

    const { container } = render(<OfflineIndicator className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should have proper accessibility attributes', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      connectionType: 'none',
      effectiveType: 'slow-2g',
    })

    render(<OfflineIndicator />)
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
  })

  it('should show green indicator when online', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    render(<OfflineIndicator showOnlineStatus={true} />)
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('bg-green-500')
  })

  it('should show red indicator when offline', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      connectionType: 'none',
      effectiveType: 'slow-2g',
    })

    render(<OfflineIndicator />)
    const indicator = screen.getByRole('status')
    expect(indicator).toHaveClass('bg-red-500')
  })
})