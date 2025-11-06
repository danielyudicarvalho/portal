import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'

const STRIPE_CONFIG = {
  currency: 'usd',
  minimumAmount: 100, // $1.00 in cents
  maximumAmount: 100000, // $1000.00 in cents
}

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
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

    const { amount } = await request.json()

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const amountInCents = Math.round(amount * 100)

    if (amountInCents < STRIPE_CONFIG.minimumAmount) {
      return NextResponse.json(
        { error: `Minimum deposit is $${STRIPE_CONFIG.minimumAmount / 100}` },
        { status: 400 }
      )
    }

    if (amountInCents > STRIPE_CONFIG.maximumAmount) {
      return NextResponse.json(
        { error: `Maximum deposit is $${STRIPE_CONFIG.maximumAmount / 100}` },
        { status: 400 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: STRIPE_CONFIG.currency,
      metadata: {
        userId: session.user.id,
        type: 'deposit',
      },
    })

    // Create pending transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        paymentId: paymentIntent.id,
        paymentProvider: 'stripe',
        description: `Deposit of $${amount.toFixed(2)}`,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}