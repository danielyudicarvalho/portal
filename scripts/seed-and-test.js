#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🌱 Seeding database and testing API...\n');

try {
  // Run the seed
  console.log('📊 Running database seed...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  
  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔧 You can now:');
  console.log('   1. Refresh your game page to see the leaderboard working');
  console.log('   2. Play the game to submit scores');
  console.log('   3. Check the leaderboard for your scores');
  
} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
}