import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';

// Use environment-specific API URLs
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://your-backend-url.com/api'  // Use environment variable or fallback
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

  // Upload user avatar
  const uploadAvatar = async (avatarFile) => {
    try {
      const user = await auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const idToken = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const idToken = await user.getIdToken();
      
      // Delete user from MongoDB first
      await axios.delete(`${API_URL}/delete`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Delete user from Firebase
      await deleteUser(user);
      
      // Clear local state
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error deleting account:', error);
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
    updateUserProfile,
    uploadAvatar,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 