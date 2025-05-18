# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your MERN stack application.

## Frontend Setup

The frontend Firebase configuration has already been set up with your Firebase project credentials in `frontend/src/firebase/config.js`.

## Backend Setup

For the backend to properly verify Firebase authentication tokens, you need to set up the Firebase Admin SDK. You have two options:

### Option 1: Using a Service Account Key File (Recommended for Development)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "migo-27d58"
3. Go to Project Settings (gear icon) > Service accounts
4. Click "Generate new private key" button
5. Save the downloaded JSON file as `serviceAccountKey.json` in the `backend` directory
6. Update `backend/config/firebaseAdmin.js` to use this file:
   - Uncomment this line: `const serviceAccount = require('../serviceAccountKey.json');`
   - Comment out the environment variables section

### Option 2: Using Environment Variables (Recommended for Production)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "migo-27d58"
3. Go to Project Settings (gear icon) > Service accounts
4. Click "Generate new private key" button
5. Open the downloaded JSON file
6. Copy each value to the corresponding variable in your `.env` file:

```
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=migo-27d58
FIREBASE_PRIVATE_KEY_ID=<private_key_id from the JSON file>
FIREBASE_PRIVATE_KEY=<private_key from the JSON file, replace newlines with \n>
FIREBASE_CLIENT_EMAIL=<client_email from the JSON file>
FIREBASE_CLIENT_ID=<client_id from the JSON file>
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=<client_x509_cert_url from the JSON file>
```

**Important Note for the Private Key**: When copying the private key to the .env file, you need to:

1. Replace all newline characters (`\n`) with the literal string `\\n`
2. Make sure the entire private key is surrounded by quotes

## Testing Authentication

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm start`
3. Navigate to http://localhost:3000
4. Try registering a new user
5. Try logging in with the registered user
6. Try accessing protected routes (adding or viewing items)
