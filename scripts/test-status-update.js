#!/usr/bin/env node

/**
 * Test script to manually trigger championship status updates
 */

const API_BASE = 'http://localhost:3000';

async function testStatusUpdate() {
  console.log('🔄 Testing Championship Status Updates...\n');

  try {
    // Test 1: Manually trigger status update
    console.log('1️⃣ Triggering manual status update...');
    
    const updateResponse = await fetch(`${API_BASE}/api/championships/update-status`, {
      method: 'GET', // Using GET for manual testing
    });

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('✅ Status update successful!');
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log(`   Message: ${result.message}`);
    } else {
      const error = await updateResponse.json();
      console.log('❌ Status update failed:', error.error);
    }

    // Test 2: Fetch championships to see updated statuses
    console.log('\n2️⃣ Fetching championships to verify status updates...');
    
    const listResponse = await fetch(`${API_BASE}/api/championships`);
    
    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log('✅ Championship listing successful!');
      console.log(`   Found ${data.championships.length} total championships`);
      
      // Group by status
      const statusGroups = data.championships.reduce((groups, champ) => {
        groups[champ.status] = (groups[champ.status] || 0) + 1;
        return groups;
      }, {});
      
      console.log('\n📊 Championship Status Summary:');
      Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} championships`);
      });
      
      console.log('\n📋 Championship Details:');
      data.championships.forEach((champ, index) => {
        const now = new Date();
        const startTime = new Date(champ.startTime);
        const endTime = new Date(champ.endTime);
        
        let timeStatus = '';
        if (now < startTime) {
          timeStatus = '⏳ Not started yet';
        } else if (now >= startTime && now <= endTime) {
          timeStatus = '🟢 Currently running';
        } else {
          timeStatus = '🔴 Already ended';
        }
        
        console.log(`   ${index + 1}. "${champ.title}" - Status: ${champ.status} (${timeStatus})`);
        console.log(`      Start: ${startTime.toLocaleString()}`);
        console.log(`      End: ${endTime.toLocaleString()}`);
      });
    } else {
      console.log('❌ Championship listing failed');
    }

    console.log('\n🎯 Status Update Summary:');
    console.log('   - Championship statuses are now automatically updated when fetching data');
    console.log('   - UPCOMING → ACTIVE when start time is reached');
    console.log('   - ACTIVE → COMPLETED when end time is reached');
    console.log('   - Status updates happen on every API call for real-time accuracy');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testStatusUpdate();