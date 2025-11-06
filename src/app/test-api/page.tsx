'use client';

import { useState } from 'react';

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/memdot/scores');
      const data = await response.json();
      setResult({
        type: 'GET Scores',
        status: response.status,
        data
      });
    } catch (error) {
      setResult({
        type: 'GET Scores',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testSubmitScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/memdot/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: Math.floor(Math.random() * 10000),
          level: Math.floor(Math.random() * 10) + 1,
          duration: Math.floor(Math.random() * 300) + 30,
          metadata: { test: true, timestamp: Date.now() }
        })
      });
      const data = await response.json();
      setResult({
        type: 'POST Score',
        status: response.status,
        data
      });
    } catch (error) {
      setResult({
        type: 'POST Score',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testGetScores}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded font-medium"
          >
            {loading ? 'Testing...' : 'Test GET /api/games/memdot/scores'}
          </button>
          
          <button
            onClick={testSubmitScore}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded font-medium ml-4"
          >
            {loading ? 'Testing...' : 'Test POST /api/games/memdot/scores'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              {result.type} Result
            </h2>
            
            {result.status && (
              <div className={`mb-4 px-3 py-1 rounded text-sm font-medium ${
                result.status >= 200 && result.status < 300 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                Status: {result.status}
              </div>
            )}
            
            <pre className="text-gray-300 text-sm overflow-auto bg-gray-900 p-4 rounded">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Debug Info</h3>
          <div className="text-gray-300 text-sm space-y-2">
            <p>• This page tests the score submission API</p>
            <p>• GET request fetches the leaderboard</p>
            <p>• POST request submits a random score</p>
            <p>• Check browser console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}