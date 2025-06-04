import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
} from "firebase/auth";
import { auth } from "../firebase/config";
import axios from "axios";

// Use environment-specific API URLs
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL || "https://your-backend-url.com/api" // Use environment variable or fallback
    : "http://localhost:5001/api"; // Backend API running on port 5001 for development
const API_URL = `${BASE_URL}/users`;

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
        await axios.put(
          `${API_URL}/role`,
          { role },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
        console.log(
          "Role updated successfully for existing user:",
          user.uid,
          "to role:",
          role
        );
      } catch (error) {
        // If user doesn't exist (404), create them first
        if (error.response && error.response.status === 404) {
          console.log("User not found in database, creating user:", user.uid);

          // Create user in database first
          await axios.post(
            `${API_URL}/register`,
            {
              name: user.displayName || "User",
              email: user.email,
              firebaseUid: user.uid,
              authProvider: "email", // Default, could be improved
              role: role,
            },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
          console.log(
            "User created successfully in database:",
            user.uid,
            "with role:",
            role
          );
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Update local state
      setCurrentUserRole(role);
      if (userProfile) {
        setUserProfile({ ...userProfile, role });
      }

      // Refresh user profile to get latest data
      const updatedProfile = await getUserProfile();
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        setCurrentUserRole(updatedProfile.role);
      }
    } catch (error) {
      console.error("Error setting user role:", error);
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
      const response = await axios.put(`${API_URL}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

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

  // Upload user avatar
  const uploadAvatar = async (avatarFile) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const idToken = await user.getIdToken();
      const response = await axios.post(`${API_URL}/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local userProfile state
      if (userProfile) {
        setUserProfile({ ...userProfile, avatar: response.data.avatar });
      }

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
        console.log(
          "Auth state changed: User signed in -",
          user.uid,
          user.email
        ); // Added console log
        setCurrentUser(user);

        // Try to get profile from backend, but don't fail if backend is down
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUserProfile(profile);
            setCurrentUserRole(profile.role);
            console.log(
              "User profile fetched:",
              profile.role,
              "for user:",
              user.uid
            );
          } else {
            // Fallback to basic profile from Firebase
            setUserProfile({
              name: user.displayName || "User",
              email: user.email,
              role: null,
              firebaseUid: user.uid,
            });
            setCurrentUserRole(null);
          }
        } catch (error) {
          console.warn("Backend not available, using fallback profile");
          setUserProfile({
            name: user.displayName || "User",
            email: user.email,
            role: null,
            firebaseUid: user.uid,
          });
          setCurrentUserRole(null);
        }
      } else {
        console.log("Auth state changed: User signed out"); // Added console log
        setCurrentUser(null);
        setCurrentUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const continueAsGuest = async () => {
    try {
      setCurrentUser({ uid: "guest", displayName: "Guest" });
      setCurrentUserRole("guest");
      setUserProfile({ role: "guest" });
    } catch (error) {
      console.error("Error during guest session:", error);
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
