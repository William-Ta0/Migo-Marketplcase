const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
let serviceAccount;
try {
  try {
    // Try to load from the backend directory
    serviceAccount = require("../serviceAccountKey.json");
  } catch (error) {
    // If not found, try to load from backup directory
    serviceAccount = require("../../backup/serviceAccountKey.json");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log("Firebase Admin initialized successfully with credentials");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error.message);
  console.log(
    "Please ensure serviceAccountKey.json is present in either the backend or backup directory"
  );
  process.exit(1);
}

module.exports = admin;
