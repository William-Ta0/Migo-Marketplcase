// Review System Testing Script
// Run this with: node test-review-system.js

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Test data - replace with actual IDs from your database
const testData = {
  customerToken: 'YOUR_CUSTOMER_JWT_TOKEN', // Get from localStorage after login
  vendorToken: 'YOUR_VENDOR_JWT_TOKEN',     // Get from localStorage after vendor login
  jobId: 'YOUR_COMPLETED_JOB_ID',           // A job with status 'completed' or 'closed'
  vendorId: 'YOUR_VENDOR_USER_ID',
  serviceId: 'YOUR_SERVICE_ID',
  customerId: 'YOUR_CUSTOMER_USER_ID'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint}:`, response.status, response.data.message || 'Success');
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.response?.status, error.response?.data?.message || error.message);
    return null;
  }
};

// Test cases
const runTests = async () => {
  console.log('🧪 Starting Review System Tests...\n');

  // 1. Test Review Creation (Customer only, after job completion)
  console.log('1️⃣ Testing Review Creation...');
  const reviewData = {
    jobId: testData.jobId,
    ratings: {
      overall: 5,
      quality: 5,
      communication: 4,
      punctuality: 5,
      professionalism: 5,
      value: 4
    },
    title: 'Excellent service!',
    comment: 'The vendor was professional, on time, and delivered exactly what was promised. Highly recommend!',
    isRecommended: true,
    wouldHireAgain: true,
    completedOnTime: true,
    matchedDescription: true
  };

  const createdReview = await makeRequest('POST', '/reviews', reviewData, testData.customerToken);
  const reviewId = createdReview?.review?._id;

  // 2. Test Vendor Reviews Retrieval (Public)
  console.log('\n2️⃣ Testing Vendor Reviews Retrieval...');
  await makeRequest('GET', `/reviews/vendor/${testData.vendorId}?page=1&limit=5&sort=newest`);
  await makeRequest('GET', `/reviews/vendor/${testData.vendorId}?sort=highest_rating`);
  await makeRequest('GET', `/reviews/vendor/${testData.vendorId}?sort=most_helpful`);

  // 3. Test Service Reviews Retrieval (Public)
  console.log('\n3️⃣ Testing Service Reviews Retrieval...');
  await makeRequest('GET', `/reviews/service/${testData.serviceId}?page=1&limit=5`);

  // 4. Test Job Review Retrieval (Private)
  console.log('\n4️⃣ Testing Job Review Retrieval...');
  await makeRequest('GET', `/reviews/job/${testData.jobId}`, null, testData.customerToken);
  await makeRequest('GET', `/reviews/job/${testData.jobId}`, null, testData.vendorToken);

  // 5. Test Vendor Review Stats (Public)
  console.log('\n5️⃣ Testing Vendor Review Statistics...');
  await makeRequest('GET', `/reviews/vendor/${testData.vendorId}/stats`);

  if (reviewId) {
    // 6. Test Mark Review as Helpful (Authenticated)
    console.log('\n6️⃣ Testing Mark Review as Helpful...');
    await makeRequest('POST', `/reviews/${reviewId}/helpful`, {}, testData.vendorToken);

    // 7. Test Vendor Response (Vendor only)
    console.log('\n7️⃣ Testing Vendor Response...');
    const responseData = {
      comment: 'Thank you so much for the wonderful review! It was a pleasure working with you.',
      isPublic: true
    };
    await makeRequest('POST', `/reviews/${reviewId}/response`, responseData, testData.vendorToken);

    // 8. Test Review Update (Review author only)
    console.log('\n8️⃣ Testing Review Update...');
    const updateData = {
      title: 'Outstanding service!',
      comment: 'Updated: The vendor exceeded all expectations. Truly outstanding work!',
      editReason: 'Added more details about the experience'
    };
    await makeRequest('PUT', `/reviews/${reviewId}`, updateData, testData.customerToken);
  }

  console.log('\n✅ All tests completed!');
};

// Error case tests
const runErrorTests = async () => {
  console.log('\n🚨 Testing Error Cases...\n');

  // Test unauthorized review creation
  console.log('1️⃣ Testing Unauthorized Review Creation...');
  const invalidReviewData = {
    jobId: testData.jobId,
    ratings: { overall: 5, quality: 5, communication: 5, punctuality: 5, professionalism: 5, value: 5 },
    title: 'Test',
    comment: 'Test comment'
  };
  await makeRequest('POST', '/reviews', invalidReviewData); // No token

  // Test invalid ratings
  console.log('\n2️⃣ Testing Invalid Ratings...');
  const invalidRatingData = {
    ...invalidReviewData,
    ratings: { overall: 6, quality: 0 } // Invalid rating values
  };
  await makeRequest('POST', '/reviews', invalidRatingData, testData.customerToken);

  // Test duplicate review
  console.log('\n3️⃣ Testing Duplicate Review Prevention...');
  await makeRequest('POST', '/reviews', invalidReviewData, testData.customerToken);

  // Test non-existent vendor
  console.log('\n4️⃣ Testing Non-existent Vendor...');
  await makeRequest('GET', '/reviews/vendor/nonexistentid123');

  console.log('\n✅ Error tests completed!');
};

// Instructions for manual testing
const printManualTestingInstructions = () => {
  console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

🔧 SETUP REQUIRED:
1. Update testData object above with real IDs from your database
2. Get JWT tokens by logging in as customer and vendor in browser
3. Create a completed job between a customer and vendor
4. Ensure the job has status 'completed' or 'closed'

💻 TO GET JWT TOKENS:
1. Open browser DevTools (F12)
2. Login as customer -> Go to Application/Storage -> localStorage -> copy 'token' value
3. Login as vendor -> Copy 'token' value for vendor
4. Paste these tokens in the testData object above

🧪 FRONTEND TESTING:
1. Login as customer who completed a job
2. Navigate to job details page
3. Look for "Write Review" button (if integrated)
4. Test the ReviewSubmissionForm component
5. Login as vendor and test vendor response functionality

🎯 INTEGRATION TESTING:
1. Complete a full job workflow (create job -> accept -> complete)
2. Test review submission after job completion
3. Verify ratings update on vendor profile
4. Test review display on vendor profile page

⚠️  EDGE CASES TO TEST:
- Review submission on non-completed jobs (should fail)
- Multiple review submissions for same job (should fail)
- Vendor responding to own review (should fail)
- Customer marking own review as helpful (should fail)
- Review submission without all required ratings (should fail)
  `);
};

// Run the tests
if (require.main === module) {
  console.log('🧪 Review System Testing Suite\n');
  console.log('📝 Note: Update testData object with real IDs before running!\n');
  
  printManualTestingInstructions();
  
  // Uncomment below lines after updating testData
  // runTests().then(() => runErrorTests());
}

module.exports = { runTests, runErrorTests }; 