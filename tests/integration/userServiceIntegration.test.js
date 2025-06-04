const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../backend/models/User');
const Service = require('../../backend/models/Service');
const Job = require('../../backend/models/Job');

// Mock Firebase Admin
jest.mock('../../backend/config/firebaseAdmin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-firebase-uid',
      email: 'test@example.com',
    }),
  }),
}));

// Create Express app for testing
const express = require('express');
const cors = require('cors');
const userRoutes = require('../../backend/routes/userRoutes');
const serviceRoutes = require('../../backend/routes/serviceRoutes');
const jobRoutes = require('../../backend/routes/jobRoutes');

const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { uid: 'test-firebase-uid' };
    next();
  });
  
  app.use('/api/users', userRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/jobs', jobRoutes);
  
  return app;
};

describe('User-Service Integration Tests', () => {
  let app;
  let testCustomer;
  let testVendor;
  let testService;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Service.deleteMany({});
    await Job.deleteMany({});
  });

  describe('Complete User Journey', () => {
    test('should complete full customer journey: register -> find service -> book job', async () => {
      // Step 1: Register a vendor
      const vendorData = testUtils.createMockVendor();
      const vendorResponse = await request(app)
        .post('/api/users')
        .send(vendorData)
        .expect(201);

      expect(vendorResponse.body.role).toBe('vendor');
      testVendor = vendorResponse.body;

      // Step 2: Vendor creates a service
      const serviceData = testUtils.createMockService(testVendor._id);
      const serviceResponse = await request(app)
        .post('/api/services')
        .send(serviceData)
        .expect(201);

      expect(serviceResponse.body.title).toBe(serviceData.title);
      testService = serviceResponse.body;

      // Step 3: Register a customer
      const customerData = testUtils.createMockUser({
        firebaseUid: 'customer-firebase-uid',
        email: 'customer@example.com',
        role: 'customer'
      });

      // Mock auth middleware for customer
      app.use((req, res, next) => {
        req.user = { uid: 'customer-firebase-uid' };
        next();
      });

      const customerResponse = await request(app)
        .post('/api/users')
        .send(customerData)
        .expect(201);

      expect(customerResponse.body.role).toBe('customer');
      testCustomer = customerResponse.body;

      // Step 4: Customer searches for services
      const searchResponse = await request(app)
        .get('/api/services/search')
        .query({ q: 'web development' })
        .expect(200);

      expect(searchResponse.body.services).toHaveLength(1);
      expect(searchResponse.body.services[0]._id).toBe(testService._id);

      // Step 5: Customer books the service
      const jobData = testUtils.createMockJob(
        testCustomer._id,
        testVendor._id,
        testService._id
      );

      const jobResponse = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(201);

      expect(jobResponse.body.customer.toString()).toBe(testCustomer._id);
      expect(jobResponse.body.vendor.toString()).toBe(testVendor._id);
      expect(jobResponse.body.service.toString()).toBe(testService._id);
      expect(jobResponse.body.status).toBe('pending');
    });

    test('should handle vendor workflow: register -> onboard -> create service -> manage jobs', async () => {
      // Step 1: Register vendor
      const vendorData = testUtils.createMockUser({
        role: 'vendor',
        firebaseUid: 'vendor-firebase-uid',
        email: 'vendor@example.com'
      });

      const vendorResponse = await request(app)
        .post('/api/users')
        .send(vendorData)
        .expect(201);

      testVendor = vendorResponse.body;

      // Step 2: Complete vendor onboarding
      const onboardingData = {
        vendorInfo: {
          skills: [{
            category: 'Technology',
            subcategories: ['Web Development', 'Mobile Apps'],
            experienceLevel: 'expert'
          }],
          verification: {
            status: 'submitted',
            idDocument: 'id-document-url',
            businessLicense: 'license-url'
          },
          onboardingCompleted: true
        }
      };

      const onboardingResponse = await request(app)
        .put('/api/users/profile')
        .send(onboardingData)
        .expect(200);

      expect(onboardingResponse.body.vendorInfo.onboardingCompleted).toBe(true);

      // Step 3: Create multiple services
      const service1Data = testUtils.createMockService(testVendor._id, {
        title: 'Web Development Service',
        category: { name: 'Technology', slug: 'technology' }
      });

      const service2Data = testUtils.createMockService(testVendor._id, {
        title: 'Mobile App Development',
        category: { name: 'Technology', slug: 'technology' }
      });

      const service1Response = await request(app)
        .post('/api/services')
        .send(service1Data)
        .expect(201);

      const service2Response = await request(app)
        .post('/api/services')
        .send(service2Data)
        .expect(201);

      // Step 4: Get vendor's services
      const vendorServicesResponse = await request(app)
        .get(`/api/services/vendor/${testVendor._id}`)
        .expect(200);

      expect(vendorServicesResponse.body.services).toHaveLength(2);

      // Step 5: Receive job requests
      const customer = await User.create(testUtils.createMockUser({
        firebaseUid: 'customer-uid',
        email: 'customer@test.com',
        role: 'customer'
      }));

      const jobData = testUtils.createMockJob(
        customer._id,
        testVendor._id,
        service1Response.body._id
      );

      const jobResponse = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(201);

      // Step 6: Vendor views and manages jobs
      const vendorJobsResponse = await request(app)
        .get(`/api/jobs/vendor/${testVendor._id}`)
        .expect(200);

      expect(vendorJobsResponse.body.jobs).toHaveLength(1);
      expect(vendorJobsResponse.body.jobs[0].status).toBe('pending');
    });
  });

  describe('Service Discovery and Booking Flow', () => {
    beforeEach(async () => {
      // Create test vendor and service
      testVendor = await User.create(testUtils.createMockVendor());
      testService = await Service.create(testUtils.createMockService(testVendor._id));
      testCustomer = await User.create(testUtils.createMockUser({
        firebaseUid: 'customer-uid',
        role: 'customer'
      }));
    });

    test('should allow customers to discover services by category', async () => {
      // Create services in different categories
      const techService = await Service.create(testUtils.createMockService(testVendor._id, {
        title: 'Web Development',
        category: { name: 'Technology', slug: 'technology' }
      }));

      const designService = await Service.create(testUtils.createMockService(testVendor._id, {
        title: 'Logo Design',
        category: { name: 'Design', slug: 'design' }
      }));

      // Search by category
      const techResponse = await request(app)
        .get('/api/services/category/technology')
        .expect(200);

      expect(techResponse.body.services).toHaveLength(2); // Including the one from beforeEach
      expect(techResponse.body.services.every(s => s.category.slug === 'technology')).toBe(true);
    });

    test('should handle service booking with different pricing types', async () => {
      // Test fixed pricing
      const fixedPriceService = await Service.create(testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'fixed',
          amount: 100,
          currency: 'USD'
        }
      }));

      const fixedPriceJob = await request(app)
        .post('/api/jobs')
        .send(testUtils.createMockJob(testCustomer._id, testVendor._id, fixedPriceService._id))
        .expect(201);

      expect(fixedPriceJob.body.pricing.type).toBe('fixed');
      expect(fixedPriceJob.body.pricing.amount).toBe(100);

      // Test package pricing
      const packageService = await Service.create(testUtils.createMockService(testVendor._id, {
        pricing: {
          type: 'package',
          packages: [{
            name: 'Basic',
            price: 50,
            features: ['Feature 1'],
            deliveryTime: 7
          }]
        }
      }));

      const packageJob = await request(app)
        .post('/api/jobs')
        .send({
          ...testUtils.createMockJob(testCustomer._id, testVendor._id, packageService._id),
          selectedPackage: {
            name: 'Basic',
            price: 50
          }
        })
        .expect(201);

      expect(packageJob.body.selectedPackage.name).toBe('Basic');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid service booking requests', async () => {
      testVendor = await User.create(testUtils.createMockVendor());
      testService = await Service.create(testUtils.createMockService(testVendor._id));

      // Try to book without customer authentication
      app.use((req, res, next) => {
        req.user = null;
        next();
      });

      const jobData = testUtils.createMockJob('invalid-customer-id', testVendor._id, testService._id);
      
      await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);
    });

    test('should handle concurrent booking requests', async () => {
      testVendor = await User.create(testUtils.createMockVendor());
      testService = await Service.create(testUtils.createMockService(testVendor._id));
      
      const customer1 = await User.create(testUtils.createMockUser({
        firebaseUid: 'customer1-uid',
        email: 'customer1@test.com'
      }));

      const customer2 = await User.create(testUtils.createMockUser({
        firebaseUid: 'customer2-uid',
        email: 'customer2@test.com'
      }));

      // Simulate concurrent booking requests
      const job1Promise = request(app)
        .post('/api/jobs')
        .send(testUtils.createMockJob(customer1._id, testVendor._id, testService._id));

      const job2Promise = request(app)
        .post('/api/jobs')
        .send(testUtils.createMockJob(customer2._id, testVendor._id, testService._id));

      const [job1Response, job2Response] = await Promise.all([job1Promise, job2Promise]);

      // Both should succeed as the same service can handle multiple bookings
      expect(job1Response.status).toBe(201);
      expect(job2Response.status).toBe(201);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across related documents', async () => {
      // Create vendor and service
      testVendor = await User.create(testUtils.createMockVendor());
      testService = await Service.create(testUtils.createMockService(testVendor._id));
      testCustomer = await User.create(testUtils.createMockUser({
        firebaseUid: 'customer-uid',
        role: 'customer'
      }));

      // Create a job
      const jobResponse = await request(app)
        .post('/api/jobs')
        .send(testUtils.createMockJob(testCustomer._id, testVendor._id, testService._id))
        .expect(201);

      const jobId = jobResponse.body._id;

      // Update job status
      await request(app)
        .put(`/api/jobs/${jobId}/status`)
        .send({ status: 'accepted' })
        .expect(200);

      // Verify the job status was updated
      const updatedJob = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(200);

      expect(updatedJob.body.status).toBe('accepted');

      // Complete the job
      await request(app)
        .put(`/api/jobs/${jobId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      // Verify vendor stats are updated
      const vendorProfile = await request(app)
        .get(`/api/users/vendor/${testVendor._id}`)
        .expect(200);

      expect(vendorProfile.body.vendorInfo.completedJobs).toBe(1);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async () => {
      // Create multiple vendors and services
      const vendors = [];
      const services = [];

      for (let i = 0; i < 10; i++) {
        const vendor = await User.create(testUtils.createMockVendor({
          firebaseUid: `vendor-${i}`,
          email: `vendor${i}@test.com`
        }));
        vendors.push(vendor);

        for (let j = 0; j < 5; j++) {
          const service = await Service.create(testUtils.createMockService(vendor._id, {
            title: `Service ${i}-${j}`,
            tags: [`tag${i}`, `tag${j}`]
          }));
          services.push(service);
        }
      }

      // Test search performance
      const startTime = Date.now();
      const searchResponse = await request(app)
        .get('/api/services/search')
        .query({ q: 'Service' })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(searchResponse.body.services.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
}); 