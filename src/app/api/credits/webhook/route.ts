import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId
  const paymentType = paymentIntent.metadata.type

  // Only handle credit purchases in this webhook
  if (paymentType !== 'credit_purchase') {
    return
  }

  try {
    const credits = parseInt(paymentIntent.metadata.credits || '0')
    
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.updateMany({
        where: {
          paymentId: paymentIntent.id,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
        },
      })

      // Add credits to user account
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: credits,
          },
        },
      })
    })

    console.log(`Successfully processed credit purchase of ${credits} credits for user ${userId}`)
  } catch (error) {
    console.error('Failed to process successful credit purchase:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const paymentType = paymentIntent.metadata.type

  // Only handle credit purchases in this webhook
  if (paymentType !== 'credit_purchase') {
    return
  }

  try {
    await prisma.transaction.updateMany({
      where: {
        paymentId: paymentIntent.id,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
      },
    })

    console.log(`Credit purchase failed for payment intent: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Failed to process credit purchase failure:', error)
  }
}