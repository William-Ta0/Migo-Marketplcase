const admin = require("firebase-admin");

// Initialize Firebase Admin using environment variables
try {
  if (!admin.apps.length) {
    // Handle private key formatting for different deployment platforms
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // If it doesn't start with -----BEGIN, it might be base64 encoded
      if (!privateKey.startsWith('-----BEGIN')) {
        try {
          privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
        } catch (e) {
          // If base64 decode fails, use as-is
        }
      }
    }

    // Create service account config from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // Validate required environment variables
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error("Missing required Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, or FIREBASE_CLIENT_EMAIL");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log("Firebase Admin initialized successfully with environment variables");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error.message);
  console.log("Please ensure all Firebase environment variables are properly set:");
  console.log("- FIREBASE_PROJECT_ID");
  console.log("- FIREBASE_PRIVATE_KEY");
  console.log("- FIREBASE_CLIENT_EMAIL");
  
  // Debug info (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log("Debug: FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET");
    console.log("Debug: FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "SET" : "NOT SET");
    console.log("Debug: FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "NOT SET");
  }
  
  process.exit(1);
}

module.exports = admin;
