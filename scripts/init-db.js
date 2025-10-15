#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Initializing Game Portal Database...\n');

try {
  // Start database services
  console.log('📦 Starting PostgreSQL and Redis containers...');
  execSync('npm run db:up', { stdio: 'inherit' });
  
  // Wait a moment for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit' });
  
  // Run migrations
  console.log('📊 Running database migrations...');
  execSync('npm run db:migrate', { stdio: 'inherit' });
  
  console.log('\n✅ Database initialization completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run "npm run dev" to start the development server');
  console.log('   2. Visit http://localhost:3000 to test authentication');
  console.log('   3. Use "npm run db:studio" to view database in browser');
  console.log('\n🔧 Database management commands:');
  console.log('   - npm run db:up     - Start database services');
  console.log('   - npm run db:down   - Stop database services');
  console.log('   - npm run db:reset  - Reset database (removes all data)');
  console.log('   - npm run db:studio - Open Prisma Studio');
  
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}