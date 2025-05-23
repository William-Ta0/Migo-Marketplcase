import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DeleteAccount from '../components/DeleteAccount';

const Profile = () => {
  const { currentUser, getUserProfile, updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setName(userProfile.name);
          setEmail(userProfile.email);
          setRole(userProfile.role || 'No role assigned');
        } else {
          setName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
          setRole('No role assigned');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, getUserProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setUpdateLoading(true);
      
      await updateUserProfile({ name });
      
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Capitalize the first letter of the role
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'No role assigned';

  return (
    <div className="form-container">
      <h2>Profile</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label>Email</label>
          <input
            type="email"
            value={email}
            disabled
          />
          <small>Email cannot be changed</small>
        </div>
        <div className="form-control">
          <label>Role</label>
          <input
            type="text"
            value={displayRole}
            disabled
          />
          <small>Role can only be changed during registration</small>
        </div>
        <button
          disabled={updateLoading}
          type="submit"
          className="btn btn-block"
        >
          {updateLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      <div className="danger-zone" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ff4444', borderRadius: '4px' }}>
        <h3 style={{ color: '#ff4444', marginBottom: '1rem' }}>Danger Zone</h3>
        <DeleteAccount />
      </div>
    </div>
  );
};

export default Profile; 