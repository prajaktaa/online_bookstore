import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // This goes to login page (our new homepage)
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            📚 Online Bookstore
          </Link>
          <nav className="main-nav">
            <Link to={isAuthenticated ? "/books" : "/"} className="nav-link">Home</Link>
            <Link to="/books" className="nav-link">Books</Link>
          </nav>
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-section">
              <div className="user-menu-container">
                <button 
                  className="user-button"
                  onClick={toggleUserMenu}
                >
                  <span className="user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="user-name">{user?.name}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-name">{user?.name}</div>
                      <div className="user-email">{user?.email}</div>
                      {!user?.isEmailVerified && (
                        <div className="verification-notice">
                          ⚠️ Email not verified
                        </div>
                      )}
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      👤 My Profile
                    </Link>
                    
                    <Link 
                      to="/orders" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📦 My Orders
                    </Link>
                    
                    <Link 
                      to="/wishlist" 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ❤️ Wishlist
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>

              <Link to="/cart" className="cart-link">
                🛒 Cart
              </Link>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-link login-link">
                Sign In
              </Link>
              <Link to="/register" className="auth-link register-link">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {showUserMenu && (
        <div 
          className="dropdown-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
