import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { updateChampionshipStatuses } from '@/lib/championship-service';

const createChampionshipSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  gameId: z.string(),
  entryFee: z.number().min(0).max(1000),
  maxParticipants: z.number().min(2).max(1000).optional(),
  duration: z.enum(['1h', '1d', '1m']).default('1d'),
  isPublic: z.boolean().default(true),
});

// GET /api/championships - List championships
export async function GET(request: NextRequest) {
  try {
    // Update championship statuses before fetching
    await updateChampionshipStatuses();
    
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const gameSlug = searchParams.get('gameSlug');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      isPublic: true,
    };

    if (gameId) {
      where.gameId = gameId;
    }

    if (gameSlug) {
      where.game = {
        slug: gameSlug,
      };
    }

    if (status) {
      where.status = status;
    }

    const championships = await prisma.championship.findMany({
      where,
      include: {
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        participants: {
          select: {
            id: true,
            bestScore: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: {
            bestScore: 'desc',
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // UPCOMING first, then ACTIVE, then COMPLETED
        { startTime: 'asc' },
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ championships });
  } catch (error) {
    console.error('Error fetching championships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch championships' },
      { status: 500 }
    );
  }
}

// POST /api/championships - Create championship
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createChampionshipSchema.parse(body);

    // Set start time and calculate end time based on duration
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000); // Start in 5 minutes
    
    let endTime: Date;
    switch (validatedData.duration) {
      case '1h':
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
        break;
      case '1d':
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 1 day
        break;
      case '1m':
        endTime = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days (1 month)
        break;
      default:
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
    }

    // Check if game exists (by ID or slug)
    let game;
    if (body.gameSlug) {
      game = await prisma.game.findUnique({
        where: { slug: body.gameSlug },
      });
    } else {
      // Try to find by ID first, if not found, try by slug
      game = await prisma.game.findUnique({
        where: { id: validatedData.gameId },
      });
      
      // If not found by ID, try by slug (in case gameId is actually a slug)
      if (!game) {
        game = await prisma.game.findUnique({
          where: { slug: validatedData.gameId },
        });
      }
    }

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Prize pool starts at 0 and grows with each participant's entry fee
    const championship = await prisma.championship.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        gameId: game.id,
        entryFee: validatedData.entryFee,
        prizePool: 0, // Start at 0, will increment with each participant
        maxParticipants: validatedData.maxParticipants,
        startTime,
        endTime,
        isPublic: validatedData.isPublic,
        createdBy: session.user.id,
      },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return NextResponse.json({ championship }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating championship:', error);
    return NextResponse.json(
      { error: 'Failed to create championship' },
      { status: 500 }
    );
  }
}