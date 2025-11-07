import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { gameId, gameMode = 'standard' } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Get game cost
    const gameCost = await prisma.gameCost.findUnique({
      where: {
        gameId_gameMode: {
          gameId,
          gameMode
        },
        isActive: true
      },
      include: {
        game: true
      }
    })

    if (!gameCost) {
      return NextResponse.json(
        { error: 'Game cost not found' },
        { status: 404 }
      )
    }

    // Check user's credit balance and spend credits
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      if (user.credits < gameCost.credits) {
        throw new Error('Insufficient credits')
      }

      // Deduct credits
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: gameCost.credits
          }
        },
        select: { credits: true }
      })

      // Record the transaction
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: gameCost.credits,
          type: 'CREDIT_SPEND',
          status: 'COMPLETED',
          description: `Played ${gameCost.game.title} (${gameMode})`,
          metadata: {
            gameId,
            gameMode,
            gameName: gameCost.game.title
          }
        }
      })

      return {
        success: true,
        remainingCredits: updatedUser.credits,
        creditsSpent: gameCost.credits
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Credit spend error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Insufficient credits') {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 400 }
        )
      }
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to spend credits' },
      { status: 500 }
    )
  }
}