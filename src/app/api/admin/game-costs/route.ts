import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: Add proper admin role checking
    // For now, any authenticated user can access (you should implement proper admin checks)

    const costs = await prisma.gameCost.findMany({
      include: {
        game: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { game: { title: 'asc' } },
        { gameMode: 'asc' }
      ]
    })

    return NextResponse.json({ costs })
  } catch (error) {
    console.error('Failed to fetch game costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game costs' },
      { status: 500 }
    )
  }
}