import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (formError) setFormError('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    // Simple demo credentials check - bypass server validation
    if (formData.email.toLowerCase() === 'demo' && formData.password === 'demo123') {
      console.log('Demo credentials detected, redirecting to Books page...');
      // Directly navigate to Books page without server validation
      navigate('/books', { replace: true });
      return;
    }

    // For non-demo credentials, use normal login flow
    try {
      const result = await login(formData);
      
      if (result.success) {
        // Redirect to Books page after successful login
        navigate('/books', { replace: true });
      } else if (result.error) {
        setFormError(result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to your account</p>
        </div>

        {/* Demo Credentials Note */}
        <div className="demo-credentials-note" style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '16px' }}>
            🚀 Demo Credentials
          </h4>
          <p style={{ margin: '0', color: '#1565c0', fontSize: '14px' }}>
            <strong>Username:</strong> demo<br/>
            <strong>Password:</strong> demo123
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#757575' }}>
            Use these credentials to explore the bookstore features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address or Username</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email or username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {(error || formError) && (
            <div className="error-message">
              {error || formError}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot your password?
          </Link>
          
          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" state={{ from: location.state?.from }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
