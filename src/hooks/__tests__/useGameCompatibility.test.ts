import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameCompatibility, useDeviceCapabilities, useGameAdaptation } from '../useGameCompatibility';
import { GameCompatibilityInfo } from '@/lib/mobile-game-compatibility';

// Mock the compatibility checker
jest.mock('@/lib/mobile-game-compatibility', () => ({
  mobileGameCompatibilityChecker: {
    checkCompatibility: jest.fn(),
    adaptGame: jest.fn(),
    isFeatureSupported: jest.fn(),
    getFallbackOptions: jest.fn(),
    getDeviceOptimizations: jest.fn()
  }
}));

const mockCompatibilityInfo: GameCompatibilityInfo = {
  gameId: 'test-game',
  isCompatible: true,
  compatibilityScore: 85,
  issues: [],
  adaptations: [
    {
      type: 'controls',
      description: 'Convert keyboard controls to touch controls',
      applied: false,
      config: { touchControls: true }
    }
  ],
  fallbacks: []
};

const mockGameConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fit' as const,
  touchControls: [],
  preferredOrientation: 'portrait' as const,
  minScreenSize: { width: 320, height: 480 }
};

describe('useGameCompatibility', () => {
  const mockChecker = require('@/lib/mobile-game-compatibility').mobileGameCompatibilityChecker;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null compatibility info', () => {
    const { result } = renderHook(() => useGameCompatibility());
    
    expect(result.current.compatibilityInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should check compatibility for initial game ID', async () => {
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameCompatibility('test-game'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.compatibilityInfo).toEqual(mockCompatibilityInfo);
      expect(mockChecker.checkCompatibility).toHaveBeenCalledWith('test-game');
    });
  });

  it('should handle compatibility check errors', async () => {
    const error = new Error('Network error');
    mockChecker.checkCompatibility.mockRejectedValue(error);
    
    const { result } = renderHook(() => useGameCompatibility('test-game'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.compatibilityInfo).toBeNull();
    });
  });

  it('should check compatibility manually', async () => {
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameCompatibility());
    
    await act(async () => {
      await result.current.checkCompatibility('manual-game');
    });
    
    expect(result.current.compatibilityInfo).toEqual(mockCompatibilityInfo);
    expect(mockChecker.checkCompatibility).toHaveBeenCalledWith('manual-game');
  });

  it('should adapt game successfully', async () => {
    mockChecker.adaptGame.mockResolvedValue(mockGameConfig);
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameCompatibility());
    const mockElement = document.createElement('div');
    
    let adaptResult: any;
    await act(async () => {
      adaptResult = await result.current.adaptGame('test-game', mockElement);
    });
    
    expect(adaptResult).toEqual(mockGameConfig);
    expect(mockChecker.adaptGame).toHaveBeenCalledWith('test-game', mockElement);
    expect(mockChecker.checkCompatibility).toHaveBeenCalledWith('test-game');
  });

  it('should handle game adaptation errors', async () => {
    const error = new Error('Adaptation failed');
    mockChecker.adaptGame.mockRejectedValue(error);
    
    const { result } = renderHook(() => useGameCompatibility());
    const mockElement = document.createElement('div');
    
    let adaptResult: any;
    await act(async () => {
      adaptResult = await result.current.adaptGame('test-game', mockElement);
    });
    
    expect(adaptResult).toBeNull();
    expect(result.current.error).toBe('Adaptation failed');
  });

  it('should check feature support', () => {
    mockChecker.isFeatureSupported.mockReturnValue(true);
    
    const { result } = renderHook(() => useGameCompatibility());
    
    const isSupported = result.current.isFeatureSupported('webgl');
    
    expect(isSupported).toBe(true);
    expect(mockChecker.isFeatureSupported).toHaveBeenCalledWith('webgl');
  });

  it('should get fallback options', () => {
    const mockFallbacks = [
      {
        type: 'alternative_controls',
        description: 'Use touch controls',
        enabled: false,
        config: {}
      }
    ];
    mockChecker.getFallbackOptions.mockReturnValue(mockFallbacks);
    
    const { result } = renderHook(() => useGameCompatibility());
    
    const fallbacks = result.current.getFallbackOptions('test-game');
    
    expect(fallbacks).toEqual(mockFallbacks);
    expect(mockChecker.getFallbackOptions).toHaveBeenCalledWith('test-game');
  });

  it('should get device optimizations', () => {
    const mockOptimizations = { ios: { disableZoom: true } };
    mockChecker.getDeviceOptimizations.mockReturnValue(mockOptimizations);
    
    const { result } = renderHook(() => useGameCompatibility());
    
    const optimizations = result.current.getDeviceOptimizations('test-game');
    
    expect(optimizations).toEqual(mockOptimizations);
    expect(mockChecker.getDeviceOptimizations).toHaveBeenCalledWith('test-game');
  });
});

describe('useDeviceCapabilities', () => {
  const mockChecker = require('@/lib/mobile-game-compatibility').mobileGameCompatibilityChecker;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return device capabilities', async () => {
    mockChecker.isFeatureSupported
      .mockReturnValueOnce(true)  // webgl
      .mockReturnValueOnce(true)  // audio
      .mockReturnValueOnce(false) // gamepad
      .mockReturnValueOnce(true)  // fullscreen
      .mockReturnValueOnce(false) // orientation_lock
      .mockReturnValueOnce(true)  // vibration
      .mockReturnValueOnce(true)  // touch
      .mockReturnValueOnce(false); // accelerometer
    
    const { result } = renderHook(() => useDeviceCapabilities());
    
    await waitFor(() => {
      expect(result.current).toEqual({
        webgl: true,
        audio: true,
        gamepad: false,
        fullscreen: true,
        orientationLock: false,
        vibration: true,
        touch: true,
        accelerometer: false
      });
    });
  });
});

describe('useGameAdaptation', () => {
  const mockChecker = require('@/lib/mobile-game-compatibility').mobileGameCompatibilityChecker;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameAdaptation('test-game'));
    
    expect(result.current.isAdapted).toBe(false);
    expect(result.current.adaptationConfig).toBeNull();
    expect(result.current.adaptationError).toBeNull();
  });

  it('should apply adaptations successfully', async () => {
    mockChecker.adaptGame.mockResolvedValue(mockGameConfig);
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameAdaptation('test-game'));
    const mockElement = document.createElement('div');
    
    await act(async () => {
      await result.current.applyAdaptations(mockElement);
    });
    
    await waitFor(() => {
      expect(result.current.isAdapted).toBe(true);
      expect(result.current.adaptationConfig).toEqual(mockGameConfig);
      expect(result.current.adaptationError).toBeNull();
    });
  });

  it('should handle adaptation errors', async () => {
    const error = new Error('Adaptation failed');
    mockChecker.adaptGame.mockRejectedValue(error);
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameAdaptation('test-game'));
    const mockElement = document.createElement('div');
    
    await act(async () => {
      await result.current.applyAdaptations(mockElement);
    });
    
    await waitFor(() => {
      expect(result.current.isAdapted).toBe(false);
      expect(result.current.adaptationError).toBe('Adaptation failed');
    });
  });

  it('should reset adaptation state', async () => {
    mockChecker.adaptGame.mockResolvedValue(mockGameConfig);
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameAdaptation('test-game'));
    const mockElement = document.createElement('div');
    
    // Apply adaptations first
    await act(async () => {
      await result.current.applyAdaptations(mockElement);
    });
    
    await waitFor(() => {
      expect(result.current.isAdapted).toBe(true);
    });
    
    // Reset adaptations
    act(() => {
      result.current.resetAdaptation();
    });
    
    expect(result.current.isAdapted).toBe(false);
    expect(result.current.adaptationConfig).toBeNull();
    expect(result.current.adaptationError).toBeNull();
  });

  it('should provide compatibility info', async () => {
    mockChecker.checkCompatibility.mockResolvedValue(mockCompatibilityInfo);
    
    const { result } = renderHook(() => useGameAdaptation('test-game'));
    
    await waitFor(() => {
      expect(result.current.compatibilityInfo).toEqual(mockCompatibilityInfo);
    });
  });
});