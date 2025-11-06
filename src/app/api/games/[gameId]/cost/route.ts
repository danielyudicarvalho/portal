import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const gameMode = searchParams.get('mode') || 'standard'

    const gameCost = await prisma.gameCost.findUnique({
      where: {
        gameId_gameMode: {
          gameId: params.gameId,
          gameMode
        },
        isActive: true
      }
    })

    if (!gameCost) {
      return NextResponse.json(
        { error: 'Game cost not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      credits: gameCost.credits,
      gameMode: gameCost.gameMode
    })
  } catch (error) {
    console.error('Failed to fetch game cost:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game cost' },
      { status: 500 }
    )
  }
}