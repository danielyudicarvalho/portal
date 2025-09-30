import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import OfflineGamesList from '../OfflineGamesList'
// import { getGameCacheManager } from '@/lib/game-cache-manager'
import { useNetworkStatus } from '@/lib/network-status'

// Mock dependencies
jest.mock('@/lib/game-cache-manager')
jest.mock('@/lib/network-status')

const mockGameCacheManager = gameCacheManager as jest.Mocked<typeof gameCacheManager>
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>

describe('OfflineGamesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default network status mock
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
    })
  })

  it('should render loading state initially', () => {
    mockGameCacheManager.getOfflineGames.mockImplementation(() => new Promise(() => {}))
    
    render(<OfflineGamesList />)
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display offline games when available', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['box-jump', 'boom-dots'])
    
    render(<OfflineGamesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Offline Games (2)')).toBeInTheDocument()
      expect(screen.getByText('Box Jump')).toBeInTheDocument()
      expect(screen.getByText('Boom Dots')).toBeInTheDocument()
    })
  })

  it('should show empty state when no games are cached', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])
    
    render(<OfflineGamesList />)
    
    await waitFor(() => {
      expect(screen.getByText('No games cached for offline play')).toBeInTheDocument()
      expect(screen.getByText('Play games while online to cache them automatically')).toBeInTheDocument()
    })
  })

  it('should show offline indicator when offline', async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
    })
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])
    
    render(<OfflineGamesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Offline Mode')).toBeInTheDocument()
      expect(screen.getByText('Connect to the internet to cache games for offline play')).toBeInTheDocument()
    })
  })

  it('should call onGameSelect when play button is clicked', async () => {
    const mockOnGameSelect = jest.fn()
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['box-jump'])
    
    render(<OfflineGamesList onGameSelect={mockOnGameSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Box Jump')).toBeInTheDocument()
    })
    
    const playButton = screen.getByText('Play')
    fireEvent.click(playButton)
    
    expect(mockOnGameSelect).toHaveBeenCalledWith('box-jump')
  })

  it('should show cache actions when enabled', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['box-jump'])
    
    render(<OfflineGamesList showCacheActions={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
      expect(screen.getByText('Cache More Games')).toBeInTheDocument()
    })
  })

  it('should handle cache game action', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])
    mockGameCacheManager.cacheGameAssets.mockResolvedValue()
    
    render(<OfflineGamesList showCacheActions={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Cache More Games')).toBeInTheDocument()
    })
    
    const cacheButton = screen.getAllByText('Cache')[0]
    fireEvent.click(cacheButton)
    
    expect(mockGameCacheManager.cacheGameAssets).toHaveBeenCalled()
  })

  it('should handle remove cache action', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['box-jump'])
    mockGameCacheManager.clearGameCache.mockResolvedValue()
    
    render(<OfflineGamesList showCacheActions={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })
    
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)
    
    expect(mockGameCacheManager.clearGameCache).toHaveBeenCalledWith('box-jump')
  })

  it('should disable cache actions when offline', async () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
    })
    mockGameCacheManager.getOfflineGames.mockResolvedValue([])
    
    render(<OfflineGamesList showCacheActions={true} />)
    
    await waitFor(() => {
      expect(screen.queryByText('Cache More Games')).not.toBeInTheDocument()
    })
  })

  it('should show loading state for cache actions', async () => {
    mockGameCacheManager.getOfflineGames.mockResolvedValue(['box-jump'])
    mockGameCacheManager.clearGameCache.mockImplementation(() => new Promise(() => {}))
    
    render(<OfflineGamesList showCacheActions={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })
    
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Removing...')).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    mockGameCacheManager.getOfflineGames.mockRejectedValue(new Error('Cache error'))
    
    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<OfflineGamesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Offline Games (0)')).toBeInTheDocument()
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load offline games:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})