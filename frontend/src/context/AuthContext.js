import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';

// Use environment-specific API URLs
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://migo-27d58.web.app/api'  // Change this to your actual backend URL when deployed
  : 'http://localhost:5001/api';
const API_URL = `${BASE_URL}/users`;

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register user with Firebase and save to MongoDB
  const register = async (name, email, password) => {
    try {
      // Register with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's profile with their name
      await updateProfile(user, { displayName: name });

      // Get the ID token
      const idToken = await user.getIdToken();

      // Register user in MongoDB
      await axios.post(
        `${API_URL}`,
        {
          name,
          email,
          firebaseUid: user.uid,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in user with Firebase
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Check if user exists in MongoDB, if not register them
      try {
        // Try to get the profile, if it fails, the user doesn't exist in our DB
        await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch (error) {
        // User doesn't exist in MongoDB, register them
        if (error.response && error.response.status === 404) {
          await axios.post(
            `${API_URL}`,
            {
              name: user.displayName || 'Google User',
              email: user.email,
              firebaseUid: user.uid,
            },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
        } else {
          console.error('Error checking user profile:', error);
        }
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out user from Firebase
  const logout = () => {
    return signOut(auth);
  };

  // Get current user's profile from backend
  const getUserProfile = async () => {
    try {
      if (!currentUser) return null;

      const idToken = await currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      if (!currentUser) return null;

      const idToken = await currentUser.getIdToken();
      const response = await axios.put(
        `${API_URL}/profile`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Update Firebase display name if provided
      if (userData.name) {
        await updateProfile(currentUser, { displayName: userData.name });
      }

      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    googleLogin,
    logout,
    getUserProfile,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 