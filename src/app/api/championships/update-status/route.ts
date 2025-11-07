import { NextRequest, NextResponse } from 'next/server';
import { updateChampionshipStatuses } from '@/lib/championship-service';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateChampionshipStatuses();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Championship statuses updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating championship statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update championship statuses' },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  try {
    await updateChampionshipStatuses();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Championship statuses updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating championship statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update championship statuses' },
      { status: 500 }
    );
  }
}