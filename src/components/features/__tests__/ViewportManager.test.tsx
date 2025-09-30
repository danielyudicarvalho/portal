import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViewportManager, ViewportConfigs } from '../ViewportManager';
import { getOrientationManager } from '@/lib/orientation-manager';

// Mock the orientation manager
jest.mock('@/lib/orientation-manager', () => ({
  getOrientationManager: jest.fn()
}));

const mockOrientationManager = {
  setViewportConfig: jest.fn(),
  resetViewport: jest.fn(),
  lockOrientation: jest.fn(),
  unlockOrientation: jest.fn()
};

describe('ViewportManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOrientationManager as jest.Mock).mockReturnValue(mockOrientationManager);
  });

  it('should render children when provided', () => {
    render(
      <ViewportManager>
        <div data-testid="child-content">Test Content</div>
      </ViewportManager>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render nothing when no children provided', () => {
    const { container } = render(<ViewportManager />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply viewport configuration', () => {
    const config = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    render(<ViewportManager config={config} />);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(config);
  });

  it('should lock orientation when specified in config', () => {
    const config = {
      scaleMode: 'fit' as const,
      lockOrientation: 'landscape' as const
    };

    render(<ViewportManager config={config} />);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(config);
    expect(mockOrientationManager.lockOrientation).toHaveBeenCalledWith('landscape');
  });

  it('should not apply configuration when config is not provided', () => {
    render(<ViewportManager />);

    expect(mockOrientationManager.setViewportConfig).not.toHaveBeenCalled();
    expect(mockOrientationManager.lockOrientation).not.toHaveBeenCalled();
  });

  it('should clean up on unmount', () => {
    const config = {
      scaleMode: 'fit' as const,
      lockOrientation: 'portrait' as const
    };

    const { unmount } = render(<ViewportManager config={config} />);

    unmount();

    expect(mockOrientationManager.resetViewport).toHaveBeenCalled();
    expect(mockOrientationManager.unlockOrientation).toHaveBeenCalled();
  });

  it('should not unlock orientation if not locked', () => {
    const config = {
      scaleMode: 'fit' as const
    };

    const { unmount } = render(<ViewportManager config={config} />);

    unmount();

    expect(mockOrientationManager.resetViewport).toHaveBeenCalled();
    expect(mockOrientationManager.unlockOrientation).not.toHaveBeenCalled();
  });

  it('should handle gameId prop', () => {
    const config = {
      scaleMode: 'fit' as const
    };

    render(<ViewportManager config={config} gameId="test-game" />);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(config);
  });

  it('should update configuration when config changes', () => {
    const initialConfig = {
      scaleMode: 'fit' as const,
      width: 800,
      height: 600
    };

    const { rerender } = render(<ViewportManager config={initialConfig} />);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(initialConfig);

    const newConfig = {
      scaleMode: 'fill' as const,
      width: 1024,
      height: 768
    };

    rerender(<ViewportManager config={newConfig} />);

    expect(mockOrientationManager.setViewportConfig).toHaveBeenCalledWith(newConfig);
  });
});

describe('ViewportConfigs', () => {
  beforeEach(() => {
    // Mock window for fullscreen config
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
  });

  it('should have mobile configuration', () => {
    expect(ViewportConfigs.mobile).toEqual({
      scaleMode: 'fit',
      minWidth: 320,
      minHeight: 480
    });
  });

  it('should have landscape configuration', () => {
    expect(ViewportConfigs.landscape).toEqual({
      scaleMode: 'fit',
      lockOrientation: 'landscape',
      minWidth: 480,
      minHeight: 320
    });
  });

  it('should have portrait configuration', () => {
    expect(ViewportConfigs.portrait).toEqual({
      scaleMode: 'fit',
      lockOrientation: 'portrait',
      minWidth: 320,
      minHeight: 480
    });
  });

  it('should have fullscreen configuration', () => {
    const config = ViewportConfigs.fullscreen;
    expect(config.scaleMode).toBe('fill');
    expect(typeof config.width).toBe('number');
    expect(typeof config.height).toBe('number');
    expect(config.width).toBeGreaterThan(0);
    expect(config.height).toBeGreaterThan(0);
  });

  it('should have fixed aspect ratio configuration', () => {
    expect(ViewportConfigs.fixedAspect).toEqual({
      scaleMode: 'fit',
      width: 800,
      height: 600
    });
  });

  it('should handle undefined window in fullscreen config', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    // Re-import to get fresh config
    jest.resetModules();
    const { ViewportConfigs: NewViewportConfigs } = await import('../ViewportManager');

    expect(NewViewportConfigs.fullscreen).toEqual({
      scaleMode: 'fill',
      width: 375,
      height: 667
    });

    global.window = originalWindow;
  });
});