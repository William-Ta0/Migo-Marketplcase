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

  // If we have a user but are still fetching profile, show loading
  if (currentUser && userProfile === null) {
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
  if (!userRole && userProfile !== null) {
    return <Navigate to="/select-role" />;
  }

  // If role is required and user doesn't have it, redirect to home
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
