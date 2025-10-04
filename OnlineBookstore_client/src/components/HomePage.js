import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  
  // If user is authenticated, redirect to Books page
  // If not authenticated, show Login page
  return isAuthenticated ? <Navigate to="/books" replace /> : <Login />;
};

export default HomePage;
