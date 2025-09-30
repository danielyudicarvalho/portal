import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InstallPrompt } from '../InstallPrompt'
import { usePWA } from '@/components/providers/PWAProvider'

// Mock the PWA provider
jest.mock('@/components/providers/PWAProvider', () => ({
  usePWA: jest.fn(),
}))

const mockUsePWA = usePWA as jest.MockedFunction<typeof usePWA>

describe('InstallPrompt', () => {
  const mockPromptInstall = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: mockPromptInstall,
      installPromptEvent: null,
      isOnline: true,
      serviceWorkerStatus: {
        isRegistered: true,
        isControlling: true,
        isWaiting: false,
      },
      offlineGamesCount: 0,
      updateOfflineGamesCount: jest.fn(),
    })
  })

  describe('Button variant', () => {
    it('renders install button when installable and not installed', () => {
      render(<InstallPrompt variant="button" />)
      
      expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument()
      expect(screen.getByText('Install App')).toBeInTheDocument()
    })

    it('does not render when already installed', () => {
      mockUsePWA.mockReturnValue({
        ...mockUsePWA(),
        isInstalled: true,
      })

      const { container } = render(<InstallPrompt variant="button" />)
      expect(container.firstChild).toBeNull()
    })

    it('does not render when not installable', () => {
      mockUsePWA.mockReturnValue({
        ...mockUsePWA(),
        isInstallable: false,
      })

      const { container } = render(<InstallPrompt variant="button" />)
      expect(container.firstChild).toBeNull()
    })

    it('calls promptInstall when clicked', async () => {
      mockPromptInstall.mockResolvedValue(undefined)
      
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      fireEvent.click(button)
      
      expect(mockPromptInstall).toHaveBeenCalledTimes(1)
    })

    it('shows loading state during installation', async () => {
      mockPromptInstall.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      fireEvent.click(button)
      
      expect(screen.getByText('Installing...')).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('shows success state after successful installation', async () => {
      mockPromptInstall.mockResolvedValue(undefined)
      
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Installed!')).toBeInTheDocument()
      })
    })

    it('shows error state when installation fails', async () => {
      mockPromptInstall.mockRejectedValue(new Error('Installation failed'))
      
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })
  })

  describe('Banner variant', () => {
    it('renders banner with install button and description', () => {
      render(<InstallPrompt variant="banner" />)
      
      expect(screen.getByText('Install Game Portal')).toBeInTheDocument()
      expect(screen.getByText('Get the full app experience with offline access')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /install/i })).toBeInTheDocument()
    })

    it('shows dismiss button when showDismiss is true', () => {
      const onDismiss = jest.fn()
      render(<InstallPrompt variant="banner" showDismiss={true} onDismiss={onDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss install prompt/i })
      expect(dismissButton).toBeInTheDocument()
      
      fireEvent.click(dismissButton)
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('hides after dismiss button is clicked', () => {
      const { container } = render(<InstallPrompt variant="banner" showDismiss={true} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss install prompt/i })
      fireEvent.click(dismissButton)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Card variant', () => {
    it('renders card with detailed information', () => {
      render(<InstallPrompt variant="card" />)
      
      expect(screen.getByText('Install Game Portal')).toBeInTheDocument()
      expect(screen.getByText(/Install our app for the best gaming experience/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /install now/i })).toBeInTheDocument()
    })

    it('shows error message when installation fails', async () => {
      const errorMessage = 'Installation failed'
      mockPromptInstall.mockRejectedValue(new Error(errorMessage))
      
      render(<InstallPrompt variant="card" />)
      
      const button = screen.getByRole('button', { name: /install now/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('shows success message after installation', async () => {
      mockPromptInstall.mockResolvedValue(undefined)
      
      render(<InstallPrompt variant="card" />)
      
      const button = screen.getByRole('button', { name: /install now/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('App installed successfully!')).toBeInTheDocument()
      })
    })

    it('shows maybe later button when showDismiss is true', () => {
      const onDismiss = jest.fn()
      render(<InstallPrompt variant="card" showDismiss={true} onDismiss={onDismiss} />)
      
      const maybeLaterButton = screen.getByRole('button', { name: /maybe later/i })
      expect(maybeLaterButton).toBeInTheDocument()
      
      fireEvent.click(maybeLaterButton)
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      expect(button).toHaveAttribute('aria-label', 'Install app')
    })

    it('has proper ARIA labels for dismiss button', () => {
      render(<InstallPrompt variant="banner" showDismiss={true} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss install prompt/i })
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss install prompt')
    })

    it('disables button during installation', async () => {
      mockPromptInstall.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      fireEvent.click(button)
      
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:bg-gaming-accent/50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Custom styling', () => {
    it('applies custom className', () => {
      render(<InstallPrompt variant="button" className="custom-class" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      expect(button).toHaveClass('custom-class')
    })

    it('has touch-friendly tap targets', () => {
      render(<InstallPrompt variant="button" />)
      
      const button = screen.getByRole('button', { name: /install app/i })
      expect(button).toHaveClass('tap-target', 'touch-manipulation')
    })
  })
})