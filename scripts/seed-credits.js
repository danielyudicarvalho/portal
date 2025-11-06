const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCredits() {
  console.log('🌱 Seeding credit system...')

  try {
    // Create credit packages
    const packages = [
      {
        id: 'pkg_starter',
        name: 'Starter Pack',
        credits: 100,
        price: 4.99,
        bonusCredits: 0,
        isPopular: false,
        order: 1
      },
      {
        id: 'pkg_popular',
        name: 'Popular Pack',
        credits: 250,
        price: 9.99,
        bonusCredits: 50,
        isPopular: true,
        order: 2
      },
      {
        id: 'pkg_premium',
        name: 'Premium Pack',
        credits: 500,
        price: 19.99,
        bonusCredits: 150,
        isPopular: false,
        order: 3
      },
      {
        id: 'pkg_mega',
        name: 'Mega Pack',
        credits: 1000,
        price: 34.99,
        bonusCredits: 400,
        isPopular: false,
        order: 4
      }
    ]

    for (const pkg of packages) {
      await prisma.creditPackage.upsert({
        where: { id: pkg.id },
        update: pkg,
        create: pkg
      })
    }

    console.log('✅ Credit packages created')

    // Get all games and add costs
    const games = await prisma.game.findMany()
    
    const gameCosts = [
      // Standard games cost 10 credits
      ...games.map(game => ({
        gameId: game.id,
        gameMode: 'standard',
        credits: 10
      })),
      // Championship games cost 25 credits
      ...games.map(game => ({
        gameId: game.id,
        gameMode: 'championship',
        credits: 25
      })),
      // Multiplayer games cost 15 credits
      ...games.map(game => ({
        gameId: game.id,
        gameMode: 'multiplayer',
        credits: 15
      }))
    ]

    for (const cost of gameCosts) {
      await prisma.gameCost.upsert({
        where: {
          gameId_gameMode: {
            gameId: cost.gameId,
            gameMode: cost.gameMode
          }
        },
        update: { credits: cost.credits },
        create: cost
      })
    }

    console.log('✅ Game costs created')

    // Give existing users some free credits to start
    await prisma.user.updateMany({
      where: { credits: 0 },
      data: { credits: 50 } // 50 free credits for existing users
    })

    console.log('✅ Free credits added to existing users')

  } catch (error) {
    console.error('❌ Error seeding credits:', error)
    throw error
  }
}

async function main() {
  try {
    await seedCredits()
    console.log('🎉 Credit system seeded successfully!')
  } catch (error) {
    console.error('Failed to seed credit system:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = { seedCredits }