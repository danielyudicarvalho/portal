'use client';

import React from 'react';
import { ResponsiveGameContainer, ViewportManager, ViewportConfigs } from '@/components/features';
import { useOrientation } from '@/hooks';

/**
 * Example showing how to use orientation and viewport management components
 */
export const OrientationExample: React.FC = () => {
  const { orientation, isLandscape, dimensions, lockOrientation } = useOrientation({
    onOrientationChange: (event) => {
      console.log('Orientation changed:', event);
    }
  });

  const handleLockLandscape = () => {
    lockOrientation('landscape');
  };

  const handleLockPortrait = () => {
    lockOrientation('portrait');
  };

  return (
    <div className="orientation-example">
      <h2>Orientation Management Example</h2>
      
      <div className="controls">
        <p>Current orientation: <strong>{orientation}</strong></p>
        <p>Dimensions: {dimensions.width} x {dimensions.height}</p>
        <p>Is landscape: {isLandscape ? 'Yes' : 'No'}</p>
        
        <div className="buttons">
          <button onClick={handleLockLandscape}>Lock Landscape</button>
          <button onClick={handleLockPortrait}>Lock Portrait</button>
        </div>
      </div>

      {/* Example 1: Basic responsive container */}
      <div className="example-section">
        <h3>Basic Responsive Container</h3>
        <ResponsiveGameContainer gameId="basic-example">
          <div className="demo-game">
            <p>This content adapts to orientation changes</p>
            <div className="demo-content">
              Current orientation: {orientation}
            </div>
          </div>
        </ResponsiveGameContainer>
      </div>

      {/* Example 2: Fixed aspect ratio game */}
      <div className="example-section">
        <h3>Fixed Aspect Ratio Game</h3>
        <ViewportManager config={ViewportConfigs.fixedAspect}>
          <ResponsiveGameContainer 
            gameId="fixed-aspect-example"
            viewportConfig={ViewportConfigs.fixedAspect}
          >
            <div className="demo-game fixed-aspect">
              <p>800x600 fixed aspect ratio</p>
              <div className="demo-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="grid-item">{i + 1}</div>
                ))}
              </div>
            </div>
          </ResponsiveGameContainer>
        </ViewportManager>
      </div>

      {/* Example 3: Landscape-only game */}
      <div className="example-section">
        <h3>Landscape-Only Game</h3>
        <ViewportManager config={ViewportConfigs.landscape}>
          <ResponsiveGameContainer 
            gameId="landscape-example"
            viewportConfig={ViewportConfigs.landscape}
          >
            <div className="demo-game landscape-game">
              <p>This game prefers landscape orientation</p>
              <div className="landscape-content">
                <div className="left-panel">Left Panel</div>
                <div className="center-panel">Game Area</div>
                <div className="right-panel">Right Panel</div>
              </div>
            </div>
          </ResponsiveGameContainer>
        </ViewportManager>
      </div>

      <style jsx>{`
        .orientation-example {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .controls {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .buttons {
          margin-top: 10px;
        }

        .buttons button {
          margin-right: 10px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .buttons button:hover {
          background: #0056b3;
        }

        .example-section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .example-section h3 {
          background: #e9ecef;
          margin: 0;
          padding: 15px;
          border-bottom: 1px solid #ddd;
        }

        .demo-game {
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: center;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .demo-content {
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 20px;
          margin-top: 10px;
        }

        .fixed-aspect {
          min-height: 300px;
        }

        .demo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 20px;
          max-width: 300px;
        }

        .grid-item {
          background: rgba(255, 255, 255, 0.3);
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }

        .landscape-game {
          min-height: 250px;
        }

        .landscape-content {
          display: flex;
          width: 100%;
          max-width: 600px;
          margin-top: 20px;
        }

        .left-panel,
        .right-panel {
          background: rgba(255, 255, 255, 0.2);
          padding: 20px;
          flex: 1;
          margin: 0 10px;
          border-radius: 8px;
        }

        .center-panel {
          background: rgba(255, 255, 255, 0.3);
          padding: 20px;
          flex: 2;
          margin: 0 10px;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .landscape-content {
            flex-direction: column;
          }

          .left-panel,
          .right-panel,
          .center-panel {
            margin: 5px 0;
          }
        }
      `}</style>
    </div>
  );
};