const { PrismaClient } = require('@prisma/client');
const { addHours, addDays, subHours } = require('date-fns');

const prisma = new PrismaClient();

async function seedChampionships() {
  try {
    console.log('🏆 Seeding championship data...');

    // First, ensure we have games to create championships for
    const games = await prisma.game.findMany({
      where: {
        slug: {
          in: ['memdot', 'perfect-square', 'fill-the-holes', '123', 'circle-path']
        }
      }
    });

    if (games.length === 0) {
      console.log('❌ No games found. Please seed games first.');
      return;
    }

    // Get or create a test user to be the championship creator
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Championship Creator',
          username: 'championship_admin',
          credits: 1000,
        }
      });
    }

    const now = new Date();

    // Create sample championships
    const championshipsData = [
      // Active championship
      {
        title: 'Memory Master Challenge',
        description: 'Test your memory skills in this intense championship! Remember the patterns and compete for the top prize.',
        gameId: games.find(g => g.slug === 'memdot')?.id,
        entryFee: 25,
        prizePool: 500,
        maxParticipants: 50,
        startTime: subHours(now, 1), // Started 1 hour ago
        endTime: addHours(now, 3), // Ends in 3 hours
        status: 'ACTIVE',
        createdBy: testUser.id,
      },
      // Upcoming championship
      {
        title: 'Perfect Square Tournament',
        description: 'Precision and timing are key in this championship. Grow your square to perfection!',
        gameId: games.find(g => g.slug === 'perfect-square')?.id,
        entryFee: 15,
        prizePool: 300,
        maxParticipants: 30,
        startTime: addHours(now, 2), // Starts in 2 hours
        endTime: addHours(now, 6), // 4 hour duration
        status: 'UPCOMING',
        createdBy: testUser.id,
      },
      // Another upcoming championship
      {
        title: 'Fill the Holes Marathon',
        description: 'A longer championship for puzzle enthusiasts. Fill all the holes and claim victory!',
        gameId: games.find(g => g.slug === 'fill-the-holes')?.id,
        entryFee: 30,
        prizePool: 750,
        maxParticipants: 25,
        startTime: addDays(now, 1), // Starts tomorrow
        endTime: addDays(addHours(now, 8), 1), // 8 hour duration
        status: 'UPCOMING',
        createdBy: testUser.id,
      },
      // Completed championship
      {
        title: 'Numbers Championship - Week 1',
        description: 'The first weekly numbers championship has concluded. Congratulations to all participants!',
        gameId: games.find(g => g.slug === '123')?.id,
        entryFee: 20,
        prizePool: 400,
        maxParticipants: 20,
        startTime: subDays(now, 2), // Started 2 days ago
        endTime: subHours(now, 2), // Ended 2 hours ago
        status: 'COMPLETED',
        createdBy: testUser.id,
      },
      // Small active championship
      {
        title: 'Circle Path Sprint',
        description: 'Quick 2-hour championship for Circle Path masters!',
        gameId: games.find(g => g.slug === 'circle-path')?.id,
        entryFee: 10,
        prizePool: 150,
        maxParticipants: 15,
        startTime: subHours(now, 0.5), // Started 30 minutes ago
        endTime: addHours(now, 1.5), // Ends in 1.5 hours
        status: 'ACTIVE',
        createdBy: testUser.id,
      },
    ];

    // Create championships
    const createdChampionships = [];
    for (const championshipData of championshipsData) {
      if (championshipData.gameId) {
        const championship = await prisma.championship.create({
          data: championshipData,
        });
        createdChampionships.push(championship);
        console.log(`✅ Created championship: ${championship.title}`);
      }
    }

    // Create some sample participants for active championships
    const activeChampionships = createdChampionships.filter(c => c.status === 'ACTIVE');
    
    // Create additional test users as participants
    const participantUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.upsert({
        where: { email: `player${i}@example.com` },
        update: {},
        create: {
          email: `player${i}@example.com`,
          name: `Player ${i}`,
          username: `player${i}`,
          credits: 500,
        },
      });
      participantUsers.push(user);
    }

    // Add participants to active championships
    for (const championship of activeChampionships) {
      const numParticipants = Math.floor(Math.random() * 8) + 3; // 3-10 participants
      const selectedUsers = participantUsers.slice(0, numParticipants);

      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        const baseScore = Math.floor(Math.random() * 5000) + 1000; // Random score between 1000-6000
        const score = baseScore + (numParticipants - i) * 100; // Higher scores for earlier participants

        // Create participant
        const participant = await prisma.championshipParticipant.create({
          data: {
            championshipId: championship.id,
            userId: user.id,
            bestScore: score,
            joinedAt: subHours(now, Math.random() * 2), // Joined within last 2 hours
          },
        });

        // Create a game score for this participant
        const gameScore = await prisma.gameScore.create({
          data: {
            userId: user.id,
            gameId: championship.gameId,
            score: score,
            level: Math.floor(score / 200) + 1,
            duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
          },
        });

        // Link the game score to the participant
        await prisma.championshipParticipant.update({
          where: { id: participant.id },
          data: { bestScoreId: gameScore.id },
        });

        // Deduct entry fee from user and add to prize pool
        await prisma.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: championship.entryFee,
            },
          },
        });

        await prisma.championship.update({
          where: { id: championship.id },
          data: {
            prizePool: {
              increment: championship.entryFee,
            },
          },
        });

        console.log(`  👤 Added participant ${user.name} with score ${score}`);
      }
    }

    console.log('🎉 Championship seeding completed successfully!');
    console.log(`📊 Created ${createdChampionships.length} championships`);
    console.log(`👥 Added participants to ${activeChampionships.length} active championships`);

  } catch (error) {
    console.error('❌ Error seeding championships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to subtract days
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// Run the seeding
if (require.main === module) {
  seedChampionships();
}

module.exports = { seedChampionships };