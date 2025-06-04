const userController = require('../../../backend/controllers/userController');
const User = require('../../../backend/models/User');
const mongoose = require('mongoose');
const baseURL = 'http://localhost:5001/api';

// Mock Firebase Admin
jest.mock('../../../backend/config/firebaseAdmin', () => ({
  auth: () => ({
    deleteUser: jest.fn().mockResolvedValue(),
  }),
}));

// Helper to check if database is available
function isDatabaseAvailable() {
  return mongoose.connection.readyState === 1;
}

// Helper to skip test if database is not available
function skipIfNoDB(testName, testFn) {
  return isDatabaseAvailable() 
    ? test(testName, testFn) 
    : test.skip(`${testName} (Skipped - No DB)`, testFn);
}

describe('User Controller', () => {
  afterEach(async () => {
    if (isDatabaseAvailable()) {
      await User.deleteMany({});
    }
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    skipIfNoDB('should register a new user successfully', async () => {
      const userData = testUtils.createMockUser();
      const req = testUtils.mockReq({
        body: userData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        firebaseUid: userData.firebaseUid,
        name: userData.name,
        email: userData.email
      }));

      const savedUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(savedUser).toBeDefined();
    });

    skipIfNoDB('should reject registration with mismatched firebaseUid', async () => {
      const userData = testUtils.createMockUser();
      const req = testUtils.mockReq({
        body: userData,
        user: { uid: 'different-uid' }
      });
      const res = testUtils.mockRes();

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    skipIfNoDB('should reject registration for existing user', async () => {
      const userData = testUtils.createMockUser();
      await User.create(userData);

      const req = testUtils.mockReq({
        body: userData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    test('should handle database errors gracefully', async () => {
      if (!isDatabaseAvailable()) {
        console.log('Skipping database error test - no database connection');
        return;
      }
      
      const userData = testUtils.createMockUser();
      const req = testUtils.mockReq({
        body: userData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      // Mock User.save to throw an error
      const mockSave = jest.spyOn(User.prototype, 'save').mockRejectedValue(new Error('Database error'));

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error registering user' });

      mockSave.mockRestore();
    });
  });

  describe('getUserProfile', () => {
    test('should return user profile successfully', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        firebaseUid: userData.firebaseUid,
        name: userData.name,
        email: userData.email
      }));
    });

    test('should return 404 for non-existent user', async () => {
      const req = testUtils.mockReq({
        user: { uid: 'non-existent-uid' }
      });
      const res = testUtils.mockRes();

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('should handle database errors gracefully', async () => {
      const req = testUtils.mockReq({
        user: { uid: 'test-uid' }
      });
      const res = testUtils.mockRes();

      // Mock User.findOne to throw an error
      const mockFindOne = jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching user profile' });

      mockFindOne.mockRestore();
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const updateData = {
        name: 'Updated Name',
        phoneNumber: '1234567890',
        bio: 'Updated bio',
        address: {
          street: '123 Updated St',
          city: 'Updated City',
          state: 'Updated State',
          zipCode: '12345',
          country: 'Updated Country'
        }
      };

      const req = testUtils.mockReq({
        body: updateData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Name',
        phoneNumber: '1234567890',
        bio: 'Updated bio'
      }));

      const updatedUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.address.street).toBe('123 Updated St');
    });

    test('should handle partial updates', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const updateData = {
        name: 'Partially Updated Name'
        // Only updating name, other fields should remain unchanged
      };

      const req = testUtils.mockReq({
        body: updateData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Partially Updated Name',
        email: userData.email // Should remain unchanged
      }));
    });

    test('should return 404 for non-existent user', async () => {
      const req = testUtils.mockReq({
        body: { name: 'Updated Name' },
        user: { uid: 'non-existent-uid' }
      });
      const res = testUtils.mockRes();

      await userController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserRole', () => {
    test('should update user role successfully', async () => {
      const userData = testUtils.createMockUser({ role: 'customer' });
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        body: { role: 'vendor' },
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        role: 'vendor'
      }));

      const updatedUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(updatedUser.role).toBe('vendor');
    });

    test('should reject invalid role', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        body: { role: 'invalid-role' },
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role' });
    });

    test('should return 404 for non-existent user', async () => {
      const req = testUtils.mockReq({
        body: { role: 'vendor' },
        user: { uid: 'non-existent-uid' }
      });
      const res = testUtils.mockRes();

      await userController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('should accept all valid roles', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const validRoles = ['customer', 'vendor', 'admin'];

      for (const role of validRoles) {
        const req = testUtils.mockReq({
          body: { role },
          user: { uid: userData.firebaseUid }
        });
        const res = testUtils.mockRes();

        await userController.updateUserRole(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          role: role
        }));
      }
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.deleteUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'User account deleted successfully'
      });

      const deletedUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(deletedUser).toBeNull();
    });

    test('should return 404 for non-existent user', async () => {
      const req = testUtils.mockReq({
        user: { uid: 'non-existent-uid' }
      });
      const res = testUtils.mockRes();

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('should handle Firebase deletion errors', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      // Mock Firebase Admin to throw an error
      const admin = require('../../../backend/config/firebaseAdmin');
      admin.auth().deleteUser.mockRejectedValue(new Error('Firebase error'));

      const req = testUtils.mockReq({
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error deleting user account'
      });
    });
  });

  describe('uploadAvatar', () => {
    test('should handle avatar upload successfully', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const mockFile = {
        filename: 'avatar-test-uid-123456.jpg',
        path: 'uploads/avatars/avatar-test-uid-123456.jpg'
      };

      const req = testUtils.mockReq({
        file: mockFile,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.uploadAvatar(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Avatar uploaded successfully',
        avatar: expect.stringContaining('avatar-test-uid-123456.jpg')
      });

      const updatedUser = await User.findOne({ firebaseUid: userData.firebaseUid });
      expect(updatedUser.avatar).toContain('avatar-test-uid-123456.jpg');
    });

    test('should return error when no file is uploaded', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        file: null,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    test('should return 404 for non-existent user', async () => {
      const mockFile = {
        filename: 'avatar-test-uid-123456.jpg',
        path: 'uploads/avatars/avatar-test-uid-123456.jpg'
      };

      const req = testUtils.mockReq({
        file: mockFile,
        user: { uid: 'non-existent-uid' }
      });
      const res = testUtils.mockRes();

      await userController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const userData = testUtils.createMockUser();
      
      // Mock an unexpected error in User.create
      const mockCreate = jest.spyOn(User, 'create').mockRejectedValue(new Error('Unexpected error'));

      const req = testUtils.mockReq({
        body: userData,
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error registering user' });

      mockCreate.mockRestore();
    });
  });

  describe('Input Validation', () => {
    test('should handle missing required fields in registration', async () => {
      const req = testUtils.mockReq({
        body: {}, // Missing required fields
        user: { uid: 'test-uid' }
      });
      const res = testUtils.mockRes();

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error registering user' });
    });

    test('should handle empty update data', async () => {
      const userData = testUtils.createMockUser();
      const user = await User.create(userData);

      const req = testUtils.mockReq({
        body: {}, // Empty update data
        user: { uid: userData.firebaseUid }
      });
      const res = testUtils.mockRes();

      await userController.updateUserProfile(req, res);

      // Should still work and return the existing user data
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: userData.name,
        email: userData.email
      }));
    });
  });
}); 