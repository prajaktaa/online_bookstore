/**
 * Books.js - Online Bookstore Books Page Component
 * Author: [Your Name]
 * Description: Main books listing page with fallback functionality and database seeding
 */

import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [usingStaticData, setUsingStaticData] = useState(false);

  // Static fallback books
  const staticBooks = [
    {
      _id: 'static-1',
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      price: 450,
      description: 'A comprehensive guide to JavaScript programming and best practices.'
    },
    {
      _id: 'static-2',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 599,
      description: 'A handbook of agile software craftsmanship for writing maintainable code.'
    },
    {
      _id: 'static-3',
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      price: 525,
      description: 'Your journey to mastery in software development and programming.'
    }
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await API.get('/books');
        setBooks(response.data);
        setUsingStaticData(false);
      } catch (err) {
        console.error('Error fetching books:', err);
        // Fallback to static books if API fails
        setBooks(staticBooks);
        setUsingStaticData(true);
        setError('Database connection failed. Showing sample books.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await API.post('/books/seed');
      // Refresh the books list after seeding
      const response = await API.get('/books');
      setBooks(response.data);
      setUsingStaticData(false);
      setError(null);
      alert('Database seeded successfully!');
    } catch (err) {
      console.error('Error seeding data:', err);
      alert('Failed to seed database. Check if server is running and database is connected.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div>Loading books...</div>;

  return (
    <div className="books-container">
      <h2>Available Books</h2>
      
      {/* Database status message */}
      {usingStaticData && (
        <div className="db-status-warning">
          <p>⚠️ <strong>Database Connection Issue:</strong> Showing sample books only.</p>
          <p>To load the complete book catalog, please ensure MongoDB is connected.</p>
        </div>
      )}
      
      {error && !usingStaticData && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {books.length === 0 ? (
        <div>
          <p>No books available. Please seed the database first.</p>
          <button 
            onClick={handleSeedData} 
            disabled={seeding}
            className="seed-button"
          >
            {seeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>
      ) : (
        <>
          {/* Show seed button even when static books are displayed */}
          {usingStaticData && (
            <div className="seed-section">
              <button 
                onClick={handleSeedData} 
                disabled={seeding}
                className="seed-button"
              >
                {seeding ? 'Connecting to Database...' : 'Try Database Connection'}
              </button>
            </div>
          )}
          
          <div className="books-grid">
            {books.map(book => (
              <div key={book._id} className="book-card">
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                <p><strong>Price:</strong> ₹{book.price}</p>
                <p>{book.description}</p>
                <Link 
                  to="/checkout" 
                  state={{ book }} 
                  className="buy-button"
                >
                  Buy Now
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
