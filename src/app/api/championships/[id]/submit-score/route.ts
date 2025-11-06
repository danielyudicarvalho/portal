import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const submitScoreSchema = z.object({
  score: z.number().min(0),
  level: z.number().min(1).default(1),
  duration: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const championshipId = params.id;
    const body = await request.json();
    const validatedData = submitScoreSchema.parse(body);

    // Get championship details
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!championship) {
      return NextResponse.json(
        { error: 'Championship not found' },
        { status: 404 }
      );
    }

    // Check if championship is active
    const now = new Date();
    if (championship.status !== 'ACTIVE' || now < championship.startTime || now > championship.endTime) {
      return NextResponse.json(
        { error: 'Championship is not currently active' },
        { status: 400 }
      );
    }

    // Check if user is participating
    const participant = championship.participants[0];
    if (!participant) {
      return NextResponse.json(
        { error: 'You are not participating in this championship' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the game score
      const gameScore = await tx.gameScore.create({
        data: {
          userId: session.user.id,
          gameId: championship.gameId,
          score: validatedData.score,
          level: validatedData.level,
          duration: validatedData.duration,
          metadata: validatedData.metadata,
        },
      });

      // Update participant's best score if this is better
      if (validatedData.score > participant.bestScore) {
        await tx.championshipParticipant.update({
          where: { id: participant.id },
          data: {
            bestScore: validatedData.score,
            bestScoreId: gameScore.id,
          },
        });
      }

      return gameScore;
    });

    // Get updated leaderboard
    const updatedParticipants = await prisma.championshipParticipant.findMany({
      where: { championshipId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        gameScore: {
          select: {
            id: true,
            score: true,
            level: true,
            duration: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        bestScore: 'desc',
      },
    });

    return NextResponse.json({
      gameScore: result,
      leaderboard: updatedParticipants,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting championship score:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}