'use client';

import React, { useState } from 'react';

export default function TestScoringPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testScoreSubmission = async () => {
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
          metadata: {
            testSubmission: true
          }
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/memdot/scores?period=ALL_TIME&limit=5');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl mb-8">Scoring System Test</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testScoreSubmission}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Score Submission'}
          </button>
          
          <button
            onClick={testLeaderboard}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded disabled:opacity-50 ml-4"
          >
            {loading ? 'Loading...' : 'Test Leaderboard Fetch'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-white text-xl mb-4">Result:</h2>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-white text-xl mb-4">Links:</h2>
          <div className="space-y-2">
            <a href="/games/memdot/championship" className="block text-blue-400 hover:text-blue-300">
              → Memdot Championship Page
            </a>
            <a href="/games/championship" className="block text-blue-400 hover:text-blue-300">
              → Championship Games Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}