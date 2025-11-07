#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if games exist
    const games = await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true
      }
    });

    console.log(`\n📊 Found ${games.length} games in database:`);
    games.forEach(game => {
      console.log(`   - ${game.title} (${game.slug}) ${game.isActive ? '✅' : '❌'}`);
    });

    // Check specifically for memdot
    const memdot = await prisma.game.findFirst({
      where: { slug: 'memdot' }
    });

    if (memdot) {
      console.log(`\n🎯 Memdot game found: ${memdot.title} (ID: ${memdot.id})`);
    } else {
      console.log('\n❌ Memdot game NOT found - need to run seed');
    }

    // Check categories
    const categories = await prisma.gameCategory.findMany();
    console.log(`\n📂 Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('💡 Make sure:');
    console.log('   1. Database is running (npm run db:up)');
    console.log('   2. Migrations are applied (npm run db:migrate)');
    console.log('   3. Database is seeded (npm run db:seed)');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();