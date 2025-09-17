#!/usr/bin/env node

/**
 * Test script specifically for family API endpoints
 * Tests the endpoints that are causing slow data loading
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://sep490-be-xniz.onrender.com';

// Test credentials - replace with actual test data
const TEST_FAMILY_MEMBER_ID = 'test-family-member-id'; // Replace with actual ID
const TEST_RESIDENT_ID = 'test-resident-id'; // Replace with actual ID

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': options.token ? `Bearer ${options.token}` : undefined,
        ...options.headers
      },
      timeout: 20000 // 20 second timeout
    }, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            responseTime,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            responseTime,
            data: data,
            headers: res.headers
          });
        }
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

async function testFamilyEndpoints() {
  console.log('🧪 Testing Family API Endpoints...\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  const endpoints = [
    {
      name: 'Get Residents by Family Member ID',
      url: `${API_BASE_URL}/residents/family-member/${TEST_FAMILY_MEMBER_ID}`,
      method: 'GET'
    },
    {
      name: 'Get Vital Signs by Resident ID',
      url: `${API_BASE_URL}/vital-signs/resident/${TEST_RESIDENT_ID}`,
      method: 'GET'
    },
    {
      name: 'Get Care Notes by Resident ID',
      url: `${API_BASE_URL}/assessments?resident_id=${TEST_RESIDENT_ID}`,
      method: 'GET'
    },
    {
      name: 'Get Staff Assignments by Resident ID',
      url: `${API_BASE_URL}/staff-assignments/by-resident/${TEST_RESIDENT_ID}`,
      method: 'GET'
    },
    {
      name: 'Get Activity Participations by Resident ID',
      url: `${API_BASE_URL}/activity-participations?resident_id=${TEST_RESIDENT_ID}`,
      method: 'GET'
    },
    {
      name: 'Get Bed Assignments by Resident ID',
      url: `${API_BASE_URL}/bed-assignments/by-resident?resident_id=${TEST_RESIDENT_ID}`,
      method: 'GET'
    }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const result = await makeRequest(endpoint.url, { method: endpoint.method });
      
      if (result.status === 200) {
        console.log(`   ✅ Success: ${result.status} (${result.responseTime}ms)`);
        console.log(`   📊 Data size: ${JSON.stringify(result.data).length} bytes`);
        
        if (Array.isArray(result.data)) {
          console.log(`   📋 Records: ${result.data.length}`);
        }
      } else {
        console.log(`   ⚠️  Status: ${result.status} (${result.responseTime}ms)`);
      }
      
      results.push({
        name: endpoint.name,
        success: result.status === 200,
        status: result.status,
        responseTime: result.responseTime,
        dataSize: JSON.stringify(result.data).length
      });
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.error} (${error.responseTime}ms)`);
      results.push({
        name: endpoint.name,
        success: false,
        error: error.error,
        responseTime: error.responseTime,
        code: error.code
      });
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Family API Test Summary:');
  console.log('='.repeat(60));
  
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
    
    // Performance analysis
    const slowRequests = successful.filter(r => r.responseTime > 3000);
    if (slowRequests.length > 0) {
      console.log(`\n🐌 Slow requests (>3s):`);
      slowRequests.forEach(r => {
        console.log(`   - ${r.name}: ${r.responseTime}ms`);
      });
    }
    
    const fastRequests = successful.filter(r => r.responseTime < 1000);
    if (fastRequests.length > 0) {
      console.log(`\n🚀 Fast requests (<1s):`);
      fastRequests.forEach(r => {
        console.log(`   - ${r.name}: ${r.responseTime}ms`);
      });
    }
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Requests:`);
    failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error} (${f.responseTime}ms)`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (failed.length > 0) {
    console.log('   - Check API endpoint availability');
    console.log('   - Verify authentication tokens');
    console.log('   - Review server logs for errors');
  }
  
  const slowRequests = results.filter(r => r.responseTime > 5000);
  if (slowRequests.length > 0) {
    console.log('   - Some endpoints are very slow (>5s)');
    console.log('   - Consider implementing caching');
    console.log('   - Optimize database queries');
  }
  
  const avgResponseTime = successful.length > 0 ? 
    successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length : 0;
  
  if (avgResponseTime > 2000) {
    console.log('   - Average response time is high (>2s)');
    console.log('   - Consider server-side optimizations');
  }
  
  if (successful.length === results.length && avgResponseTime < 1000) {
    console.log('   - All endpoints are performing well!');
  }
  
  console.log('\n🏁 Family API test completed!');
}

// Run the test
if (require.main === module) {
  console.log('⚠️  Note: Update TEST_FAMILY_MEMBER_ID and TEST_RESIDENT_ID with actual IDs before running');
  testFamilyEndpoints().catch(console.error);
}

module.exports = { testFamilyEndpoints };
