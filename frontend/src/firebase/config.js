import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// William's Firebase configuration
const firebaseConfigWilliam = {
  apiKey: "AIzaSyDY5c3ARiTGRmSx5cBKLJH3H8YnJVTT5Ww",
  authDomain: "migo-27d58.firebaseapp.com",
  projectId: "migo-27d58",
  storageBucket: "migo-27d58.firebasestorage.app",
  messagingSenderId: "502861657045",
  appId: "1:502861657045:web:05413cf3223bbdabca035c",
  measurementId: "G-M1N5Q67Y4V"
};

// Ulises's Firebase configuration
const firebaseConfigUlises = {
  apiKey: "AIzaSyD6HmXrQFM_nwO2tJrilI2cIbTVjbnCLqU",
  authDomain: "migo-ed423.firebaseapp.com",
  projectId: "migo-ed423",
  storageBucket: "migo-ed423.firebasestorage.app",
  messagingSenderId: "360990065321",
  appId: "1:360990065321:web:5252b5d96d61a740d79fb8",
  measurementId: "G-J6X7MT1DVJ"
};

// Initialize Firebase
// Use the appropriate configuration based on the environment variable
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG === 'william' ? firebaseConfigWilliam : firebaseConfigUlises;
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export default app; 