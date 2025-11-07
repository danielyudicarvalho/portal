import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  console.log(`🎮 POST /api/games/${params.gameId}/scores - Starting score submission`);
  
  try {
    // Parse request body first
    const body = await request.json();
    const { score, level, duration, metadata } = body;
    
    console.log('📊 Score data received:', { score, level, duration, metadata });

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      console.error('❌ Invalid score:', score);
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    // Check session
    const session = await getServerSession(authOptions);
    console.log('👤 Session check:', session?.user?.email ? 'Authenticated' : 'Anonymous');
    
    if (!session?.user?.email) {
      // For testing: Allow anonymous score submission and save to leaderboard
      console.log('📝 Anonymous score submission - creating anonymous user');
      
      // Find the game first
      console.log(`🔍 Looking for game: ${params.gameId}`);
      const game = await prisma.game.findFirst({
        where: { slug: params.gameId }
      });

      if (!game) {
        console.error(`❌ Game not found: ${params.gameId}`);
        return NextResponse.json({ 
          error: `Game '${params.gameId}' not found. Make sure the database is seeded.` 
        }, { status: 404 });
      }

      // Create or find anonymous user
      let anonymousUser = await prisma.user.findFirst({
        where: { email: 'anonymous@game.local' }
      });

      if (!anonymousUser) {
        anonymousUser = await prisma.user.create({
          data: {
            email: 'anonymous@game.local',
            name: 'Anonymous Player',
            username: 'anonymous'
          }
        });
        console.log('✅ Created anonymous user');
      }

      // Create the score record for anonymous user
      console.log('💾 Creating anonymous score record...');
      const gameScore = await prisma.gameScore.create({
        data: {
          score,
          level: level || 1,
          duration,
          metadata,
          userId: anonymousUser.id,
          gameId: game.id
        }
      });

      console.log(`✅ Anonymous score saved: ${gameScore.id}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Score saved to leaderboard!',
        score,
        level: level || 1,
        anonymous: true,
        scoreId: gameScore.id
      });
    }

    // Find the game first
    console.log(`🔍 Looking for game: ${params.gameId}`);
    const game = await prisma.game.findFirst({
      where: { slug: params.gameId }
    });

    if (!game) {
      console.error(`❌ Game not found: ${params.gameId}`);
      return NextResponse.json({ 
        error: `Game '${params.gameId}' not found. Make sure the database is seeded.` 
      }, { status: 404 });
    }

    console.log(`✅ Game found: ${game.title} (${game.id})`);

    // Find the user
    console.log(`🔍 Looking for user: ${session.user.email}`);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.error(`❌ User not found: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ User found: ${user.id}`);

    // Create the score record
    console.log('💾 Creating score record...');
    const gameScore = await prisma.gameScore.create({
      data: {
        score,
        level: level || 1,
        duration,
        metadata,
        userId: user.id,
        gameId: game.id
      }
    });

    console.log(`✅ Score record created: ${gameScore.id}`);

    // Note: For now we're using a simple leaderboard system that shows all scores
    // The complex period-based leaderboard system can be added later if needed
    console.log('✅ Score saved and will appear on leaderboard');

    return NextResponse.json({ 
      success: true, 
      scoreId: gameScore.id,
      score: gameScore.score,
      level: gameScore.level,
      message: 'Score saved to leaderboard!'
    });

  } catch (error) {
    console.error('❌ Error submitting score:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  console.log(`🔍 GET /api/games/${params.gameId}/scores - Fetching leaderboard`);
  
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'ALL_TIME';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`📊 Parameters: period=${period}, limit=${limit}`);

    // Find the game
    const game = await prisma.game.findFirst({
      where: { slug: params.gameId }
    });

    if (!game) {
      console.error(`❌ Game not found: ${params.gameId}`);
      return NextResponse.json({ 
        error: `Game '${params.gameId}' not found. Make sure the database is seeded.` 
      }, { status: 404 });
    }

    console.log(`✅ Game found: ${game.title} (${game.id})`);

    // Get top scores directly from GameScore table
    // For now, we'll implement a simple leaderboard without the complex period-based system
    console.log('📊 Fetching top scores from database...');
    
    const topScores = await prisma.gameScore.findMany({
      where: {
        gameId: game.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit
    });

    console.log(`📊 Found ${topScores.length} scores`);

    // Transform the data to match the expected leaderboard format
    const entries = topScores.map((scoreRecord, index) => ({
      rank: index + 1,
      score: scoreRecord.score,
      level: scoreRecord.level,
      duration: scoreRecord.duration,
      user: {
        id: scoreRecord.user.id,
        name: scoreRecord.user.name || scoreRecord.user.username || 'Anonymous',
        avatar: scoreRecord.user.avatar
      }
    }));

    return NextResponse.json({
      period: period,
      entries: entries
    });

  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Leaderboard functions temporarily disabled for debugging
// Will be re-enabled once basic score submission works