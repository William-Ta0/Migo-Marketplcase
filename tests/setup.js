require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

// Mock Firebase Admin (always needed for backend tests)
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-firebase-uid',
      email: 'test@example.com',
    }),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  }),
  firestore: () => ({
    collection: jest.fn(),
    doc: jest.fn(),
  }),
}));

// Mock Firebase Frontend (only when modules are available)
try {
  require.resolve('firebase/app');
  jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
  }));
} catch (e) {
  // Firebase frontend not available, skip mocking
}

try {
  require.resolve('firebase/auth');
  jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
  }));
} catch (e) {
  // Firebase auth not available, skip mocking
}

try {
  require.resolve('firebase/firestore');
  jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
  }));
} catch (e) {
  // Firebase firestore not available, skip mocking
}

// Global test setup
let isMongoConnected = false;

// Increase timeout for Jest hooks
jest.setTimeout(30000);

beforeAll(async () => {
  try {
    console.log('🔌 Connecting to test database...');
    
    // Get the MongoDB URI from environment
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    // Create a test database name by appending '_test' to avoid affecting production data
    const testDbUri = mongoUri.replace(/\/([^/?]+)(\?|$)/, '/migo_test_db$2');
    
    console.log('📍 Test database URI:', testDbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Connect to the test database
    await mongoose.connect(testDbUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Verify connection
    await mongoose.connection.db.admin().ping();
    
    isMongoConnected = true;
    console.log('✅ Connected to test database successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error.message);
    console.log('⚠️  Tests will run without database - some tests may be skipped');
  }
});

afterAll(async () => {
  try {
    if (isMongoConnected) {
      // Clean up all test data before disconnecting
      console.log('🧹 Cleaning up test database...');
      
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany({});
      }
      
      await mongoose.disconnect();
      console.log('✅ Disconnected from test database');
    }
  } catch (error) {
    console.error('⚠️  Error during test cleanup:', error.message);
  }
});

afterEach(async () => {
  // Clean up database after each test only if connected
  if (isMongoConnected && mongoose.connection.readyState === 1) {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      console.warn('⚠️  Error cleaning up test data:', error.message);
    }
  }
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    firebaseUid: 'test-firebase-uid',
    name: 'Test User',
    email: 'test@example.com',
    authProvider: 'email',
    role: 'customer',
    ...overrides,
  }),
  
  createMockVendor: (overrides = {}) => ({
    firebaseUid: 'test-vendor-uid',
    name: 'Test Vendor',
    email: 'vendor@example.com',
    authProvider: 'email',
    role: 'vendor',
    vendorInfo: {
      skills: [{
        category: 'Technology',
        subcategories: ['Web Development'],
        experienceLevel: 'expert',
      }],
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
      },
      onboardingCompleted: true,
      rating: {
        average: 4.5,
        count: 10,
      },
    },
    ...overrides,
  }),
  
  createMockService: (vendorId, overrides = {}) => ({
    title: 'Test Service',
    description: 'This is a test service description',
    shortDescription: 'Test service',
    vendor: vendorId,
    category: {
      name: 'Technology',
      slug: 'technology',
    },
    subcategory: {
      name: 'Web Development',
    },
    pricing: {
      type: 'fixed',
      amount: 100,
      currency: 'USD',
    },
    location: {
      type: 'both',
      serviceArea: {
        radius: 25,
      },
    },
    isActive: true,
    ...overrides,
  }),
  
  createMockJob: (customerId, vendorId, serviceId, overrides = {}) => ({
    title: 'Test Job',
    description: 'This is a test job description',
    customer: customerId,
    vendor: vendorId,
    service: serviceId,
    status: 'pending',
    pricing: {
      type: 'fixed',
      amount: 100,
      currency: 'USD',
    },
    ...overrides,
  }),
  
  createMockReview: (customerId, vendorId, jobId, overrides = {}) => ({
    customer: customerId,
    vendor: vendorId,
    job: jobId,
    rating: {
      overall: 5,
      communication: 5,
      quality: 5,
      timeliness: 5,
      professionalism: 5,
    },
    title: 'Great service!',
    comment: 'The vendor did an excellent job.',
    ...overrides,
  }),
  
  // Mock Express request and response objects
  mockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    user: { uid: 'test-firebase-uid' },
    file: null,
    files: [],
    headers: {},
    ...overrides,
  }),
  
  mockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Mock Express next function
  mockNext: () => jest.fn(),
  
  // Helper to check database connection
  isDbConnected: () => isMongoConnected && mongoose.connection.readyState === 1,
};

// Extend Jest matchers
expect.extend({
  toBeValidObjectId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
});

// Console log suppression for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 