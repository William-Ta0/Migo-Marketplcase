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
  const [userRole, setUserRole] = useState(null);
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

      // Create user document in MongoDB
      await axios.post(
        `${API_URL}/register`,
        {
          name,
          email,
          firebaseUid: user.uid,
          authProvider: 'email',
          role: null,
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
      
      try {
        // Try to get the user profile
        await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch (error) {
        // If user doesn't exist in MongoDB, create them
        if (error.response && error.response.status === 404) {
          await axios.post(
            `${API_URL}/register`,
            {
              name: user.displayName || 'Google User',
              email: user.email,
              firebaseUid: user.uid,
              authProvider: 'google',
              role: null,
            },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
        } else {
          throw error;
        }
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out user from Firebase
  const logout = () => {
    setUserRole(null);
    return signOut(auth);
  };

  // Get user's role from MongoDB
  const getUserRole = async (uid) => {
    try {
      const user = await auth.currentUser;
      if (!user) return null;

      const idToken = await user.getIdToken();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.data.role;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  // Update user's role in MongoDB
  const updateUserRole = async (uid, role) => {
    try {
      const user = await auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const idToken = await user.getIdToken();
      await axios.put(
        `${API_URL}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setUserRole(role);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Get user profile from MongoDB
  const getUserProfile = async () => {
    try {
      const user = await auth.currentUser;
      if (!user) return null;

      const idToken = await user.getIdToken();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Update user profile in MongoDB
  const updateUserProfile = async (profileData) => {
    try {
      const user = await auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const idToken = await user.getIdToken();
      const response = await axios.put(
        `${API_URL}/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    setUserRole: (role) => updateUserRole(currentUser?.uid, role),
    register,
    login,
    googleLogin,
    logout,
    getUserRole,
    getUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 