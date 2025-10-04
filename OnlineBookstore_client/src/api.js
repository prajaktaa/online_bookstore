import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: (userData) => API.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => API.post('/auth/login', credentials),
  
  // Logout user
  logout: () => API.post('/auth/logout'),
  
  // Get user profile
  getProfile: () => API.get('/auth/profile'),
  
  // Update user profile
  updateProfile: (userData) => API.put('/auth/profile', userData),
  
  // Change password
  changePassword: (passwordData) => API.post('/auth/change-password', passwordData),
  
  // Forgot password
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (tokenData) => API.post('/auth/reset-password', tokenData),
  
  // Verify email
  verifyEmail: (token) => API.post('/auth/verify-email', { token }),
  
  // Refresh token
  refreshToken: () => API.post('/auth/refresh-token'),

  // Create demo user
  createDemoUser: () => API.post('/auth/create-demo-user')
};

// Order API calls
export const orderAPI = {
  // Get user orders
  getOrders: (params) => API.get('/orders', { params }),
  
  // Get order by ID
  getOrderById: (orderId) => API.get(`/orders/${orderId}`),
  
  // Create new order
  createOrder: (orderData) => API.post('/orders', orderData),
  
  // Cancel order
  cancelOrder: (orderId, data) => API.put(`/orders/${orderId}/cancel`, data),
  
  // Request return
  requestReturn: (orderId, data) => API.put(`/orders/${orderId}/return`, data),
  
  // Get tracking info
  getTrackingInfo: (orderId) => API.get(`/orders/${orderId}/tracking`)
};

// Books API calls
export const booksAPI = {
  // Get all books
  getBooks: (params) => API.get('/books', { params }),
  
  // Get book by ID
  getBookById: (bookId) => API.get(`/books/${bookId}`),
  
  // Search books
  searchBooks: (query) => API.get(`/books/search?q=${query}`)
};

// Utility functions for token management
export const tokenUtils = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};

export default API;

// Unified API object that includes common CRUD operations
export const api = {
  // Generic HTTP methods
  get: (url, config) => API.get(url, config),
  post: (url, data, config) => API.post(url, data, config),
  put: (url, data, config) => API.put(url, data, config),
  delete: (url, config) => API.delete(url, config),
  
  // Auth methods
  auth: authAPI,
  
  // Order methods
  orders: orderAPI,
  
  // Books methods
  books: booksAPI
};