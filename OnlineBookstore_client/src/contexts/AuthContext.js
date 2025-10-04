import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, tokenUtils } from '../api';

// Auth Context
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT'
};

// Initial state
const initialState = {
  user: tokenUtils.getUser(),
  isAuthenticated: tokenUtils.isAuthenticated(),
  loading: false,
  error: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      // Store token and user data
      tokenUtils.setToken(token);
      tokenUtils.setUser(user);
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      // Store token and user data
      tokenUtils.setToken(token);
      tokenUtils.setUser(user);
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // Call logout API (optional)
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignore API errors during logout
        console.warn('Logout API call failed:', error);
      }
      
      // Clear local storage
      tokenUtils.removeToken();
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Logout failed' });
      return { success: false, error: 'Logout failed' };
    }
  };

  // Get profile function
  const getProfile = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.getProfile();
      const { user } = response.data;
      
      tokenUtils.setUser(user);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, data: user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch profile';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.updateProfile(userData);
      const { user } = response.data;
      
      tokenUtils.setUser(user);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.changePassword(passwordData);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.forgotPassword(email);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (tokenData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.resetPassword(tokenData);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Verify email function
  const verifyEmail = async (token) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.verifyEmail(token);
      
      // Refresh user profile to update verification status
      await getProfile();
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Email verification failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
