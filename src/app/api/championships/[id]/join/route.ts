import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // Get championship details
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        participants: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!championship) {
      return NextResponse.json(
        { error: 'Championship not found' },
        { status: 404 }
      );
    }

    // Check if championship is still accepting participants
    if (championship.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Championship is no longer accepting participants' },
        { status: 400 }
      );
    }

    // Check if user is already participating
    const existingParticipant = championship.participants.find(
      (p) => p.userId === session.user.id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already participating in this championship' },
        { status: 400 }
      );
    }

    // Check participant limit
    if (
      championship.maxParticipants &&
      championship._count.participants >= championship.maxParticipants
    ) {
      return NextResponse.json(
        { error: 'Championship is full' },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits < championship.entryFee) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct entry fee from user's credits
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: championship.entryFee,
          },
        },
      });

      // Add user to championship
      const participant = await tx.championshipParticipant.create({
        data: {
          championshipId,
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Update championship prize pool
      await tx.championship.update({
        where: { id: championshipId },
        data: {
          prizePool: {
            increment: championship.entryFee,
          },
        },
      });

      // Record the transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: championship.entryFee,
          type: 'CREDIT_SPEND',
          status: 'COMPLETED',
          description: `Championship entry: ${championship.title}`,
          metadata: {
            championshipId,
            type: 'championship_entry',
          },
        },
      });

      return participant;
    });

    return NextResponse.json({ participant: result });
  } catch (error) {
    console.error('Error joining championship:', error);
    return NextResponse.json(
      { error: 'Failed to join championship' },
      { status: 500 }
    );
  }
}