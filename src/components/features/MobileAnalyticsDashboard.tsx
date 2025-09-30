/**
 * Mobile Analytics Dashboard Component
 * Displays analytics data for debugging and monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useMobileAnalytics } from '../../hooks/useMobileAnalytics';
import type { MobileAnalyticsEvent, MobileError, PerformanceMetrics } from '../../lib/mobile-analytics';

interface MobileAnalyticsDashboardProps {
  className?: string;
  showRealTime?: boolean;
  maxEvents?: number;
}

export function MobileAnalyticsDashboard({ 
  className = '',
  showRealTime = true,
  maxEvents = 50 
}: MobileAnalyticsDashboardProps) {
  const { getAnalyticsData, clearAnalyticsData } = useMobileAnalytics();
  const [analyticsData, setAnalyticsData] = useState<{
    events: MobileAnalyticsEvent[];
    performance: PerformanceMetrics[];
    errors: MobileError[];
  }>({ events: [], performance: [], errors: [] });
  const [activeTab, setActiveTab] = useState<'events' | 'performance' | 'errors'>('events');

  // Refresh data periodically if real-time is enabled
  useEffect(() => {
    const refreshData = () => {
      setAnalyticsData(getAnalyticsData());
    };

    refreshData(); // Initial load

    if (showRealTime) {
      const interval = setInterval(refreshData, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [getAnalyticsData, showRealTime]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pwa_install: 'bg-green-100 text-green-800',
      pwa_launch: 'bg-blue-100 text-blue-800',
      game_start: 'bg-purple-100 text-purple-800',
      game_end: 'bg-orange-100 text-orange-800',
      orientation_change: 'bg-yellow-100 text-yellow-800',
      offline_mode: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getErrorTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      touch_input: 'bg-red-100 text-red-800',
      game_load: 'bg-orange-100 text-orange-800',
      orientation: 'bg-yellow-100 text-yellow-800',
      performance: 'bg-purple-100 text-purple-800',
      network: 'bg-blue-100 text-blue-800',
      pwa: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const renderEvents = () => {
    const recentEvents = analyticsData.events.slice(-maxEvents).reverse();
    
    return (
      <div className="space-y-2">
        {recentEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events recorded</p>
        ) : (
          recentEvents.map((event, index) => (
            <div key={index} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              
              {Object.keys(event.data).length > 0 && (
                <div className="text-sm text-gray-600">
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2">
                Session: {event.sessionId.split('_').pop()}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderPerformance = () => {
    const recentMetrics = analyticsData.performance.slice(-maxEvents).reverse();
    
    return (
      <div className="space-y-2">
        {recentMetrics.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No performance data recorded</p>
        ) : (
          recentMetrics.map((metrics, index) => (
            <div key={index} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{metrics.gameId}</span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(metrics.timestamp)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Load Time:</span>
                  <span className="ml-2 font-medium">{formatDuration(metrics.loadTime)}</span>
                </div>
                
                <div>
                  <span className="text-gray-600">Avg FPS:</span>
                  <span className="ml-2 font-medium">
                    {metrics.fps.length > 0 
                      ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-600">Memory:</span>
                  <span className="ml-2 font-medium">
                    {metrics.memoryUsage.length > 0 
                      ? `${Math.max(...metrics.memoryUsage).toFixed(1)}MB`
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-600">Touch Latency:</span>
                  <span className="ml-2 font-medium">
                    {metrics.touchLatency.length > 0 
                      ? `${(metrics.touchLatency.reduce((a, b) => a + b, 0) / metrics.touchLatency.length).toFixed(1)}ms`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderErrors = () => {
    const recentErrors = analyticsData.errors.slice(-maxEvents).reverse();
    
    return (
      <div className="space-y-2">
        {recentErrors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No errors recorded</p>
        ) : (
          recentErrors.map((error, index) => (
            <div key={index} className="bg-white border border-red-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getErrorTypeColor(error.type)}`}>
                  {error.type}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(error.timestamp)}
                </span>
              </div>
              
              <div className="text-sm text-red-800 mb-2">
                {error.message}
              </div>
              
              {error.gameId && (
                <div className="text-xs text-gray-600 mb-2">
                  Game: {error.gameId}
                </div>
              )}
              
              {error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    Stack trace
                  </summary>
                  <pre className="bg-gray-50 p-2 rounded mt-2 overflow-x-auto text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'events': return analyticsData.events.length;
      case 'performance': return analyticsData.performance.length;
      case 'errors': return analyticsData.errors.length;
      default: return 0;
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Mobile Analytics Dashboard
          </h3>
          <button
            onClick={clearAnalyticsData}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Clear Data
          </button>
        </div>
        
        {showRealTime && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Real-time monitoring active
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['events', 'performance', 'errors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab} ({getTabCount(tab)})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'errors' && renderErrors()}
      </div>
    </div>
  );
}

export default MobileAnalyticsDashboard;