import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { resetPassword, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Get token from URL params or location state
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const tokenFromState = location.state?.token;
    const token = tokenFromUrl || tokenFromState;
    
    if (token) {
      setFormData(prev => ({ ...prev, token }));
    } else {
      // If no token is found, redirect to forgot password page
      navigate('/forgot-password');
    }
  }, [searchParams, location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error
    if (error) clearError();
  };

  const validateForm = () => {
    const errors = {};

    // Password validation
    if (!formData.newPassword) {
      errors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const result = await resetPassword({
        token: formData.token,
        newPassword: formData.newPassword
      });
      
      if (result.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successfully. Please sign in with your new password.' 
            }
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Password Reset Successful</h2>
            <p>Your password has been reset successfully</p>
          </div>

          <div className="success-content">
            <div className="success-icon">✅</div>
            <p>
              You can now sign in with your new password.
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                required
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.newPassword && (
              <span className="field-error">{formErrors.newPassword}</span>
            )}
            <small className="password-hint">
              Password must be at least 6 characters with uppercase, lowercase, and number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <span className="field-error">{formErrors.confirmPassword}</span>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-links">
          <button 
            onClick={() => navigate('/forgot-password')}
            className="back-to-login"
          >
            ← Request New Reset Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
