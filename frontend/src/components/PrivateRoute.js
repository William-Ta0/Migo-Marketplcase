import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, userProfile, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Handle guest users
  if (currentUser.uid === "guest") {
    // If a specific role is required and user is guest, redirect to login
    if (requiredRole && requiredRole !== "guest") {
      return <Navigate to="/login" />;
    }
    // Otherwise allow guest access
    return children;
  }

  // If we have a user but are still fetching profile, show loading
  // Only show this loading state for non-guest users
  if (currentUser && userProfile === null && currentUser.uid !== "guest") {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  // If no role is set after profile is loaded, redirect to role selection
  // Skip this check for guest users
  if (!userRole && userProfile !== null && currentUser.uid !== "guest") {
    return <Navigate to="/select-role" />;
  }

  // If role is required and user doesn't have it, redirect to home
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
