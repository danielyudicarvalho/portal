import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 */
export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_MULTIPLAYER_URL: process.env.NEXT_PUBLIC_MULTIPLAYER_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Only show these in development
    ...(process.env.NODE_ENV === 'development' && {
      allPublicEnvVars: Object.keys(process.env)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .reduce((acc, key) => {
          acc[key] = process.env[key];
          return acc;
        }, {} as Record<string, string | undefined>)
    })
  });
}