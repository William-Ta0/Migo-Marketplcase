const mongoose = require('mongoose');
const User = require('../../../backend/models/User');

describe('User Model', () => {
  // Helper function to check if we should skip database tests
  const skipIfNoConnection = () => {
    if (!testUtils.isDbConnected()) {
      console.warn('⏭️  Skipping test - no database connection');
      return true;
    }
    return false;
  };

  afterEach(async () => {
    // Only clean up if connected
    if (testUtils.isDbConnected()) {
      try {
        await User.deleteMany({});
      } catch (error) {
        console.warn('⚠️  Error cleaning up test data:', error.message);
      }
    }
  });

  describe('Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firebaseUid).toBe(userData.firebaseUid);
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.authProvider).toBe(userData.authProvider);
      expect(savedUser.role).toBe(userData.role);
    });

    test('should fail to create user without required fields', async () => {
      if (skipIfNoConnection()) return;

      const user = new User({});
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.firebaseUid).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.authProvider).toBeDefined();
    });

    test('should enforce unique firebaseUid', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      await User.create(userData);
      
      const duplicateUser = new User(userData);
      let error;
      
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should enforce unique email', async () => {
      if (skipIfNoConnection()) return;

      const userData1 = testUtils.createMockUser();
      const userData2 = testUtils.createMockUser({
        firebaseUid: 'different-uid',
        email: userData1.email
      });
      
      await User.create(userData1);
      
      let error;
      try {
        await User.create(userData2);
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });

    test('should validate authProvider enum values', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser({
        authProvider: 'invalid-provider'
      });
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.authProvider).toBeDefined();
    });

    test('should validate role enum values', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser({
        role: 'invalid-role'
      });
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test('should enforce bio maxlength', async () => {
      if (skipIfNoConnection()) return;

      const longBio = 'a'.repeat(501);
      const userData = testUtils.createMockUser({ bio: longBio });
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.bio).toBeDefined();
    });
  });

  describe('Vendor Info Validation', () => {
    test('should create user with valid vendor info', async () => {
      if (skipIfNoConnection()) return;

      const vendorData = testUtils.createMockVendor();
      const user = new User(vendorData);
      const savedUser = await user.save();

      expect(savedUser.vendorInfo).toBeDefined();
      expect(savedUser.vendorInfo.skills).toHaveLength(1);
      expect(savedUser.vendorInfo.verification.status).toBe('verified');
      expect(savedUser.vendorInfo.onboardingCompleted).toBe(true);
      expect(savedUser.vendorInfo.rating.average).toBe(4.5);
      expect(savedUser.vendorInfo.rating.count).toBe(10);
    });

    test('should validate vendor skill experience levels', async () => {
      if (skipIfNoConnection()) return;

      const vendorData = testUtils.createMockVendor({
        vendorInfo: {
          skills: [{
            category: 'Technology',
            subcategories: ['Web Development'],
            experienceLevel: 'invalid-level'
          }]
        }
      });
      
      const user = new User(vendorData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should validate vendor verification status', async () => {
      if (skipIfNoConnection()) return;

      const vendorData = testUtils.createMockVendor({
        vendorInfo: {
          verification: {
            status: 'invalid-status'
          }
        }
      });
      
      const user = new User(vendorData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });
  });

  describe('Default Values', () => {
    test('should set default values for optional fields', async () => {
      if (skipIfNoConnection()) return;

      const userData = {
        firebaseUid: 'test-uid',
        name: 'Test User',
        email: 'test@example.com',
        authProvider: 'email'
      };
      
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.phoneNumber).toBe('');
      expect(savedUser.address.street).toBe('');
      expect(savedUser.address.city).toBe('');
      expect(savedUser.avatar).toBe('');
      expect(savedUser.bio).toBe('');
      expect(savedUser.role).toBeNull();
      expect(savedUser.vendorInfo.onboardingCompleted).toBe(false);
      expect(savedUser.vendorInfo.rating.average).toBe(0);
      expect(savedUser.vendorInfo.rating.count).toBe(0);
      expect(savedUser.vendorInfo.responseRate).toBe(0);
      expect(savedUser.vendorInfo.completedJobs).toBe(0);
    });
  });

  describe('Timestamps', () => {
    test('should automatically add timestamps', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      const user = await User.create(userData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      user.name = 'Updated Name';
      const updatedUser = await user.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Address Schema', () => {
    test('should properly store address information', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser({
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      });
      
      const user = await User.create(userData);

      expect(user.address.street).toBe('123 Main St');
      expect(user.address.city).toBe('Test City');
      expect(user.address.state).toBe('Test State');
      expect(user.address.zipCode).toBe('12345');
      expect(user.address.country).toBe('Test Country');
    });
  });

  describe('Vendor Rating System', () => {
    test('should handle rating updates correctly', async () => {
      if (skipIfNoConnection()) return;

      const vendorData = testUtils.createMockVendor({
        vendorInfo: {
          rating: {
            average: 4.2,
            count: 15
          }
        }
      });
      
      const vendor = await User.create(vendorData);

      expect(vendor.vendorInfo.rating.average).toBe(4.2);
      expect(vendor.vendorInfo.rating.count).toBe(15);
    });
  });

  describe('Query Methods', () => {
    test('should find user by firebaseUid', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      await User.create(userData);

      const foundUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(foundUser).toBeDefined();
      expect(foundUser.firebaseUid).toBe(userData.firebaseUid);
    });

    test('should find user by email', async () => {
      if (skipIfNoConnection()) return;

      const userData = testUtils.createMockUser();
      await User.create(userData);

      const foundUser = await User.findOne({ email: userData.email });
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
    });

    test('should find vendors by role', async () => {
      if (skipIfNoConnection()) return;

      await User.create(testUtils.createMockUser({ role: 'customer' }));
      await User.create(testUtils.createMockVendor({ role: 'vendor' }));

      const vendors = await User.find({ role: 'vendor' });
      expect(vendors).toHaveLength(1);
      expect(vendors[0].role).toBe('vendor');
    });
  });
}); 