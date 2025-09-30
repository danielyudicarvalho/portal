import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameCompatibilityChecker } from '../GameCompatibilityChecker';
import { GameCompatibilityInfo } from '@/lib/mobile-game-compatibility';

// Mock the compatibility checker
jest.mock('@/lib/mobile-game-compatibility', () => ({
  mobileGameCompatibilityChecker: {
    checkCompatibility: jest.fn()
  }
}));

const mockCompatibilityInfo: GameCompatibilityInfo = {
  gameId: 'test-game',
  isCompatible: true,
  compatibilityScore: 85,
  issues: [
    {
      type: 'controls',
      severity: 'medium',
      description: 'Game requires keyboard input but device uses touch',
      solution: 'Use touch control adaptation'
    }
  ],
  adaptations: [
    {
      type: 'controls',
      description: 'Convert keyboard controls to touch controls',
      applied: false,
      config: { touchControls: true }
    }
  ],
  fallbacks: [
    {
      type: 'alternative_controls',
      description: 'Use touch controls instead of keyboard/mouse',
      enabled: false,
      config: { touchControls: true }
    }
  ]
};

const mockIncompatibleInfo: GameCompatibilityInfo = {
  gameId: 'incompatible-game',
  isCompatible: false,
  compatibilityScore: 35,
  issues: [
    {
      type: 'performance',
      severity: 'critical',
      description: 'Device does not meet minimum requirements',
      solution: 'Use a more powerful device'
    },
    {
      type: 'features',
      severity: 'high',
      description: 'WebGL not supported',
      solution: 'Use canvas fallback'
    }
  ],
  adaptations: [],
  fallbacks: [
    {
      type: 'simplified_mode',
      description: 'Use canvas rendering instead of WebGL',
      enabled: false,
      config: { renderer: 'canvas' }
    }
  ]
};

import { mobileGameCompatibilityChecker } from '@/lib/mobile-game-compatibility';

describe('GameCompatibilityChecker', () => {
  const mockCheckCompatibility = mobileGameCompatibilityChecker.checkCompatibility;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockCheckCompatibility.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<GameCompatibilityChecker gameId="test-game" />);
    
    expect(screen.getByText('Checking compatibility...')).toBeInTheDocument();
  });

  it('renders compatible game information', async () => {
    mockCheckCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    render(<GameCompatibilityChecker gameId="test-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Compatible')).toBeInTheDocument();
      expect(screen.getByText('Excellent (85%)')).toBeInTheDocument();
    });
  });

  it('renders incompatible game information', async () => {
    mockCheckCompatibility.mockResolvedValue(mockIncompatibleInfo);
    
    render(<GameCompatibilityChecker gameId="incompatible-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Not Compatible')).toBeInTheDocument();
      expect(screen.getByText('Poor (35%)')).toBeInTheDocument();
    });
  });

  it('shows details panel when requested', async () => {
    mockCheckCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    render(<GameCompatibilityChecker gameId="test-game" showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Compatibility Issues')).toBeInTheDocument();
      expect(screen.getByText('Available Adaptations')).toBeInTheDocument();
      expect(screen.getByText('Fallback Options')).toBeInTheDocument();
    });
  });

  it('toggles details panel when show details button is clicked', async () => {
    mockCheckCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    render(<GameCompatibilityChecker gameId="test-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show Details'));
    
    expect(screen.getByText('Compatibility Issues')).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Details'));
    
    expect(screen.queryByText('Compatibility Issues')).not.toBeInTheDocument();
  });

  it('calls onCompatibilityCheck callback when provided', async () => {
    const mockCallback = jest.fn();
    mockCheckCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    render(
      <GameCompatibilityChecker 
        gameId="test-game" 
        onCompatibilityCheck={mockCallback}
      />
    );
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockCompatibilityInfo);
    });
  });

  it('displays issue severity correctly', async () => {
    mockCheckCompatibility.mockResolvedValue(mockIncompatibleInfo);
    
    render(<GameCompatibilityChecker gameId="incompatible-game" showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });

  it('shows adaptation status correctly', async () => {
    const adaptedInfo = {
      ...mockCompatibilityInfo,
      adaptations: [
        {
          ...mockCompatibilityInfo.adaptations[0],
          applied: true
        }
      ]
    };
    
    mockCheckCompatibility.mockResolvedValue(adaptedInfo);
    
    render(<GameCompatibilityChecker gameId="test-game" showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Applied')).toBeInTheDocument();
    });
  });

  it('shows fallback status correctly', async () => {
    const fallbackEnabledInfo = {
      ...mockCompatibilityInfo,
      fallbacks: [
        {
          ...mockCompatibilityInfo.fallbacks[0],
          enabled: true
        }
      ]
    };
    
    mockCheckCompatibility.mockResolvedValue(fallbackEnabledInfo);
    
    render(<GameCompatibilityChecker gameId="test-game" showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });
  });

  it('handles compatibility check errors gracefully', async () => {
    mockCheckCompatibility.mockRejectedValue(new Error('Network error'));
    
    render(<GameCompatibilityChecker gameId="test-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to check compatibility')).toBeInTheDocument();
    });
  });

  it('updates when gameId changes', async () => {
    mockCheckCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { rerender } = render(<GameCompatibilityChecker gameId="game1" />);
    
    await waitFor(() => {
      expect(mockCheckCompatibility).toHaveBeenCalledWith('game1');
    });

    mockCheckCompatibility.mockClear();
    rerender(<GameCompatibilityChecker gameId="game2" />);
    
    await waitFor(() => {
      expect(mockCheckCompatibility).toHaveBeenCalledWith('game2');
    });
  });

  it('displays correct compatibility colors', async () => {
    const excellentInfo = { ...mockCompatibilityInfo, compatibilityScore: 90 };
    const goodInfo = { ...mockCompatibilityInfo, compatibilityScore: 70 };
    const poorInfo = { ...mockCompatibilityInfo, compatibilityScore: 30, isCompatible: false };

    // Test excellent score
    mockCheckCompatibility.mockResolvedValue(excellentInfo);
    const { rerender } = render(<GameCompatibilityChecker gameId="excellent-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Excellent (90%)')).toHaveClass('text-green-600');
    });

    // Test good score
    mockCheckCompatibility.mockResolvedValue(goodInfo);
    rerender(<GameCompatibilityChecker gameId="good-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Good (70%)')).toHaveClass('text-yellow-600');
    });

    // Test poor score
    mockCheckCompatibility.mockResolvedValue(poorInfo);
    rerender(<GameCompatibilityChecker gameId="poor-game" />);
    
    await waitFor(() => {
      expect(screen.getByText('Poor (30%)')).toHaveClass('text-red-600');
    });
  });
});