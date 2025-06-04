import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedJobsRedirect = () => {
  const { userRole } = useAuth();

  // Redirect based on user role
  if (userRole === 'customer') {
    return <Navigate to="/my-jobs" replace />;
  } else if (userRole === 'vendor') {
    return <Navigate to="/vendor/jobs" replace />;
  } else if (userRole === 'admin') {
    return <Navigate to="/admin/jobs" replace />;
  }

  // Fallback: if no role is determined yet, show loading or redirect to home
  return <Navigate to="/" replace />;
};

export default RoleBasedJobsRedirect; 