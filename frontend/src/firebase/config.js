import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDY5c3ARiTGRmSx5cBKLJH3H8YnJVTT5Ww",
  authDomain: "migo-27d58.firebaseapp.com",
  projectId: "migo-27d58",
  storageBucket: "migo-27d58.firebasestorage.app",
  messagingSenderId: "502861657045",
  appId: "1:502861657045:web:05413cf3223bbdabca035c",
  measurementId: "G-M1N5Q67Y4V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export default app; 