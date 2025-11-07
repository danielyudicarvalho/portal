#!/usr/bin/env node

// Simple test to check if the API is working
async function testAPI() {
  console.log('🧪 Testing Score Submission API...\n');

  try {
    // Test GET request first
    console.log('1️⃣ Testing GET /api/games/memdot/scores');
    const getResponse = await fetch('http://localhost:3000/api/games/memdot/scores');
    const getData = await getResponse.json();
    
    console.log('📊 GET Response:', {
      status: getResponse.status,
      data: getData
    });

    // Test POST request (anonymous)
    console.log('\n2️⃣ Testing POST /api/games/memdot/scores (anonymous)');
    const postResponse = await fetch('http://localhost:3000/api/games/memdot/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: 1000,
        level: 5,
        duration: 120,
        metadata: { test: true }
      })
    });
    
    const postData = await postResponse.json();
    
    console.log('📊 POST Response:', {
      status: postResponse.status,
      data: postData
    });

    if (postResponse.ok) {
      console.log('\n✅ API is working correctly!');
    } else {
      console.log('\n❌ API has issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Development server is running (npm run dev)');
    console.log('   2. Database is running (npm run db:up)');
    console.log('   3. Database is seeded (npm run db:seed)');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };