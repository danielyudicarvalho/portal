import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment processing not available' },
      { status: 503 }
    )
  }

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

    const amountInCents = Math.round(creditPackage.price * 100)
    const totalCredits = creditPackage.credits + creditPackage.bonusCredits

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        userId: session.user.id,
        type: 'credit_purchase',
        packageId: creditPackage.id,
        credits: totalCredits.toString(),
      },
    })

    // Create pending transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: creditPackage.price,
        type: 'CREDIT_PURCHASE',
        status: 'PENDING',
        paymentId: paymentIntent.id,
        paymentProvider: 'stripe',
        description: `Purchase of ${totalCredits} credits (${creditPackage.name})`,
        metadata: {
          packageId: creditPackage.id,
          credits: totalCredits,
          packageName: creditPackage.name
        }
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      package: creditPackage,
      totalCredits
    })
  } catch (error) {
    console.error('Create credit purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to create credit purchase' },
      { status: 500 }
    )
  }
}