import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection (skip during build)
    if (process.env.NODE_ENV !== 'production' || process.env.SKIP_DB_CHECK !== 'true') {
      await prisma.$queryRaw`SELECT 1`;
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: process.env.SKIP_DB_CHECK === 'true' ? 'skipped' : 'connected',
        app: 'running'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 });
  }
}