import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import HomePage from './components/HomePage';
import Books from './pages/Books';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Header />
          <main>
            <Routes>
              {/* Homepage - shows Login for unauthenticated, redirects to Books for authenticated */}
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<Books />} />
              
              {/* Auth routes (only accessible when not logged in) */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPassword />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResetPassword />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes (only accessible when logged in) */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <OrderHistory />
                  </ProtectedRoute>
                } 
              />
              
              {/* Add more protected routes as needed */}
              {/* 
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/wishlist" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Wishlist />
                  </ProtectedRoute>
                } 
              />
              */}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
