import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Migo</h1>
        </Link>

        <nav className="nav-menu">
          {currentUser ? (
            <>
              {/* Public Browse Links - Available to all authenticated users */}
              <Link to="/services" className="nav-link">
                Browse Services
              </Link>
              <Link to="/categories" className="nav-link">
                Categories
              </Link>
              <Link to="/map" className="nav-link">
                Map
              </Link>

              {/* Customer Navigation */}
              {(!userProfile?.role || userProfile?.role === "customer") && (
                <>
                  <Link to="/my-jobs" className="nav-link customer-nav">
                    <span className="nav-icon">📋</span>
                    My Jobs
                  </Link>
                </>
              )}

              {/* Vendor Navigation */}
              {userProfile?.role === "vendor" && (
                <>
                  <Link to="/jobs" className="nav-link">
                    <span className="nav-icon">💼</span>
                    My Orders
                  </Link>
                  <Link to="/create-service" className="nav-link">
                    <span className="nav-icon">➕</span>
                    Add Service
                  </Link>
                </>
              )}

              {/* Common Authenticated Navigation */}
              <Link to="/profile" className="nav-link">
                <span className="nav-icon">👤</span>
                Profile
              </Link>

              <button onClick={handleLogout} className="logout-btn">
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </>
          ) : (
            /* Non-authenticated Navigation */
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link register-link">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
