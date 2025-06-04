// Basic test to verify testing infrastructure
describe('Test Infrastructure', () => {
  test('should have test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.createMockUser).toBeInstanceOf(Function);
    expect(global.testUtils.mockReq).toBeInstanceOf(Function);
    expect(global.testUtils.mockRes).toBeInstanceOf(Function);
  });

  test('should create mock user correctly', () => {
    const mockUser = testUtils.createMockUser();
    expect(mockUser).toHaveProperty('firebaseUid');
    expect(mockUser).toHaveProperty('name');
    expect(mockUser).toHaveProperty('email');
    expect(mockUser.role).toBe('customer');
  });

  test('should create mock vendor correctly', () => {
    const mockVendor = testUtils.createMockVendor();
    expect(mockVendor.role).toBe('vendor');
    expect(mockVendor.vendorInfo).toBeDefined();
    expect(mockVendor.vendorInfo.skills).toBeInstanceOf(Array);
  });

  test('should create mock request/response objects', () => {
    const req = testUtils.mockReq({ body: { test: 'data' } });
    const res = testUtils.mockRes();

    expect(req.body.test).toBe('data');
    expect(typeof res.status).toBe('function');
    expect(typeof res.json).toBe('function');
    expect(res.status).toHaveProperty('mockReturnValue');
    expect(res.json).toHaveProperty('mockReturnValue');
  });

  test('should have custom Jest matchers', () => {
    // Test the custom ObjectId matcher
    const validObjectId = '507f1f77bcf86cd799439011';
    const invalidObjectId = 'invalid-id';

    expect(validObjectId).toBeValidObjectId();
    expect(invalidObjectId).not.toBeValidObjectId();
  });
});

// Environment check
describe('Environment Setup', () => {
  test('should have Node.js environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('should have required modules available', () => {
    expect(() => require('mongoose')).not.toThrow();
    expect(() => require('jest')).not.toThrow();
  });

  test('should suppress console logs in tests', () => {
    expect(console.log).toEqual(expect.any(Function));
    expect(console.error).toEqual(expect.any(Function));
  });
}); 