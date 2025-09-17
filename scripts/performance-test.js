#!/usr/bin/env node

/**
 * Performance testing script for CareHome application
 * Tests API response times and connection stability
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://sep490-be-xniz.onrender.com';
const TEST_ENDPOINTS = [
  '/auth/login',
  '/users',
  '/residents',
  '/activities'
];

const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 15000
    }, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          responseTime,
          data: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        error: error.message,
        responseTime,
        code: error.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        error: 'Request timeout',
        responseTime,
        code: 'TIMEOUT'
      });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`\n🧪 Testing ${method} ${endpoint}...`);
  
  try {
    const result = await makeRequest(url, { method, body });
    console.log(`✅ Success: ${result.status} (${result.responseTime}ms)`);
    return {
      endpoint,
      success: true,
      status: result.status,
      responseTime: result.responseTime
    };
  } catch (error) {
    console.log(`❌ Failed: ${error.error} (${error.responseTime}ms)`);
    return {
      endpoint,
      success: false,
      error: error.error,
      responseTime: error.responseTime,
      code: error.code
    };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting CareHome Performance Test...\n');
  console.log(`📡 Testing API: ${API_BASE_URL}`);
  
  const results = [];
  
  // Test basic endpoints
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test login endpoint with credentials
  const loginResult = await testEndpoint('/auth/login', 'POST', TEST_CREDENTIALS);
  results.push(loginResult);
  
  // Summary
  console.log('\n📊 Performance Test Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed requests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    const maxResponseTime = Math.max(...successful.map(r => r.responseTime));
    const minResponseTime = Math.min(...successful.map(r => r.responseTime));
    
    console.log(`\n⏱️  Response Time Statistics:`);
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Fastest: ${minResponseTime}ms`);
    console.log(`   Slowest: ${maxResponseTime}ms`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Requests:`);
    failed.forEach(f => {
      console.log(`   ${f.endpoint}: ${f.error} (${f.responseTime}ms)`);
    });
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  if (failed.length > 0) {
    console.log('   - Consider implementing retry mechanism');
    console.log('   - Check network connectivity');
    console.log('   - Verify server status');
  }
  
  const slowRequests = successful.filter(r => r.responseTime > 5000);
  if (slowRequests.length > 0) {
    console.log('   - Some requests are slow (>5s), consider optimization');
  }
  
  const fastRequests = successful.filter(r => r.responseTime < 1000);
  if (fastRequests.length === successful.length && successful.length > 0) {
    console.log('   - All requests are fast (<1s), great performance!');
  }
  
  console.log('\n🏁 Performance test completed!');
}

// Run the test
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, testEndpoint };
