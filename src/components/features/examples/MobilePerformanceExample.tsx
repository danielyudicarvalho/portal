/**
 * Example component demonstrating mobile performance optimization
 */

'use client';

import React, { useState } from 'react';
import { useMobilePerformance } from '../../../hooks/useMobilePerformance';

export function MobilePerformanceExample() {
  const [gameId, setGameId] = useState('example-game');
  const [strategy, setStrategy] = useState<'aggressive' | 'conservative' | 'adaptive'>('adaptive');

  const {
    isOptimizing,
    isOptimized,
    metrics,
    preloadProgress,
    recommendations,
    warnings,
    startOptimization,
    stopOptimization,
    isMobileDevice,
    getNetworkInfo,
    getDeviceCapabilities,
    shouldOptimize
  } = useMobilePerformance({
    gameId,
    strategy,
    enablePreloading: true,
    enableMonitoring: true,
    enableImageOptimization: true
  });

  const networkInfo = getNetworkInfo();
  const deviceCapabilities = getDeviceCapabilities();

  return (
    <div className="mobile-performance-example">
      <h2>Mobile Performance Optimization Example</h2>
      
      {/* Configuration */}
      <div className="config-section">
        <h3>Configuration</h3>
        <div className="form-group">
          <label htmlFor="gameId">Game ID:</label>
          <input
            id="gameId"
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            disabled={isOptimizing}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="strategy">Optimization Strategy:</label>
          <select
            id="strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            disabled={isOptimizing}
          >
            <option value="aggressive">Aggressive</option>
            <option value="conservative">Conservative</option>
            <option value="adaptive">Adaptive</option>
          </select>
        </div>
      </div>

      {/* Device Information */}
      <div className="device-info">
        <h3>Device Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Is Mobile:</strong> {isMobileDevice() ? 'Yes' : 'No'}
          </div>
          <div className="info-item">
            <strong>Should Optimize:</strong> {shouldOptimize ? 'Yes' : 'No'}
          </div>
          <div className="info-item">
            <strong>Memory:</strong> {deviceCapabilities.memory || 'Unknown'} GB
          </div>
          <div className="info-item">
            <strong>CPU Cores:</strong> {deviceCapabilities.cores || 'Unknown'}
          </div>
          <div className="info-item">
            <strong>Pixel Ratio:</strong> {deviceCapabilities.pixelRatio}
          </div>
          <div className="info-item">
            <strong>Screen Size:</strong> {deviceCapabilities.screenSize.width}x{deviceCapabilities.screenSize.height}
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="network-info">
        <h3>Network Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Connection Type:</strong> {networkInfo.effectiveType}
          </div>
          <div className="info-item">
            <strong>Downlink:</strong> {networkInfo.downlink} Mbps
          </div>
          <div className="info-item">
            <strong>RTT:</strong> {networkInfo.rtt} ms
          </div>
          <div className="info-item">
            <strong>Save Data:</strong> {networkInfo.saveData ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={startOptimization}
          disabled={isOptimizing || isOptimized}
          className="btn btn-primary"
        >
          {isOptimizing ? 'Optimizing...' : 'Start Optimization'}
        </button>
        
        <button
          onClick={stopOptimization}
          disabled={!isOptimized}
          className="btn btn-secondary"
        >
          Stop Optimization
        </button>
      </div>

      {/* Preload Progress */}
      {preloadProgress && (
        <div className="preload-progress">
          <h3>Preload Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${preloadProgress.percentage}%` }}
            />
          </div>
          <div className="progress-info">
            <span>{preloadProgress.loaded}/{preloadProgress.total} assets loaded</span>
            <span>{preloadProgress.percentage}%</span>
          </div>
          {preloadProgress.currentAsset && (
            <div className="current-asset">
              Loading: {preloadProgress.currentAsset}
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="performance-metrics">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <strong>Load Time:</strong> {Math.round(metrics.gameLoadTime)}ms
            </div>
            <div className="metric-item">
              <strong>First Render:</strong> {Math.round(metrics.firstRenderTime)}ms
            </div>
            <div className="metric-item">
              <strong>Average FPS:</strong> 
              <span className={metrics.averageFPS >= 30 ? 'good' : 'poor'}>
                {Math.round(metrics.averageFPS)}
              </span>
            </div>
            <div className="metric-item">
              <strong>Memory Usage:</strong> {Math.round(metrics.memoryUsage)}MB
            </div>
            <div className="metric-item">
              <strong>Network Latency:</strong> {Math.round(metrics.networkLatency)}ms
            </div>
            <div className="metric-item">
              <strong>Cache Hit Rate:</strong> {Math.round(metrics.cacheHitRate)}%
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommendations</h3>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index} className="recommendation-item">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings</h3>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index} className="warning-item">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .mobile-performance-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .config-section,
        .device-info,
        .network-info,
        .performance-metrics,
        .recommendations,
        .warnings {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }

        .info-grid,
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item,
        .metric-item {
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .controls {
          margin: 2rem 0;
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .preload-progress {
          margin: 2rem 0;
          padding: 1rem;
          border: 1px solid #007bff;
          border-radius: 8px;
          background: #f0f8ff;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 1rem 0;
        }

        .progress-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .current-asset {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        }

        .good {
          color: #28a745;
          font-weight: bold;
        }

        .poor {
          color: #dc3545;
          font-weight: bold;
        }

        .recommendations ul,
        .warnings ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .recommendation-item {
          margin-bottom: 0.5rem;
          color: #007bff;
        }

        .warning-item {
          margin-bottom: 0.5rem;
          color: #dc3545;
        }

        h2, h3 {
          margin-top: 0;
          color: #333;
        }

        @media (max-width: 768px) {
          .mobile-performance-example {
            padding: 1rem;
          }

          .info-grid,
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default MobilePerformanceExample;