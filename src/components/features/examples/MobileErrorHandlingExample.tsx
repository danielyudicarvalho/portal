'use client';

import React, { useState, useRef } from 'react';
import { MobileErrorHandler } from '../MobileErrorHandler';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const MobileErrorHandlingExample: React.FC = () => {
  const [simulateError, setSimulateError] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const gameElementRef = useRef<HTMLDivElement>(null);

  const handleError = (error: Error, context: string) => {
    console.log('Error handled:', { error: error.message, context });
  };

  const handleRecovery = () => {
    console.log('Recovery completed');
    setSimulateError(false);
  };

  const simulateTouchError = () => {
    if (gameElementRef.current) {
      const errorEvent = new CustomEvent('touchinputerror', {
        detail: {
          type: 'calibration',
          message: 'Touch calibration failed - this is a demo',
          timestamp: Date.now(),
          gameId: 'demo-game',
        },
      });
      gameElementRef.current.dispatchEvent(errorEvent);
    }
  };

  const ErrorComponent = () => {
    if (simulateError) {
      throw new Error('Simulated error for demo purposes');
    }
    return <div>Game content is working normally</div>;
  };

  const OfflineSimulator = () => {
    if (simulateOffline) {
      throw new Error('Network error: Failed to fetch');
    }
    return <div>Online content loaded successfully</div>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mobile Error Handling Demo</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Error Boundary Demo */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Error Boundary Demo</h2>
          <div className="space-y-4">
            <MobileErrorHandler
              gameId="demo-game"
              onError={handleError}
              onRecovery={handleRecovery}
            >
              <div className="p-4 bg-gray-50 rounded">
                <ErrorComponent />
              </div>
            </MobileErrorHandler>
            
            <Button
              onClick={() => setSimulateError(!simulateError)}
              variant={simulateError ? 'danger' : 'primary'}
            >
              {simulateError ? 'Fix Error' : 'Simulate Error'}
            </Button>
          </div>
        </Card>

        {/* Offline Error Demo */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Offline Error Demo</h2>
          <div className="space-y-4">
            <MobileErrorHandler
              gameId="demo-game"
              onError={handleError}
              onRecovery={handleRecovery}
            >
              <div className="p-4 bg-gray-50 rounded">
                <OfflineSimulator />
              </div>
            </MobileErrorHandler>
            
            <Button
              onClick={() => setSimulateOffline(!simulateOffline)}
              variant={simulateOffline ? 'danger' : 'secondary'}
            >
              {simulateOffline ? 'Go Online' : 'Simulate Offline'}
            </Button>
          </div>
        </Card>

        {/* Touch Input Error Demo */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Touch Input Error Demo</h2>
          <div className="space-y-4">
            <MobileErrorHandler
              gameId="demo-game"
              gameElement={gameElementRef.current}
              onError={handleError}
              onRecovery={handleRecovery}
            >
              <div 
                ref={gameElementRef}
                className="p-8 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-center"
              >
                <p className="mb-4">Game Area - Touch interactions are monitored here</p>
                <p className="text-sm text-gray-600">
                  This area simulates a game where touch input errors can occur
                </p>
              </div>
            </MobileErrorHandler>
            
            <div className="flex gap-2">
              <Button
                onClick={simulateTouchError}
                variant="outline"
              >
                Simulate Touch Error
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Usage Instructions</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Error Boundary:</strong> Click &quot;Simulate Error&quot; to trigger a component error and see the error boundary in action.</p>
          <p><strong>Offline Error:</strong> Click &quot;Simulate Offline&quot; to trigger a network error and see offline error handling.</p>
          <p><strong>Touch Input Error:</strong> Click &quot;Simulate Touch Error&quot; to trigger touch input calibration issues.</p>
        </div>
      </Card>

      {/* Code Example */}
      <Card className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Code Example</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { MobileErrorHandler } from '@/components/features';

<MobileErrorHandler
  gameId="your-game-id"
  gameElement={gameElementRef.current}
  onError={(error, context) => {
    console.log('Error:', error.message, 'Context:', context);
  }}
  onRecovery={() => {
    console.log('Recovery completed');
  }}
>
  <YourGameComponent />
</MobileErrorHandler>`}
        </pre>
      </Card>
    </div>
  );
};

export default MobileErrorHandlingExample;