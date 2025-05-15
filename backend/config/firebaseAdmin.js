const admin = require('firebase-admin');

// Using a service account file - this is the recommended approach for development
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully with credentials');
} catch (error) {
  // Fallback to initialize just with the project ID (limited functionality)
  console.error('Error initializing Firebase Admin with credentials:', error.message);
  console.log('Attempting to initialize with just project ID');
  
  admin.initializeApp({
    projectId: 'migo-27d58'
  });
  console.log('Firebase Admin initialized with limited functionality (projectId only)');
}

module.exports = admin; 