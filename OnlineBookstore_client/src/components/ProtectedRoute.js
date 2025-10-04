import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires no authentication (like login/register) and user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect to home page or intended destination
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
