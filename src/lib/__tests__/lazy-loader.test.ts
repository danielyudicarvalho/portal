/**
 * Tests for lazy loader functionality
 */

import { lazyLoader } from '../lazy-loader';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      appendChild: jest.fn(),
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      style: {},
      innerHTML: '',
      onload: null,
      onerror: null
    };
    return element;
  })
});

describe('LazyLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerComponent', () => {
    it('should register a component for lazy loading', () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-lazy-id', 'test-component');
    });

    it('should add loading placeholder to element', () => {
      const mockElement = document.createElement('div') as any;
      mockElement.querySelector = jest.fn().mockReturnValue(null);
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);

      expect(mockElement.appendChild).toHaveBeenCalled();
    });
  });

  describe('loadComponent', () => {
    it('should load a registered component', async () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);
      await lazyLoader.loadComponent('test-component');

      expect(mockLoader).toHaveBeenCalled();
    });

    it('should not load the same component twice', async () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);
      await lazyLoader.loadComponent('test-component');
      await lazyLoader.loadComponent('test-component');

      expect(mockLoader).toHaveBeenCalledTimes(1);
    });

    it('should handle loading errors gracefully', async () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockRejectedValue(new Error('Load failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);
      await lazyLoader.loadComponent('test-component');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getComponentStatus', () => {
    it('should return component status', () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);
      const status = lazyLoader.getComponentStatus('test-component');

      expect(status).toEqual({
        loaded: false,
        loading: false
      });
    });

    it('should return null for non-existent component', () => {
      const status = lazyLoader.getComponentStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('unregisterComponent', () => {
    it('should unregister a component', () => {
      const mockElement = document.createElement('div') as any;
      const mockLoader = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('test-component', mockElement, mockLoader);
      lazyLoader.unregisterComponent('test-component');

      const status = lazyLoader.getComponentStatus('test-component');
      expect(status).toBeNull();
    });
  });

  describe('loadAllComponents', () => {
    it('should load all registered components', async () => {
      const mockElement1 = document.createElement('div') as any;
      const mockElement2 = document.createElement('div') as any;
      const mockLoader1 = jest.fn().mockResolvedValue(undefined);
      const mockLoader2 = jest.fn().mockResolvedValue(undefined);

      lazyLoader.registerComponent('component-1', mockElement1, mockLoader1);
      lazyLoader.registerComponent('component-2', mockElement2, mockLoader2);

      await lazyLoader.loadAllComponents();

      expect(mockLoader1).toHaveBeenCalled();
      expect(mockLoader2).toHaveBeenCalled();
    });
  });
});