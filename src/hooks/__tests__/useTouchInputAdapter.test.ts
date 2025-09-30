import { renderHook, act } from '@testing-library/react';
import { useTouchInputAdapter } from '../useTouchInputAdapter';
import { TouchInputAdapter } from '../../lib/touch-input-adapter';

// Mock the TouchInputAdapter
jest.mock('../../lib/touch-input-adapter', () => ({
  TouchInputAdapter: jest.fn().mockImplementation(() => ({
    adaptKeyboardControls: jest.fn(),
    enableTouchGestures: jest.fn(),
    handleOrientationChange: jest.fn(),
    optimizeViewport: jest.fn(),
    cleanup: jest.fn()
  }))
}));

const MockedTouchInputAdapter = TouchInputAdapter as jest.MockedClass<typeof TouchInputAdapter>;

describe('useTouchInputAdapter', () => {
  const mockGameConfig = {
    width: 800,
    height: 600,
    scaleMode: 'fit' as const,
    touchControls: [{
      type: 'button' as const,
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      keyMapping: ['Space'],
      action: 'JUMP'
    }]
  };

  const mockElement = document.createElement('div');
  let mockAdapter: jest.Mocked<TouchInputAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter = {
      adaptKeyboardControls: jest.fn(),
      enableTouchGestures: jest.fn(),
      handleOrientationChange: jest.fn(),
      optimizeViewport: jest.fn(),
      cleanup: jest.fn()
    } as any;
    
    MockedTouchInputAdapter.mockImplementation(() => mockAdapter);
  });

  it('should initialize adapter when enabled', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    expect(MockedTouchInputAdapter).toHaveBeenCalledTimes(1);
    // The hook should return isEnabled as true when adapter exists and enabled is true
    expect(result.current.isEnabled).toBe(true);
  });

  it('should not initialize adapter when disabled', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: false
      })
    );

    expect(MockedTouchInputAdapter).not.toHaveBeenCalled();
    expect(result.current.isEnabled).toBe(false);
  });

  it('should adapt game element when called', () => {
    const onAdaptationComplete = jest.fn();
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true,
        onAdaptationComplete
      })
    );

    act(() => {
      result.current.adaptGameElement(mockElement);
    });

    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledWith(mockElement, mockGameConfig);
    expect(mockAdapter.enableTouchGestures).toHaveBeenCalledWith(mockElement);
    expect(onAdaptationComplete).toHaveBeenCalled();
  });

  it('should handle adaptation errors', () => {
    const onAdaptationError = jest.fn();
    const error = new Error('Adaptation failed');
    
    mockAdapter.adaptKeyboardControls.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true,
        onAdaptationError
      })
    );

    act(() => {
      result.current.adaptGameElement(mockElement);
    });

    expect(onAdaptationError).toHaveBeenCalledWith(error);
  });

  it('should not adapt when disabled', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: false
      })
    );

    act(() => {
      result.current.adaptGameElement(mockElement);
    });

    expect(mockAdapter.adaptKeyboardControls).not.toHaveBeenCalled();
    expect(mockAdapter.enableTouchGestures).not.toHaveBeenCalled();
  });

  it('should handle orientation changes', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    act(() => {
      result.current.handleOrientationChange();
    });

    expect(mockAdapter.handleOrientationChange).toHaveBeenCalled();
  });

  it('should optimize viewport', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    act(() => {
      result.current.optimizeViewport();
    });

    expect(mockAdapter.optimizeViewport).toHaveBeenCalledWith(mockGameConfig);
  });

  it('should cleanup adapter on unmount', () => {
    const { unmount } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    unmount();

    expect(mockAdapter.cleanup).toHaveBeenCalled();
  });

  it('should cleanup adapter when disabled', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled
      }),
      { initialProps: { enabled: true } }
    );

    // Disable the adapter
    rerender({ enabled: false });

    expect(mockAdapter.cleanup).toHaveBeenCalled();
  });

  it('should provide cleanup function', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    act(() => {
      result.current.cleanup();
    });

    expect(mockAdapter.cleanup).toHaveBeenCalled();
  });

  it('should update adapter when game config changes', () => {
    const newGameConfig = {
      ...mockGameConfig,
      width: 1024,
      height: 768
    };

    const { result, rerender } = renderHook(
      ({ gameConfig }) => useTouchInputAdapter({
        gameConfig,
        enabled: true
      }),
      { initialProps: { gameConfig: mockGameConfig } }
    );

    // Adapt with initial config
    act(() => {
      result.current.adaptGameElement(mockElement);
    });

    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledWith(mockElement, mockGameConfig);

    // Update config
    rerender({ gameConfig: newGameConfig });

    // Adapt again with new config
    act(() => {
      result.current.adaptGameElement(mockElement);
    });

    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledWith(mockElement, newGameConfig);
  });

  it('should handle multiple adaptation calls', () => {
    const { result } = renderHook(() =>
      useTouchInputAdapter({
        gameConfig: mockGameConfig,
        enabled: true
      })
    );

    const element1 = document.createElement('div');
    const element2 = document.createElement('canvas');

    act(() => {
      result.current.adaptGameElement(element1);
      result.current.adaptGameElement(element2);
    });

    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledTimes(2);
    expect(mockAdapter.enableTouchGestures).toHaveBeenCalledTimes(2);
    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledWith(element1, mockGameConfig);
    expect(mockAdapter.adaptKeyboardControls).toHaveBeenCalledWith(element2, mockGameConfig);
  });
});