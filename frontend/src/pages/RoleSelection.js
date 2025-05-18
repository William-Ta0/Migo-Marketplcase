import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthForms.css';

const RoleSelection = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, setUserRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    try {
      setError('');
      setLoading(true);

      // Update role using the AuthContext function (which now uses MongoDB)
      await setUserRole(role);

      // After role selection, always navigate to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error assigning role:', err);
      setError('Failed to assign role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>What would you like to do?</h2>
        {error && <div className="auth-error">{error}</div>}
        
        <div className="role-buttons">
          <button
            onClick={() => handleRoleSelection('customer')}
            disabled={loading}
            className="auth-button"
          >
            👤 I'm a Customer
          </button>
          
          <button
            onClick={() => handleRoleSelection('vendor')}
            disabled={loading}
            className="auth-button"
          >
            🛍️ I'm a Vendor
          </button>
          
          {/* Admin button - could be conditionally rendered based on email whitelist */}
          {currentUser?.email?.endsWith('@admin.com') && (
            <button
              onClick={() => handleRoleSelection('admin')}
              disabled={loading}
              className="auth-button"
            >
              🛠️ I'm an Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection; 