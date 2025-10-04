import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear errors when user starts typing
    if (formError) setFormError('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!email) {
      setFormError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSubmitted(true);
        // In development, we might get the reset token in the response
        if (result.data.resetToken) {
          setResetToken(result.data.resetToken);
        }
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
    }
  };

  const handleResetRedirect = () => {
    navigate('/reset-password', { 
      state: { token: resetToken, email } 
    });
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Check Your Email</h2>
            <p>We've sent password reset instructions to:</p>
            <strong>{email}</strong>
          </div>

          <div className="success-content">
            <div className="success-icon">✅</div>
            <p>
              Please check your email and click the reset link to continue.
              The link will expire in 10 minutes for security reasons.
            </p>
            
            {resetToken && (
              <div className="dev-notice">
                <p><strong>Development Mode Notice:</strong></p>
                <p>In production, you would receive an email. For now, you can use this direct link:</p>
                <button 
                  onClick={handleResetRedirect}
                  className="auth-button"
                >
                  Reset Password Now
                </button>
              </div>
            )}
          </div>

          <div className="auth-links">
            <Link to="/login" className="back-to-login">
              ← Back to Sign In
            </Link>
            
            <button 
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
                setResetToken('');
              }}
              className="resend-link"
            >
              Didn't receive email? Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password?</h2>
          <p>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              autoFocus
            />
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="back-to-login">
            ← Back to Sign In
          </Link>
          
          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
