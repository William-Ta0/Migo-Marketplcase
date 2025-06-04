import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import axios from "axios";

// Use environment-specific API URLs
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://your-backend-url.com/api"
    : "http://localhost:5001/api"); // Backend API running on port 5001 for development
const API_URL = `${API_BASE_URL}/users`;

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setCurrentUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register user with Firebase and save to MongoDB
  const register = async (name, email, password) => {
    try {
      // Register with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User registered:", user.uid, email); // Added console log

      // Update the user\'s profile with their name
      await updateProfile(user, { displayName: name });

      // Get the ID token
      const idToken = await user.getIdToken();

      // Create user document in MongoDB
      const response = await axios.post(
        `${API_URL}/register`,
        {
          name,
          email,
          firebaseUid: user.uid,
          authProvider: "email",
          role: null,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      console.log("User data saved to MongoDB for:", user.uid); // Added console log

      // Set user profile
      setUserProfile(response.data);
      setCurrentUserRole(response.data.role);

      return user;
    } catch (error) {
      console.error("Error during registration:", error); // Added console log
      throw error;
    }
  };

  // Sign in user with Firebase
  const login = async (email, password) => {
    // Made async to await and log
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User logged in:", userCredential.user.uid, email); // Added console log
      return userCredential;
    } catch (error) {
      console.warn("Unsuccessful login attempt for email:", email); // Added console log for unsuccessful attempt
      console.error("Error during login:", error);
      throw error;
    }
  };

  // Sign in with Google
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User logged in with Google:", user.uid, user.email); // Added console log

      // Get the ID token
      const idToken = await user.getIdToken();

      try {
        // Try to get the user profile
        const profileResponse = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        setUserProfile(profileResponse.data);
        setCurrentUserRole(profileResponse.data.role);
      } catch (error) {
        // If user doesn\'t exist in MongoDB, create them
        if (error.response && error.response.status === 404) {
          const registerResponse = await axios.post(
            `${API_URL}/register`,
            {
              name: user.displayName || "Google User",
              email: user.email,
              firebaseUid: user.uid,
              authProvider: "google",
              role: null,
            },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
          console.log("Google user data saved to MongoDB for:", user.uid); // Added console log
          setUserProfile(registerResponse.data);
          setCurrentUserRole(registerResponse.data.role);
        } else {
          console.error(
            "Error during Google login (profile check/creation):",
            error
          ); // Added console log
          // Don't throw error here - user is still authenticated with Firebase
          console.warn("Using Firebase profile without backend sync");
        }
      }

      return user;
    } catch (error) {
      console.warn("Unsuccessful Google login attempt."); // Added console log for unsuccessful attempt
      console.error("Error during Google login:", error);
      throw error;
    }
  };

  // Sign out user from Firebase
  const logout = async () => {
    // Made async to await and log
    try {
      const user = auth.currentUser; // Get user before signing out for logging
      await signOut(auth);
      setCurrentUserRole(null);
      setUserProfile(null);
      console.log(
        "User logged out:",
        user ? user.uid : "No user was signed in"
      ); // Added console log
    } catch (error) {
      console.error("Error during logout:", error); // Added console log
      throw error;
    }
  };

  // Get user's role from MongoDB
  const getUserRole = async (uid) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const idToken = await user.getIdToken();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.data.role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      // Don't log user out - just return null role
      return null;
    }
  };

  // Ensure user exists in database and update role
  const setUserRole = async (role) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const idToken = await user.getIdToken();

      // First, try to update the role (for existing users)
      try {
        const response = await axios.put(
          `${API_URL}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
        console.log('Role updated successfully for existing user:', user.uid, 'to role:', role);
        
        // Update local state immediately
        setCurrentUserRole(role);
        if (userProfile) {
          setUserProfile({ ...userProfile, role });
        }
        
        return response.data;
      } catch (error) {
        console.error('Error updating role:', error.response?.status, error.response?.data);
        
        // If user doesn't exist (404), create them first
        if (error.response && error.response.status === 404) {
          console.log('User not found in database, creating user:', user.uid);
          
          try {
            // Create user in database first
            const createResponse = await axios.post(
              `${API_URL}/register`,
              {
                name: user.displayName || 'User',
                email: user.email,
                firebaseUid: user.uid,
                authProvider: user.providerData[0]?.providerId || 'email',
                role: role,
              },
              {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              }
            );
            console.log('User created successfully in database:', user.uid, 'with role:', role);
            
            // Update local state
            setCurrentUserRole(role);
            setUserProfile(createResponse.data);
            
            return createResponse.data;
          } catch (createError) {
            console.error('Error creating user:', createError);
            throw new Error('Failed to create user account. Please try again.');
          }
        } else if (error.response && error.response.status === 400) {
          // Handle validation errors
          throw new Error(error.response.data.message || 'Invalid role selection. Please try again.');
        } else if (error.response && error.response.status >= 500) {
          // Handle server errors
          throw new Error('Server error. Please try again later.');
        } else {
          // Handle other errors
          throw new Error('Failed to assign role. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error setting user role:', error);
      // Don't update local state if there was an error
      throw error;
    }
  };

  // Get user profile from MongoDB
  const getUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const idToken = await user.getIdToken();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Don't throw error - return null and let app continue
      return null;
    }
  };

  // Update user profile in MongoDB
  const updateUserProfile = async (profileData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

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

      // Update local userProfile state
      setUserProfile(response.data);
      if (response.data.role) {
        setCurrentUserRole(response.data.role);
      }

      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const idToken = await user.getIdToken();
      const formData = new FormData();

      formData.append('avatar', file);
      
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

      // Update local userProfile state
      setUserProfile(response.data);

      return response.data;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const idToken = await user.getIdToken();

      
      // Delete from MongoDB first
      await axios.delete(`${API_URL}/delete`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Then delete from Firebase
      await user.delete();
      
      // Clear local state
      setCurrentUser(null);
      setCurrentUserRole(null);
      setUserProfile(null);

    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed - user signed in:', user.uid, user.email);
        setCurrentUser(user);
        
        try {
          // Get fresh ID token and store it
          const idToken = await user.getIdToken(true); // Force refresh
          localStorage.setItem('token', idToken);
          console.log('Token stored in localStorage');
          
          // Get user profile from MongoDB
          const response = await axios.get(`${API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          
          setUserProfile(response.data);
          setCurrentUserRole(response.data.role);
          console.log('User profile loaded:', response.data);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Still set the user as signed in, just without profile data
          setCurrentUserRole(null);
          setUserProfile(null);
        }
      } else {
        // Only clear state if not in guest mode
        if (currentUser && currentUser.uid !== "guest") {
          console.log('Auth state changed - user signed out');
          setCurrentUser(null);
          setCurrentUserRole(null);
          setUserProfile(null);
          localStorage.removeItem('token'); // Remove token on signout
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const continueAsGuest = async () => {
    try {
      setLoading(true);
      setCurrentUser({ uid: "guest", displayName: "Guest" });
      setCurrentUserRole("guest");
      setUserProfile({ role: "guest" });
      setLoading(false);
    } catch (error) {
      console.error("Error during guest session:", error);
      setLoading(false);
      throw error;
    }
  };

  const value = {
    currentUser,
    userRole,
    userProfile,
    setUserRole,
    register,
    login,
    googleLogin,
    logout,
    getUserRole,
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
    deleteAccount,
    continueAsGuest,
    // Alias for backward compatibility
    user: currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
