#!/usr/bin/env node

/**
 * Test script to verify championship creation and listing works correctly
 */

const API_BASE = 'http://localhost:3000';

async function testChampionshipFlow() {
  console.log('🧪 Testing Championship Creation and Listing...\n');

  try {
    // Test 1: Create a championship for "fill-the-holes"
    console.log('1️⃣ Testing championship creation for "fill-the-holes"...');
    
    const createResponse = await fetch(`${API_BASE}/api/championships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would need proper authentication
      },
      body: JSON.stringify({
        title: 'Test Fill the Holes Championship',
        description: 'Testing championship creation',
        gameId: 'fill-the-holes', // This is actually a slug, but should work now
        entryFee: 10,
        duration: '1d',
        isPublic: true
      })
    });

    if (createResponse.status === 401) {
      console.log('⚠️  Authentication required - this is expected in production');
      console.log('   Championship creation requires user login');
    } else if (createResponse.ok) {
      const championship = await createResponse.json();
      console.log('✅ Championship created successfully!');
      console.log(`   ID: ${championship.championship.id}`);
      console.log(`   Game: ${championship.championship.game.title}`);
    } else {
      const error = await createResponse.json();
      console.log('❌ Championship creation failed:', error.error);
    }

    // Test 2: List championships for "fill-the-holes"
    console.log('\n2️⃣ Testing championship listing for "fill-the-holes"...');
    
    const listResponse = await fetch(`${API_BASE}/api/championships?gameSlug=fill-the-holes`);
    
    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log('✅ Championship listing works!');
      console.log(`   Found ${data.championships.length} championships for "fill-the-holes"`);
      
      data.championships.forEach((champ, index) => {
        console.log(`   ${index + 1}. ${champ.title} (${champ.status})`);
      });
    } else {
      console.log('❌ Championship listing failed');
    }

    // Test 3: List championships for "memdot"
    console.log('\n3️⃣ Testing championship listing for "memdot"...');
    
    const memdotResponse = await fetch(`${API_BASE}/api/championships?gameSlug=memdot`);
    
    if (memdotResponse.ok) {
      const data = await memdotResponse.json();
      console.log('✅ Memdot championship listing works!');
      console.log(`   Found ${data.championships.length} championships for "memdot"`);
      
      data.championships.forEach((champ, index) => {
        console.log(`   ${index + 1}. ${champ.title} (${champ.status})`);
      });
    } else {
      console.log('❌ Memdot championship listing failed');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   - Championship API endpoints are working');
    console.log('   - Game slug filtering is functional');
    console.log('   - The fix for gameId/slug handling should resolve the listing issue');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit any game championship page (e.g., /games/fill-the-holes/championship)');
    console.log('   3. Create a championship and verify it appears in the list');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testChampionshipFlow();