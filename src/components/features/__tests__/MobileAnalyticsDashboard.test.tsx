/**
 * Tests for MobileAnalyticsDashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileAnalyticsDashboard } from '../MobileAnalyticsDashboard';

// Mock the analytics hook
const mockGetAnalyticsData = jest.fn();
const mockClearAnalyticsData = jest.fn();

jest.mock('../../hooks/useMobileAnalytics', () => ({
  useMobileAnalytics: () => ({
    getAnalyticsData: mockGetAnalyticsData,
    clearAnalyticsData: mockClearAnalyticsData,
  }),
}));

const mockAnalyticsData = {
  events: [
    {
      type: 'pwa_launch',
      timestamp: Date.now() - 1000,
      data: { mode: 'standalone' },
      sessionId: 'session_123',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        screenWidth: 375,
        screenHeight: 812,
        devicePixelRatio: 2,
        orientation: 'portrait',
        isStandalone: true,
      }
    },
    {
      type: 'game_start',
      timestamp: Date.now() - 500,
      data: { gameId: 'test-game' },
      sessionId: 'session_123',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        screenWidth: 375,
        screenHeight: 812,
        devicePixelRatio: 2,
        orientation: 'portrait',
        isStandalone: true,
      }
    }
  ],
  performance: [
    {
      gameId: 'test-game',
      loadTime: 1500,
      fps: [60, 58, 59, 61],
      memoryUsage: [45, 50, 48],
      touchLatency: [15, 18, 12],
      renderTime: [16.7, 17.2, 16.1],
      timestamp: Date.now() - 300
    }
  ],
  errors: [
    {
      type: 'touch_input',
      message: 'High touch latency detected',
      gameId: 'test-game',
      timestamp: Date.now() - 200,
      sessionId: 'session_123',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        screenWidth: 375,
        screenHeight: 812,
        devicePixelRatio: 2,
        orientation: 'portrait',
        isStandalone: true,
      }
    }
  ]
};

describe('MobileAnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAnalyticsData.mockReturnValue(mockAnalyticsData);
  });

  describe('Rendering', () => {
    it('should render dashboard with header', () => {
      render(<MobileAnalyticsDashboard />);
      
      expect(screen.getByText('Mobile Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Clear Data')).toBeInTheDocument();
    });

    it('should show real-time indicator when enabled', () => {
      render(<MobileAnalyticsDashboard showRealTime={true} />);
      
      expect(screen.getByText('Real-time monitoring active')).toBeInTheDocument();
    });

    it('should not show real-time indicator when disabled', () => {
      render(<MobileAnalyticsDashboard showRealTime={false} />);
      
      expect(screen.queryByText('Real-time monitoring active')).not.toBeInTheDocument();
    });

    it('should render tabs with counts', () => {
      render(<MobileAnalyticsDashboard />);
      
      expect(screen.getByText('events (2)')).toBeInTheDocument();
      expect(screen.getByText('performance (1)')).toBeInTheDocument();
      expect(screen.getByText('errors (1)')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should start with events tab active', () => {
      render(<MobileAnalyticsDashboard />);
      
      const eventsTab = screen.getByText('events (2)');
      expect(eventsTab).toHaveClass('border-b-2', 'border-blue-500', 'text-blue-600');
    });

    it('should switch to performance tab when clicked', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('performance (1)'));
      
      const performanceTab = screen.getByText('performance (1)');
      expect(performanceTab).toHaveClass('border-b-2', 'border-blue-500', 'text-blue-600');
    });

    it('should switch to errors tab when clicked', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('errors (1)'));
      
      const errorsTab = screen.getByText('errors (1)');
      expect(errorsTab).toHaveClass('border-b-2', 'border-blue-500', 'text-blue-600');
    });
  });

  describe('Events Display', () => {
    it('should display events with correct information', () => {
      render(<MobileAnalyticsDashboard />);
      
      expect(screen.getByText('pwa_launch')).toBeInTheDocument();
      expect(screen.getByText('game_start')).toBeInTheDocument();
      
      // Check if event data is displayed
      expect(screen.getByText('"mode": "standalone"')).toBeInTheDocument();
      expect(screen.getByText('"gameId": "test-game"')).toBeInTheDocument();
    });

    it('should show session IDs', () => {
      render(<MobileAnalyticsDashboard />);
      
      expect(screen.getByText('Session: 123')).toBeInTheDocument();
    });

    it('should show empty state when no events', () => {
      mockGetAnalyticsData.mockReturnValue({
        events: [],
        performance: [],
        errors: []
      });
      
      render(<MobileAnalyticsDashboard />);
      
      expect(screen.getByText('No events recorded')).toBeInTheDocument();
    });
  });

  describe('Performance Display', () => {
    it('should display performance metrics', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('performance (1)'));
      
      expect(screen.getByText('test-game')).toBeInTheDocument();
      expect(screen.getByText('1.50s')).toBeInTheDocument(); // Load time
      expect(screen.getByText('59.5')).toBeInTheDocument(); // Avg FPS
      expect(screen.getByText('50.0MB')).toBeInTheDocument(); // Memory
      expect(screen.getByText('15.0ms')).toBeInTheDocument(); // Touch latency
    });

    it('should show N/A for missing metrics', () => {
      mockGetAnalyticsData.mockReturnValue({
        events: [],
        performance: [{
          gameId: 'test-game',
          loadTime: 1000,
          fps: [],
          memoryUsage: [],
          touchLatency: [],
          renderTime: [],
          timestamp: Date.now()
        }],
        errors: []
      });
      
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('performance (1)'));
      
      expect(screen.getAllByText('N/A')).toHaveLength(3); // FPS, Memory, Touch latency
    });

    it('should show empty state when no performance data', () => {
      mockGetAnalyticsData.mockReturnValue({
        events: [],
        performance: [],
        errors: []
      });
      
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('performance (0)'));
      
      expect(screen.getByText('No performance data recorded')).toBeInTheDocument();
    });
  });

  describe('Errors Display', () => {
    it('should display errors with correct information', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('errors (1)'));
      
      expect(screen.getByText('touch_input')).toBeInTheDocument();
      expect(screen.getByText('High touch latency detected')).toBeInTheDocument();
      expect(screen.getByText('Game: test-game')).toBeInTheDocument();
    });

    it('should show stack trace when available', () => {
      const errorWithStack = {
        ...mockAnalyticsData.errors[0],
        stack: 'Error: Test error\n    at test.js:1:1'
      };
      
      mockGetAnalyticsData.mockReturnValue({
        ...mockAnalyticsData,
        errors: [errorWithStack]
      });
      
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('errors (1)'));
      
      expect(screen.getByText('Stack trace')).toBeInTheDocument();
    });

    it('should show empty state when no errors', () => {
      mockGetAnalyticsData.mockReturnValue({
        events: [],
        performance: [],
        errors: []
      });
      
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('errors (0)'));
      
      expect(screen.getByText('No errors recorded')).toBeInTheDocument();
    });
  });

  describe('Data Management', () => {
    it('should clear data when clear button is clicked', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('Clear Data'));
      
      expect(mockClearAnalyticsData).toHaveBeenCalled();
    });

    it('should refresh data in real-time mode', async () => {
      render(<MobileAnalyticsDashboard showRealTime={true} />);
      
      // Wait for the interval to trigger
      await waitFor(() => {
        expect(mockGetAnalyticsData).toHaveBeenCalledTimes(2); // Initial + interval
      }, { timeout: 3000 });
    });

    it('should not refresh data when real-time is disabled', async () => {
      render(<MobileAnalyticsDashboard showRealTime={false} />);
      
      // Wait a bit to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetAnalyticsData).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply custom className', () => {
      const { container } = render(<MobileAnalyticsDashboard className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply correct event type colors', () => {
      render(<MobileAnalyticsDashboard />);
      
      const pwaLaunchBadge = screen.getByText('pwa_launch');
      expect(pwaLaunchBadge).toHaveClass('bg-blue-100', 'text-blue-800');
      
      const gameStartBadge = screen.getByText('game_start');
      expect(gameStartBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('should apply correct error type colors', () => {
      render(<MobileAnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('errors (1)'));
      
      const touchInputBadge = screen.getByText('touch_input');
      expect(touchInputBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tabs', () => {
      render(<MobileAnalyticsDashboard />);
      
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation', () => {
      render(<MobileAnalyticsDashboard />);
      
      const performanceTab = screen.getByText('performance (1)');
      performanceTab.focus();
      fireEvent.keyDown(performanceTab, { key: 'Enter' });
      
      expect(performanceTab).toHaveClass('border-b-2', 'border-blue-500', 'text-blue-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed analytics data gracefully', () => {
      mockGetAnalyticsData.mockReturnValue({
        events: [{ type: 'invalid' }], // Missing required fields
        performance: [{}], // Empty object
        errors: [{ message: 'Error without type' }]
      });
      
      expect(() => {
        render(<MobileAnalyticsDashboard />);
      }).not.toThrow();
    });

    it('should respect maxEvents limit', () => {
      const manyEvents = Array(100).fill(null).map((_, i) => ({
        type: 'game_start',
        timestamp: Date.now() - i * 1000,
        data: { gameId: `game-${i}` },
        sessionId: 'session_123',
        deviceInfo: mockAnalyticsData.events[0].deviceInfo
      }));
      
      mockGetAnalyticsData.mockReturnValue({
        events: manyEvents,
        performance: [],
        errors: []
      });
      
      render(<MobileAnalyticsDashboard maxEvents={10} />);
      
      // Should only show the most recent 10 events
      const eventElements = screen.getAllByText(/game-/);
      expect(eventElements.length).toBeLessThanOrEqual(10);
    });
  });
});