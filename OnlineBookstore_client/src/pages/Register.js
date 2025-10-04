import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

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

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    // Terms acceptance validation
    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
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
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      
      if (result.success) {
        // Redirect to Books page after successful registration
        navigate('/books', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join our online bookstore community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
            {formErrors.email && (
              <span className="field-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number (optional)"
              autoComplete="tel"
            />
            {formErrors.phoneNumber && (
              <span className="field-error">{formErrors.phoneNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('password')}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.password && (
              <span className="field-error">{formErrors.password}</span>
            )}
            <small className="password-hint">
              Password must be at least 6 characters with uppercase, lowercase, and number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
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

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
              />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" target="_blank">Terms and Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank">Privacy Policy</Link>
            </label>
            {formErrors.terms && (
              <span className="field-error">{formErrors.terms}</span>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <div className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" state={{ from: location.state?.from }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
