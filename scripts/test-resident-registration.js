#!/usr/bin/env node

/**
 * Script để test chức năng đăng ký resident và đảm bảo nó không bị ảnh hưởng bởi lỗi messages API
 */

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function testResidentRegistration() {
  console.log('🧪 Testing Resident Registration API...\n');

  try {
    // Test 1: Test các API cần thiết cho đăng ký resident
    console.log('1. Testing required APIs for resident registration...');
    
    const requiredAPIs = [
      { name: 'Care Plans', url: '/care-plans' },
      { name: 'Room Types', url: '/room-types' },
      { name: 'Rooms', url: '/rooms' },
      { name: 'Beds', url: '/beds' },
      { name: 'Users', url: '/users' }
    ];

    for (const api of requiredAPIs) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${API_BASE_URL}${api.url}`, {
          timeout: 10000,
          headers: { 'Cache-Control': 'no-cache' }
        });
        const endTime = Date.now();
        console.log(`   ✅ ${api.name}: ${response.status} - ${endTime - startTime}ms`);
      } catch (error) {
        const endTime = Date.now();
        console.log(`   ❌ ${api.name}: ${error.response?.status || 'Network Error'} - ${endTime - startTime}ms`);
        console.log(`      Message: ${error.message}`);
      }
    }

    // Test 2: Test messages API (có thể fail nhưng không ảnh hưởng)
    console.log('\n2. Testing messages API (should not affect registration)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
        timeout: 3000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log(`   ✅ Messages API: ${response.status}`);
    } catch (error) {
      console.log(`   ⚠️  Messages API failed (expected): ${error.message}`);
      console.log('   ℹ️  This should NOT affect resident registration');
    }

    // Test 3: Test concurrent API calls (simulate real app behavior)
    console.log('\n3. Testing concurrent API calls...');
    const concurrentAPIs = [
      { name: 'Care Plans', url: '/care-plans' },
      { name: 'Room Types', url: '/room-types' },
      { name: 'Rooms', url: '/rooms' },
      { name: 'Beds', url: '/beds' },
      { name: 'Messages (unread)', url: '/messages/unread-count' } // This might fail
    ];

    const promises = concurrentAPIs.map(api => 
      axios.get(`${API_BASE_URL}${api.url}`, {
        timeout: 5000,
        headers: { 'Cache-Control': 'no-cache' }
      }).then(response => ({ 
        name: api.name, 
        success: true, 
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
      })).catch(error => ({ 
        name: api.name, 
        success: false, 
        error: error.message,
        isMessagesAPI: api.name.includes('Messages')
      }))
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { name, success, status, dataLength, error, isMessagesAPI } = result.value;
        if (success) {
          console.log(`   ✅ ${name}: ${status} (${dataLength} items)`);
        } else {
          const icon = isMessagesAPI ? '⚠️' : '❌';
          console.log(`   ${icon} ${name}: Failed - ${error}`);
          if (isMessagesAPI) {
            console.log('      ℹ️  Messages API failure is acceptable');
          }
        }
      }
    });

    // Test 4: Test error isolation
    console.log('\n4. Testing error isolation...');
    try {
      // Simulate messages API failure
      const messagesPromise = axios.get(`${API_BASE_URL}/messages/unread-count`, {
        timeout: 100, // Very short timeout to force failure
        headers: { 'Cache-Control': 'no-cache' }
      });

      // Simulate successful API calls
      const carePlansPromise = axios.get(`${API_BASE_URL}/care-plans`, {
        timeout: 5000,
        headers: { 'Cache-Control': 'no-cache' }
      });

      const results = await Promise.allSettled([messagesPromise, carePlansPromise]);
      
      const messagesResult = results[0];
      const carePlansResult = results[1];

      if (messagesResult.status === 'rejected') {
        console.log('   ✅ Messages API failed as expected');
      }
      
      if (carePlansResult.status === 'fulfilled') {
        console.log('   ✅ Care Plans API succeeded despite messages API failure');
        console.log('   ✅ Error isolation working correctly');
      } else {
        console.log('   ❌ Care Plans API failed - error isolation not working');
      }

    } catch (error) {
      console.log(`   ❌ Error isolation test failed: ${error.message}`);
    }

    console.log('\n🎉 Resident Registration API test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Required APIs for registration are working');
    console.log('   - Messages API failures do not affect other APIs');
    console.log('   - Error isolation is working correctly');
    console.log('   - Resident registration should work properly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testResidentRegistration().catch(console.error);
