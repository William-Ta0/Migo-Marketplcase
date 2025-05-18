import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole } = useAuth();

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If no role is set, redirect to role selection
  if (!userRole) {
    return <Navigate to="/select-role" />;
  }

  // If role is required and user doesn't have it, redirect to home
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute; 