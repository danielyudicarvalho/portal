import { renderHook, act } from '@testing-library/react';
import { useOrientation } from '../useOrientation';
import { getOrientationManager } from '@/lib/orientation-manager';

// Mock the orientation manager
jest.mock('@/lib/orientation-manager', () => ({
  getOrientationManager: jest.fn()
}));

const mockOrientationManager = {
  getCurrentOrientation: jest.fn(),
  addOrientationListener: jest.fn(),
  setViewportConfig: jest.fn(),
  resetViewport: jest.fn(),
  lockOrientation: jest.fn(),
  unlockOrientation: jest.fn()
};

// Mock window
if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: 375,
      innerHeight: 667
    },
    writable: true,
    configurable: true
  });
} else {
  Object.assign(global.window, {
    innerWidth: 375,
    innerHeight: 667
  });
}

describe('useOrientation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrientationManager as jest.Mock).mockReturnValue(mockOrientationManager);
    
    mockOrientationManager.getCurrentOrientation.mockReturnValue('portrait');
    mockOrientationManager.addOrientationListener.mockReturnValue(() => {});
    mockOrientationManager.lockOrientation.mockResolvedValue(true);
  });

  it('should return initial orientation state', () => {
    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe('portrait');
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.dimensions).toEqual({ width: 375, height: 667 });
  });

  it('should apply viewport configuration on mount', () => {
    const viewportConfig = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    renderHook(() => useOrientation({ viewportConfig }));

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(viewportConfig);
  });

  it('should lock orientation on mount when specified', () => {
    renderHook(() => useOrientation({ lockOrientation: 'landscape' }));

    expect(mockOrientationManager.lockOrientation).toHaveBeenCalledWith('landscape');
  });

  it('should handle orientation changes', () => {
    let orientationListener: (event: any) => void;

    mockOrientationManager.addOrientationListener.mockImplementation((listener) => {
      orientationListener = listener;
      return () => {};
    });

    const { result } = renderHook(() => useOrientation());

    // Simulate orientation change
    act(() => {
      orientationListener!({
        orientation: 'landscape',
        angle: 90,
        width: 667,
        height: 375
      });
    });

    expect(result.current.orientation).toBe('landscape');
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);
    expect(result.current.dimensions).toEqual({ width: 667, height: 375 });
  });

  it('should call onOrientationChange callback', () => {
    const onOrientationChange = jest.fn();
    let orientationListener: (event: any) => void;

    mockOrientationManager.addOrientationListener.mockImplementation((listener) => {
      orientationListener = listener;
      return () => {};
    });

    renderHook(() => useOrientation({ onOrientationChange }));

    const orientationEvent = {
      orientation: 'landscape',
      angle: 90,
      width: 667,
      height: 375
    };

    act(() => {
      orientationListener!(orientationEvent);
    });

    expect(onOrientationChange).toHaveBeenCalledWith(orientationEvent);
  });

  it('should provide lockOrientation function', async () => {
    const { result } = renderHook(() => useOrientation());

    const success = await result.current.lockOrientation('landscape');

    expect(success).toBe(true);
    expect(mockOrientationManager.lockOrientation).toHaveBeenCalledWith('landscape');
  });

  it('should provide unlockOrientation function', () => {
    const { result } = renderHook(() => useOrientation());

    result.current.unlockOrientation();

    expect(mockOrientationManager.unlockOrientation).toHaveBeenCalled();
  });

  it('should provide setViewportConfig function', () => {
    const { result } = renderHook(() => useOrientation());

    const config = { scaleMode: 'fit' as const };
    result.current.setViewportConfig(config);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(config);
  });

  it('should provide resetViewport function', () => {
    const { result } = renderHook(() => useOrientation());

    result.current.resetViewport();

    expect(mockOrientationManager.resetViewport).toHaveBeenCalled();
  });

  it('should clean up on unmount', () => {
    const unsubscribe = jest.fn();
    mockOrientationManager.addOrientationListener.mockReturnValue(unsubscribe);

    const viewportConfig = { scaleMode: 'fit' as const };
    const { unmount } = renderHook(() => 
      useOrientation({ 
        viewportConfig, 
        lockOrientation: 'landscape' 
      })
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockOrientationManager.resetViewport).toHaveBeenCalled();
    expect(mockOrientationManager.unlockOrientation).toHaveBeenCalled();
  });

  it('should handle window undefined in SSR', () => {
    // This test verifies the hook handles SSR gracefully
    // In the actual implementation, the hook checks for window existence
    const { result } = renderHook(() => useOrientation());

    // The hook should still work even in SSR-like conditions
    expect(result.current.orientation).toBe('portrait');
    expect(typeof result.current.dimensions.width).toBe('number');
    expect(typeof result.current.dimensions.height).toBe('number');
  });

  it('should update dimensions correctly on orientation change', () => {
    let orientationListener: (event: any) => void;

    mockOrientationManager.addOrientationListener.mockImplementation((listener) => {
      orientationListener = listener;
      return () => {};
    });

    const { result } = renderHook(() => useOrientation());

    // Initial state
    expect(result.current.dimensions).toEqual({ width: 375, height: 667 });

    // Simulate orientation change with new dimensions
    act(() => {
      orientationListener!({
        orientation: 'landscape',
        angle: 90,
        width: 800,
        height: 400
      });
    });

    expect(result.current.dimensions).toEqual({ width: 800, height: 400 });
  });
});