import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateChampionshipStatuses } from '@/lib/championship-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Update championship statuses before fetching
    await updateChampionshipStatuses();
    
    const championshipId = params.id;

    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            description: true,
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
        },
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

    // Check if user is participating (if authenticated)
    const session = await getServerSession(authOptions);
    let userParticipation = null;

    if (session?.user?.id) {
      userParticipation = championship.participants.find(
        (p) => p.userId === session.user.id
      );
    }

    return NextResponse.json({
      championship,
      userParticipation,
    });
  } catch (error) {
    console.error('Error fetching championship:', error);
    return NextResponse.json(
      { error: 'Failed to fetch championship' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if user is the creator of the championship
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      select: { createdBy: true, status: true },
    });

    if (!championship) {
      return NextResponse.json(
        { error: 'Championship not found' },
        { status: 404 }
      );
    }

    if (championship.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates if championship hasn't started
    if (championship.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Cannot update championship that has already started' },
        { status: 400 }
      );
    }

    const updatedChampionship = await prisma.championship.update({
      where: { id: championshipId },
      data: {
        title: body.title,
        description: body.description,
        entryFee: body.entryFee,
        maxParticipants: body.maxParticipants,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
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

    return NextResponse.json({ championship: updatedChampionship });
  } catch (error) {
    console.error('Error updating championship:', error);
    return NextResponse.json(
      { error: 'Failed to update championship' },
      { status: 500 }
    );
  }
}