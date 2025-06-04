import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthForms.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleLogin, continueAsGuest, getUserRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      const role = await getUserRole(userCredential.user.uid);

      // Redirect based on role
      if (!role) {
        navigate('/select-role');
      } else {
        switch (role) {
          case 'customer':
            navigate('/');
            break;
          case 'vendor':
            navigate('/profile');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await googleLogin();
      const role = await getUserRole(userCredential.uid);

      // Redirect based on role
      if (!role) {
        navigate('/select-role');
      } else {
        switch (role) {
          case 'customer':
            navigate('/');
            break;
          case 'vendor':
            navigate('/profile');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      setError('');
      setLoading(true);
      await continueAsGuest();
      navigate('/');
    } catch (err) {
      console.error('Guest login error:', err);
      setError('Failed to continue as guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Sign in to your account</h2>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            Continue with Email
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="auth-button google-button"
        >
          Continue with Google
        </button>

        <button
          onClick={handleContinueAsGuest}
          disabled={loading}
          className="auth-button guest-button"
        >
          Continue as Guest
        </button>

        <div className="auth-links">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;