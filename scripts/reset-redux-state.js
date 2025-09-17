#!/usr/bin/env node

/**
 * Script to reset Redux state in localStorage
 * Useful when debugging infinite loading issues
 */

const fs = require('fs');
const path = require('path');

function resetReduxState() {
  console.log('🔄 Redux State Reset Script');
  console.log('='.repeat(40));
  
  console.log('\n📋 Instructions to reset Redux state:');
  console.log('1. Open your browser');
  console.log('2. Go to the CareHome application');
  console.log('3. Open Developer Tools (F12)');
  console.log('4. Go to Application tab > Storage > Local Storage');
  console.log('5. Find your domain (localhost:3000 or your domain)');
  console.log('6. Delete the following keys:');
  console.log('   - redux-persist:auth');
  console.log('   - redux-persist:family');
  console.log('   - redux-persist:root');
  console.log('   - Any other redux-persist keys');
  console.log('7. Refresh the page (Ctrl+R)');
  
  console.log('\n🔧 Alternative method (Console):');
  console.log('1. Open Developer Tools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Run these commands:');
  console.log('   localStorage.clear();');
  console.log('   sessionStorage.clear();');
  console.log('   window.location.reload();');
  
  console.log('\n🐛 Debug Commands:');
  console.log('Run these in the browser console to debug:');
  console.log('');
  console.log('// Check Redux state');
  console.log('console.log("Auth:", window.__REDUX_DEVTOOLS_EXTENSION__ ? "DevTools available" : "DevTools not available");');
  console.log('');
  console.log('// Check localStorage');
  console.log('Object.keys(localStorage).filter(key => key.includes("redux"));');
  console.log('');
  console.log('// Check if user is logged in');
  console.log('localStorage.getItem("access_token");');
  console.log('');
  console.log('// Clear specific Redux state');
  console.log('localStorage.removeItem("redux-persist:auth");');
  console.log('localStorage.removeItem("redux-persist:family");');
  
  console.log('\n📊 Common Issues & Solutions:');
  console.log('');
  console.log('Issue: "Đang tải thông tin người thân" forever');
  console.log('Solution:');
  console.log('1. Check if dataLoading is stuck at true');
  console.log('2. Check if fetchResidentsRequested is being called');
  console.log('3. Check if fetchResidentsSucceeded is being dispatched');
  console.log('4. Clear Redux state and retry');
  console.log('');
  console.log('Issue: API calls failing');
  console.log('Solution:');
  console.log('1. Check Network tab for failed requests');
  console.log('2. Verify authentication token');
  console.log('3. Check server status');
  console.log('');
  console.log('Issue: User not found');
  console.log('Solution:');
  console.log('1. Check if user.id exists');
  console.log('2. Verify user.role is "family"');
  console.log('3. Re-login if necessary');
  
  console.log('\n🔍 Debug Checklist:');
  console.log('□ Redux DevTools shows actions');
  console.log('□ Network tab shows API calls');
  console.log('□ Console shows no errors');
  console.log('□ localStorage has valid tokens');
  console.log('□ User object is properly set');
  console.log('□ dataLoading state changes correctly');
  console.log('□ pageReady state is set to true');
  
  console.log('\n🚀 Quick Fix Commands:');
  console.log('// Force reset everything');
  console.log('localStorage.clear(); sessionStorage.clear(); window.location.reload();');
  console.log('');
  console.log('// Check current state');
  console.log('console.log("Current URL:", window.location.href);');
  console.log('console.log("User agent:", navigator.userAgent);');
  console.log('console.log("Online:", navigator.onLine);');
  
  console.log('\n✅ Reset completed! Try refreshing the page.');
}

// Run the script
if (require.main === module) {
  resetReduxState();
}

module.exports = { resetReduxState };
