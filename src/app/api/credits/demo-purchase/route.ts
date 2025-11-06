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

    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Get the credit package
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId, isActive: true }
    })

    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid credit package' },
        { status: 400 }
      )
    }

    const totalCredits = creditPackage.credits + creditPackage.bonusCredits

    // Simulate successful payment by directly adding credits
    await prisma.$transaction(async (tx) => {
      // Add credits to user account
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            increment: totalCredits,
          },
        },
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: creditPackage.price,
          type: 'CREDIT_PURCHASE',
          status: 'COMPLETED',
          paymentId: `demo_${Date.now()}`,
          paymentProvider: 'demo',
          description: `Demo purchase of ${totalCredits} credits (${creditPackage.name})`,
          metadata: {
            packageId: creditPackage.id,
            credits: totalCredits,
            packageName: creditPackage.name,
            demoMode: true
          }
        },
      })
    })

    return NextResponse.json({
      success: true,
      package: creditPackage,
      totalCredits,
      message: 'Demo purchase completed successfully'
    })
  } catch (error) {
    console.error('Demo credit purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to complete demo purchase' },
      { status: 500 }
    )
  }
}