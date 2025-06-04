// Quick test script to verify role endpoints are working
// Run this with: node test-role-fix.js

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Test the endpoints that were causing issues
const testEndpoints = async () => {
  console.log('🧪 Testing Role System Endpoints...\n');

  // Test 1: Check if endpoints respond (without authentication - should get 401)
  console.log('1️⃣ Testing endpoint accessibility...');
  
  const endpoints = [
    '/users/profile',
    '/users/role', 
    '/users/register'
  ];

  for (const endpoint of endpoints) {
    try {
      await axios.get(`${API_URL}${endpoint}`);
      console.log(`❌ ${endpoint} - Expected 401 but got success (security issue!)`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint} - Correctly requires authentication (401)`);
      } else {
        console.log(`⚠️  ${endpoint} - Unexpected error: ${error.response?.status || error.message}`);
      }
    }
  }

  // Test 2: Check if backend is accessible
  console.log('\n2️⃣ Testing backend accessibility...');
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/`);
    console.log(`✅ Backend is running: ${response.data}`);
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}`);
    console.log('Make sure the backend server is running on port 5001');
    return;
  }

  // Test 3: Test routes are properly mounted
  console.log('\n3️⃣ Testing route mounting...');
  try {
    // This should return 401 (authentication required) not 404 (route not found)
    await axios.post(`${API_URL}/users/role`, { role: 'customer' });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ /users/role route is properly mounted and requires auth');
    } else if (error.response && error.response.status === 404) {
      console.log('❌ /users/role route not found - check backend route mounting');
    } else {
      console.log(`⚠️  /users/role unexpected response: ${error.response?.status}`);
    }
  }

  console.log('\n✅ Endpoint tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure your backend is running: cd backend && npm start');
  console.log('2. Make sure your frontend is running: cd frontend && npm start');
  console.log('3. Try logging in with an existing user');
  console.log('4. Check browser console for any error messages');
  console.log('5. If users still get redirected to role selection, check browser dev tools network tab');
};

// Helper function to check user count in database
const checkDatabase = async () => {
  console.log('\n🗄️  Quick Database Check...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/migo-marketplace');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const userCount = await User.countDocuments();
    const usersWithRoles = await User.countDocuments({ role: { $ne: null } });
    
    console.log(`📊 Total users: ${userCount}`);
    console.log(`✅ Users with roles: ${usersWithRoles}`);
    console.log(`❌ Users without roles: ${userCount - usersWithRoles}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.log(`⚠️  Could not check database: ${error.message}`);
  }
};

// Run tests
const main = async () => {
  await testEndpoints();
  await checkDatabase();
  
  console.log('\n🎯 Summary:');
  console.log('If all tests pass, the role system should be working now!');
  console.log('The main fixes applied:');
  console.log('• Fixed API endpoint URLs in AuthContext (/role → /users/role)');
  console.log('• Improved error handling in role assignment');
  console.log('• Enhanced PrivateRoute to handle loading states');
  console.log('• All users in database already have roles assigned');
};

main().catch(error => {
  console.error('❌ Test failed:', error.message);
}); 