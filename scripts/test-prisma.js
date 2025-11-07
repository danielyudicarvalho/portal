#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaModels() {
  console.log('🔍 Testing Prisma Client Models...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test Game model
    console.log('\n1️⃣ Testing Game model...');
    const game = await prisma.game.findFirst({
      where: { slug: 'memdot' }
    });
    console.log('✅ Game model works:', game ? `Found ${game.title}` : 'No game found');

    // Test User model
    console.log('\n2️⃣ Testing User model...');
    const userCount = await prisma.user.count();
    console.log('✅ User model works:', `${userCount} users in database`);

    // Test GameScore model
    console.log('\n3️⃣ Testing GameScore model...');
    const scoreCount = await prisma.gameScore.count();
    console.log('✅ GameScore model works:', `${scoreCount} scores in database`);

    // Test creating a GameScore (if we have a game and user)
    if (game) {
      console.log('\n4️⃣ Testing GameScore creation...');
      
      // Create a test user if none exists
      let testUser = await prisma.user.findFirst();
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            username: 'testuser'
          }
        });
        console.log('✅ Created test user:', testUser.email);
      } else {
        console.log('✅ Using existing user:', testUser.email);
      }

      // Create a test score
      const testScore = await prisma.gameScore.create({
        data: {
          score: 9999,
          level: 10,
          duration: 180,
          metadata: { test: true, timestamp: Date.now() },
          userId: testUser.id,
          gameId: game.id
        }
      });
      
      console.log('✅ GameScore creation works:', `Created score ${testScore.id} with ${testScore.score} points`);
      
      // Clean up test score
      await prisma.gameScore.delete({
        where: { id: testScore.id }
      });
      console.log('✅ Test score cleaned up');
    }

    console.log('\n🎉 All Prisma models are working correctly!');

  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaModels();