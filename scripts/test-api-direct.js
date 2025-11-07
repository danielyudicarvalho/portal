#!/usr/bin/env node

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing API directly via HTTP...\n');

  try {
    // Test GET request
    console.log('1️⃣ Testing GET /api/games/memdot/scores');
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/games/memdot/scores',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const getResult = await makeRequest(getOptions);
    console.log('📊 GET Response:', getResult);

    // Test POST request
    console.log('\n2️⃣ Testing POST /api/games/memdot/scores');
    const postData = JSON.stringify({
      score: 1500,
      level: 7,
      duration: 90,
      metadata: { test: true, timestamp: Date.now() }
    });

    const postOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/games/memdot/scores',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const postResult = await makeRequest(postOptions, postData);
    console.log('📊 POST Response:', postResult);

    if (postResult.status === 200) {
      console.log('\n✅ API is working correctly!');
    } else {
      console.log('\n❌ API has issues - Status:', postResult.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running on port 3000');
  }
}

testAPI();