#!/usr/bin/env node

/**
 * Test script for staff assignments API
 * This script tests the staff assignments endpoints to debug issues
 */

const axios = require('axios');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Mock token for testing (replace with actual token)
const TEST_TOKEN = 'your-test-token-here';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  },
  timeout: 10000
});

async function testStaffAssignments() {
  console.log('🔍 Testing Staff Assignments API...\n');

  try {
    // Test 1: Get all staff assignments
    console.log('1. Testing GET /staff-assignments');
    try {
      const response = await apiClient.get('/staff-assignments');
      console.log('✅ Success:', response.status);
      console.log('📊 Data length:', response.data?.length || 0);
      console.log('📋 Sample data:', JSON.stringify(response.data?.[0] || {}, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
      console.log('📝 Error details:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get all staff assignments including expired
    console.log('2. Testing GET /staff-assignments/all-including-expired');
    try {
      const response = await apiClient.get('/staff-assignments/all-including-expired');
      console.log('✅ Success:', response.status);
      console.log('📊 Data length:', response.data?.length || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
      console.log('📝 Error details:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test with specific resident ID (if you have one)
    const testResidentId = '507f1f77bcf86cd799439011'; // Replace with actual resident ID
    console.log(`3. Testing with resident ID: ${testResidentId}`);
    
    try {
      const response = await apiClient.get('/staff-assignments');
      const allAssignments = response.data;
      
      if (Array.isArray(allAssignments)) {
        const residentAssignments = allAssignments.filter(assignment => {
          const assignmentResidentId = assignment.resident_id?._id || assignment.resident_id;
          return assignmentResidentId === testResidentId;
        });
        
        console.log('✅ Filtered assignments for resident:', residentAssignments.length);
        console.log('📋 Assignments:', JSON.stringify(residentAssignments, null, 2));
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test staff details endpoint
    console.log('4. Testing staff details endpoint');
    const testStaffId = '507f1f77bcf86cd799439012'; // Replace with actual staff ID
    try {
      const response = await apiClient.get(`/users/${testStaffId}`);
      console.log('✅ Staff details success:', response.status);
      console.log('👤 Staff info:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

async function testWithRealData() {
  console.log('🔍 Testing with real authentication...\n');
  
  // You can modify this to use real login credentials
  const testCredentials = {
    email: 'test@example.com',
    password: 'testpassword'
  };

  try {
    // Login to get real token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    const token = loginResponse.data.access_token;
    
    console.log('✅ Login successful');
    
    // Create authenticated client
    const authClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    // Test staff assignments with real token
    console.log('\n2. Testing staff assignments with real token...');
    const response = await authClient.get('/staff-assignments');
    console.log('✅ Staff assignments:', response.data?.length || 0, 'items');
    
    // Show structure of first assignment
    if (response.data?.[0]) {
      console.log('📋 Assignment structure:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }

  } catch (error) {
    console.log('❌ Login or API error:', error.response?.status, error.response?.statusText);
    console.log('📝 Error details:', error.response?.data);
  }
}

// Main execution
async function main() {
  console.log('🚀 Staff Assignments API Test Script\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  if (process.argv.includes('--real')) {
    await testWithRealData();
  } else {
    await testStaffAssignments();
  }

  console.log('\n✨ Test completed!');
  console.log('\n💡 Tips:');
  console.log('- Use --real flag to test with real authentication');
  console.log('- Update TEST_TOKEN with a valid JWT token');
  console.log('- Update testResidentId and testStaffId with real IDs');
}

main().catch(console.error);
