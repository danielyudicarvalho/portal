import { TouchInputAdapter, GameConfig } from '../touch-input-adapter';

// Mock DOM methods
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockDispatchEvent = jest.fn();
const mockAppendChild = jest.fn();
const mockRemove = jest.fn();
const mockQuerySelector = jest.fn();
const mockGetBoundingClientRect = jest.fn();

// Mock HTMLElement
const mockElement = {
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  dispatchEvent: mockDispatchEvent,
  appendChild: mockAppendChild,
  style: {},
  querySelector: mockQuerySelector,
  getBoundingClientRect: mockGetBoundingClientRect
} as unknown as HTMLElement;

// Mock document methods
const mockDocumentCreateElement = jest.fn(() => ({
  id: '',
  className: '',
  style: { cssText: '' },
  textContent: '',
  innerHTML: '',
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  remove: mockRemove,
  querySelector: mockQuerySelector,
  getBoundingClientRect: mockGetBoundingClientRect
}));

const mockDocumentGetElementById = jest.fn(() => ({
  ...mockElement,
  remove: mockRemove
}));

const mockDocumentQuerySelector = jest.fn(() => null);

Object.defineProperty(document, 'createElement', {
  value: mockDocumentCreateElement,
  writable: true
});

Object.defineProperty(document, 'getElementById', {
  value: mockDocumentGetElementById,
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: mockDocumentQuerySelector,
  writable: true
});

Object.defineProperty(document, 'head', {
  value: { appendChild: mockAppendChild },
  writable: true
});

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
Object.defineProperty(window, 'addEventListener', { value: jest.fn() });
Object.defineProperty(window, 'removeEventListener', { value: jest.fn() });

describe('TouchInputAdapter', () => {
  let adapter: TouchInputAdapter;
  let gameConfig: GameConfig;

  beforeEach(() => {
    adapter = new TouchInputAdapter();
    gameConfig = {
      width: 800,
      height: 600,
      scaleMode: 'fit',
      touchControls: [
        {
          type: 'button',
          position: { x: 100, y: 100 },
          size: { width: 80, height: 80 },
          keyMapping: ['Space'],
          action: 'JUMP'
        },
        {
          type: 'joystick',
          position: { x: 50, y: 500 },
          size: { width: 100, height: 100 },
          keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        }
      ]
    };

    // Clear all mocks
    jest.clearAllMocks();
    mockDocumentCreateElement.mockClear();
    mockDocumentGetElementById.mockClear();
    mockDocumentQuerySelector.mockClear();
  });

  afterEach(() => {
    adapter.cleanup();
  });

  describe('adaptKeyboardControls', () => {
    it('should create touch controls based on game configuration', () => {
      adapter.adaptKeyboardControls(mockElement, gameConfig);

      // Should create elements for each touch control
      expect(mockDocumentCreateElement).toHaveBeenCalledTimes(2);
      expect(mockAppendChild).toHaveBeenCalledTimes(2);
    });

    it('should set up viewport optimization', () => {
      adapter.adaptKeyboardControls(mockElement, gameConfig);

      // Should update element styles for viewport
      expect(mockElement.style).toHaveProperty('cssText');
    });

    it('should clear existing controls before creating new ones', () => {
      // Add some controls first
      adapter.adaptKeyboardControls(mockElement, gameConfig);
      
      // Clear mocks and add controls again
      jest.clearAllMocks();
      adapter.adaptKeyboardControls(mockElement, gameConfig);

      // Should still create the same number of controls
      expect(mockDocumentCreateElement).toHaveBeenCalledTimes(2);
    });
  });

  describe('enableTouchGestures', () => {
    it('should add touch event listeners to game element', () => {
      adapter.enableTouchGestures(mockElement);

      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
    });

    it('should set touch-action and user-select styles', () => {
      adapter.enableTouchGestures(mockElement);

      expect(mockElement.style.touchAction).toBe('none');
      expect(mockElement.style.userSelect).toBe('none');
    });

    it('should remove existing listeners before adding new ones', () => {
      adapter.enableTouchGestures(mockElement);
      
      // Clear mocks and enable gestures again
      jest.clearAllMocks();
      adapter.enableTouchGestures(mockElement);

      // Should remove listeners first
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(4);
      // Then add new ones
      expect(mockAddEventListener).toHaveBeenCalledTimes(4);
    });
  });

  describe('handleOrientationChange', () => {
    beforeEach(() => {
      adapter.adaptKeyboardControls(mockElement, gameConfig);
    });

    it('should update viewport after orientation change', (done) => {
      adapter.handleOrientationChange();

      // Should update after timeout
      setTimeout(() => {
        expect(mockElement.style).toHaveProperty('cssText');
        done();
      }, 150);
    });

    it('should reposition touch controls', (done) => {
      adapter.handleOrientationChange();

      setTimeout(() => {
        // Should update control positions
        expect(mockDocumentGetElementById).toHaveBeenCalled();
        done();
      }, 150);
    });
  });

  describe('optimizeViewport', () => {
    it('should calculate optimal viewport for fit scale mode', () => {
      const config = { ...gameConfig, scaleMode: 'fit' as const };
      adapter.optimizeViewport(config);

      expect(mockElement.style).toHaveProperty('cssText');
    });

    it('should calculate optimal viewport for fill scale mode', () => {
      const config = { ...gameConfig, scaleMode: 'fill' as const };
      adapter.optimizeViewport(config);

      expect(mockElement.style).toHaveProperty('cssText');
    });

    it('should calculate optimal viewport for stretch scale mode', () => {
      const config = { ...gameConfig, scaleMode: 'stretch' as const };
      adapter.optimizeViewport(config);

      expect(mockElement.style).toHaveProperty('cssText');
    });

    it('should add orientation change listeners', () => {
      adapter.optimizeViewport(gameConfig);

      expect(window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('touch event handling', () => {
    beforeEach(() => {
      adapter.enableTouchGestures(mockElement);
    });

    it('should handle touch start events', () => {
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ identifier: 1 } as Touch],
        changedTouches: [{ identifier: 1 } as Touch]
      });

      // Get the touch start handler
      const touchStartHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];

      expect(touchStartHandler).toBeDefined();
      
      // Should not throw when called
      expect(() => touchStartHandler(touchEvent)).not.toThrow();
    });

    it('should handle touch move events', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ identifier: 1 } as Touch],
        changedTouches: [{ identifier: 1 } as Touch]
      });

      const touchMoveHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];

      expect(touchMoveHandler).toBeDefined();
      expect(() => touchMoveHandler(touchEvent)).not.toThrow();
    });

    it('should handle touch end events', () => {
      const touchEvent = new TouchEvent('touchend', {
        changedTouches: [{ identifier: 1 } as Touch]
      });

      const touchEndHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      expect(touchEndHandler).toBeDefined();
      expect(() => touchEndHandler(touchEvent)).not.toThrow();
    });
  });

  describe('control type handling', () => {
    it('should create button controls with proper event handlers', () => {
      const buttonConfig = {
        ...gameConfig,
        touchControls: [{
          type: 'button' as const,
          position: { x: 100, y: 100 },
          size: { width: 80, height: 80 },
          keyMapping: ['Space'],
          action: 'JUMP'
        }]
      };

      adapter.adaptKeyboardControls(mockElement, buttonConfig);

      // Should create button element
      expect(mockDocumentCreateElement).toHaveBeenCalled();
    });

    it('should create joystick controls with drag handling', () => {
      const joystickConfig = {
        ...gameConfig,
        touchControls: [{
          type: 'joystick' as const,
          position: { x: 50, y: 500 },
          size: { width: 100, height: 100 },
          keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        }]
      };

      adapter.adaptKeyboardControls(mockElement, joystickConfig);

      // Should create joystick element with knob
      expect(mockDocumentCreateElement).toHaveBeenCalled();
    });

    it('should create swipe controls with gesture detection', () => {
      const swipeConfig = {
        ...gameConfig,
        touchControls: [{
          type: 'swipe' as const,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        }]
      };

      adapter.adaptKeyboardControls(mockElement, swipeConfig);

      expect(mockDocumentCreateElement).toHaveBeenCalled();
    });

    it('should create tap controls with simple touch handling', () => {
      const tapConfig = {
        ...gameConfig,
        touchControls: [{
          type: 'tap' as const,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          keyMapping: ['Space'],
          action: 'TAP'
        }]
      };

      adapter.adaptKeyboardControls(mockElement, tapConfig);

      expect(mockDocumentCreateElement).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners', () => {
      adapter.enableTouchGestures(mockElement);
      adapter.optimizeViewport(gameConfig);
      
      adapter.cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledTimes(4); // Touch events
      expect(window.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should clear all touch controls', () => {
      adapter.adaptKeyboardControls(mockElement, gameConfig);
      
      adapter.cleanup();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('should reset internal state', () => {
      adapter.adaptKeyboardControls(mockElement, gameConfig);
      adapter.cleanup();

      // Should be able to adapt again without issues
      expect(() => adapter.adaptKeyboardControls(mockElement, gameConfig)).not.toThrow();
    });
  });

  describe('viewport meta tag management', () => {
    it('should create viewport meta tag if it does not exist', () => {
      // Mock querySelector to return null (no existing viewport tag)
      mockDocumentQuerySelector.mockReturnValue(null);

      adapter.optimizeViewport(gameConfig);

      expect(mockDocumentCreateElement).toHaveBeenCalledWith('meta');
    });

    it('should update existing viewport meta tag', () => {
      const mockViewportTag = { content: '' };
      mockDocumentQuerySelector.mockReturnValue(mockViewportTag);

      adapter.optimizeViewport(gameConfig);

      expect(mockViewportTag.content).toContain('width=device-width');
    });
  });
});