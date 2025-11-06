import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Failed to fetch credit packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    )
  }
}