const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChampionshipPrizePools() {
  try {
    console.log('🔧 Fixing championship prize pools...');

    // Get all championships with their participants
    const championships = await prisma.championship.findMany({
      include: {
        participants: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    console.log(`Found ${championships.length} championships to check`);

    for (const championship of championships) {
      const participantCount = championship._count.participants;
      const correctPrizePool = championship.entryFee * participantCount;
      
      console.log(`\n📊 Championship: ${championship.title}`);
      console.log(`   Entry Fee: ${championship.entryFee} credits`);
      console.log(`   Participants: ${participantCount}`);
      console.log(`   Current Prize Pool: ${championship.prizePool} credits`);
      console.log(`   Correct Prize Pool: ${correctPrizePool} credits`);

      if (championship.prizePool !== correctPrizePool) {
        console.log(`   ❌ Prize pool mismatch! Fixing...`);
        
        await prisma.championship.update({
          where: { id: championship.id },
          data: {
            prizePool: correctPrizePool,
          },
        });
        
        console.log(`   ✅ Fixed prize pool: ${championship.prizePool} → ${correctPrizePool}`);
      } else {
        console.log(`   ✅ Prize pool is correct`);
      }
    }

    console.log('\n🎉 Championship prize pool fix completed!');

  } catch (error) {
    console.error('❌ Error fixing championship prize pools:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixChampionshipPrizePools();
}

module.exports = { fixChampionshipPrizePools };