const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testChampionships() {
  try {
    console.log('🧪 Testing Championship System...\n');

    // Test 1: Fetch all championships
    console.log('1️⃣ Fetching all championships...');
    const championships = await prisma.championship.findMany({
      include: {
        game: {
          select: {
            title: true,
            slug: true,
          },
        },
        creator: {
          select: {
            name: true,
            username: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                name: true,
                username: true,
              },
            },
          },
          orderBy: {
            bestScore: 'desc',
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    console.log(`Found ${championships.length} championships:`);
    championships.forEach((championship, index) => {
      console.log(`  ${index + 1}. ${championship.title} (${championship.game.title})`);
      console.log(`     Status: ${championship.status}`);
      console.log(`     Participants: ${championship._count.participants}`);
      console.log(`     Prize Pool: ${championship.prizePool} credits`);
      console.log(`     Entry Fee: ${championship.entryFee} credits`);
      if (championship.participants.length > 0) {
        console.log(`     Leader: ${championship.participants[0].user.name} (${championship.participants[0].bestScore} points)`);
      }
      console.log('');
    });

    // Test 2: Check active championships
    console.log('2️⃣ Active championships:');
    const activeChampionships = championships.filter(c => c.status === 'ACTIVE');
    console.log(`Found ${activeChampionships.length} active championships`);
    activeChampionships.forEach(championship => {
      console.log(`  - ${championship.title}: ${championship.participants.length} participants`);
    });
    console.log('');

    // Test 3: Check upcoming championships
    console.log('3️⃣ Upcoming championships:');
    const upcomingChampionships = championships.filter(c => c.status === 'UPCOMING');
    console.log(`Found ${upcomingChampionships.length} upcoming championships`);
    upcomingChampionships.forEach(championship => {
      console.log(`  - ${championship.title}: starts ${championship.startTime}`);
    });
    console.log('');

    // Test 4: Check user credits
    console.log('4️⃣ User credit balances:');
    const users = await prisma.user.findMany({
      select: {
        name: true,
        username: true,
        credits: true,
      },
      orderBy: {
        credits: 'desc',
      },
      take: 10,
    });

    users.forEach(user => {
      console.log(`  ${user.name || user.username}: ${user.credits} credits`);
    });
    console.log('');

    // Test 5: Check transactions
    console.log('5️⃣ Recent championship transactions:');
    const transactions = await prisma.transaction.findMany({
      where: {
        description: {
          contains: 'Championship',
        },
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    transactions.forEach(transaction => {
      console.log(`  ${transaction.user.name}: ${transaction.type} ${transaction.amount} credits - ${transaction.description}`);
    });

    console.log('\n✅ Championship system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing championships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testChampionships();
}

module.exports = { testChampionships };