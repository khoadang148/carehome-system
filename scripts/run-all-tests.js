#!/usr/bin/env node

/**
 * Script để chạy tất cả tests và kiểm tra tình trạng hệ thống
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running All Tests...\n');

const tests = [
  {
    name: 'Messages API Test',
    command: 'npm run test:messages-api',
    description: 'Test messages API stability and error handling'
  },
  {
    name: 'Resident Registration Test', 
    command: 'npm run test:resident-registration',
    description: 'Test resident registration APIs and error isolation'
  },
  {
    name: 'Performance Test',
    command: 'npm run performance:test',
    description: 'Test overall application performance'
  }
];

async function runTest(test) {
  console.log(`\n🧪 Running ${test.name}...`);
  console.log(`   Description: ${test.description}`);
  console.log('   Command:', test.command);
  console.log('   ' + '='.repeat(50));
  
  try {
    const startTime = Date.now();
    execSync(test.command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    const endTime = Date.now();
    console.log(`\n✅ ${test.name} completed successfully in ${endTime - startTime}ms`);
  } catch (error) {
    console.log(`\n❌ ${test.name} failed:`);
    console.log(`   Exit code: ${error.status}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
  
  return true;
}

async function runAllTests() {
  console.log('📋 Test Plan:');
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} - ${test.description}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  const results = [];
  
  for (const test of tests) {
    const success = await runTest(test);
    results.push({ name: test.name, success });
    
    if (!success) {
      console.log(`\n⚠️  ${test.name} failed, but continuing with other tests...`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('   ' + '='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${index + 1}. ${result.name}: ${status}`);
  });
  
  console.log('   ' + '='.repeat(60));
  console.log(`   Total: ${successCount}/${totalCount} tests passed`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All tests passed! System is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy the application');
    console.log('   2. Test resident registration in production');
    console.log('   3. Monitor console for any errors');
    console.log('   4. Check that messages API failures don\'t affect other features');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend is running');
    console.log('   2. Check API endpoints are accessible');
    console.log('   3. Verify environment variables are set correctly');
    console.log('   4. Check network connectivity');
  }
  
  console.log('\n📚 For more information, see:');
  console.log('   - MESSAGES_API_TROUBLESHOOTING.md');
  console.log('   - Individual test scripts in scripts/ folder');
  
  process.exit(successCount === totalCount ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
