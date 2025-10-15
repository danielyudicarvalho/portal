import { NextResponse } from 'next/server';

/**
 * Simple ping endpoint for connectivity checks
 * Used by the offline handler to determine if the frontend is reachable
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    server: 'frontend'
  });
}

export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}