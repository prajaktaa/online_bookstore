/**
 * Checkout.js - Online Bookstore Checkout Page Component
 * Author: Prajakta
 * Description: Checkout page with Razorpay payment integration
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const book = state?.book;
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!book) return;

    setLoading(true);
    try {
      // Create order on backend
      const response = await API.post('/orders/create', {
        items: [{ book: book._id, qty: 1 }],
        amount: book.price
      });

      const { orderId, amount } = response.data;

      // Razorpay payment options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'Online Bookstore',
        description: `Purchase: ${book.title}`,
        order_id: orderId,
        handler: (response) => {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          navigate('/');
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          address: 'Online Bookstore'
        },
        theme: {
          color: '#3399cc'
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="checkout-container">
        <h2>No Book Selected</h2>
        <p>Please go back and select a book to purchase.</p>
        <button onClick={() => navigate('/')}>Go to Books</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="book-details">
        <h3>{book.title}</h3>
        <p><strong>Author:</strong> {book.author}</p>
        <p><strong>Description:</strong> {book.description}</p>
        <p><strong>Price:</strong> ₹{book.price}</p>
      </div>
      
      <div className="payment-section">
        <button 
          onClick={handlePayment} 
          disabled={loading}
          className="pay-button"
        >
          {loading ? 'Processing...' : `Pay ₹${book.price}`}
        </button>
        
        <button 
          onClick={() => navigate('/')} 
          className="back-button"
        >
          Back to Books
        </button>
      </div>
    </div>
  );
}
