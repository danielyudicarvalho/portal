#!/usr/bin/env node

/**
 * Script to add test credits to a user account
 * Usage: node scripts/add-test-credits.js <email> <credits>
 * Example: node scripts/add-test-credits.js user@example.com 100
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestCredits() {
  const email = process.argv[2]
  const credits = parseInt(process.argv[3])

  if (!email || !credits || isNaN(credits)) {
    console.log('Usage: node scripts/add-test-credits.js <email> <credits>')
    console.log('Example: node scripts/add-test-credits.js user@example.com 100')
    process.exit(1)
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, credits: true }
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log(`📧 Found user: ${user.email}`)
    console.log(`💰 Current credits: ${user.credits}`)

    // Add credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          increment: credits
        }
      },
      select: { credits: true }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: credits,
        type: 'CREDIT_PURCHASE',
        status: 'COMPLETED',
        description: `Test credits added via script`,
        metadata: {
          source: 'test_script',
          addedCredits: credits
        }
      }
    })

    console.log(`✅ Added ${credits} credits`)
    console.log(`💰 New balance: ${updatedUser.credits} credits`)
    console.log(`📝 Transaction recorded`)

  } catch (error) {
    console.error('❌ Error adding credits:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addTestCredits()