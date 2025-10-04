import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import BookForm from './BookForm';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/AdminComponents.css';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: '',
    lowStock: false,
    outOfStock: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [filters, pagination.page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await adminAPI.getBooks(params);
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories({ isActive: true });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateBook = () => {
    setEditingBook(null);
    setShowBookForm(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowBookForm(true);
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await adminAPI.deleteBook(bookId);
      fetchBooks();
    } catch (error) {
      console.error('Failed to delete book:', error);
      setError('Failed to delete book');
    }
  };

  const handleBookFormSubmit = async (bookData) => {
    try {
      if (editingBook) {
        await adminAPI.updateBook(editingBook._id, bookData);
      } else {
        await adminAPI.createBook(bookData);
      }
      
      setShowBookForm(false);
      setEditingBook(null);
      fetchBooks();
    } catch (error) {
      console.error('Failed to save book:', error);
      throw error;
    }
  };

  const handleStockUpdate = async (bookId, stockData) => {
    try {
      await adminAPI.updateBookStock(bookId, stockData);
      fetchBooks();
    } catch (error) {
      console.error('Failed to update stock:', error);
      setError('Failed to update stock');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedBooks.length === 0) {
      alert('Please select books first');
      return;
    }

    let updates = {};
    switch (action) {
      case 'activate':
        updates = { isActive: true };
        break;
      case 'deactivate':
        updates = { isActive: false };
        break;
      case 'feature':
        updates = { isFeatured: true };
        break;
      case 'unfeature':
        updates = { isFeatured: false };
        break;
      default:
        return;
    }

    try {
      await adminAPI.bulkUpdateBooks({
        bookIds: selectedBooks,
        updates
      });
      setSelectedBooks([]);
      fetchBooks();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  const handleSelectBook = (bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map(book => book._id));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStockStatus = (book) => {
    if (book.availableStock <= 0) return 'out-of-stock';
    if (book.isLowStock) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (book) => {
    if (book.availableStock <= 0) return 'Out of Stock';
    if (book.isLowStock) return 'Low Stock';
    return 'In Stock';
  };

  if (showBookForm) {
    return (
      <BookForm
        book={editingBook}
        categories={categories}
        onSubmit={handleBookFormSubmit}
        onCancel={() => {
          setShowBookForm(false);
          setEditingBook(null);
        }}
      />
    );
  }

  return (
    <div className="book-management">
      <div className="management-header">
        <h2>Book Management</h2>
        <button className="primary-btn" onClick={handleCreateBook}>
          + Add New Book
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search books..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
            />
            Low Stock Only
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.outOfStock}
              onChange={(e) => handleFilterChange('outOfStock', e.target.checked)}
            />
            Out of Stock Only
          </label>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBooks.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedBooks.length} books selected</span>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkAction('activate')}>Activate</button>
            <button onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
            <button onClick={() => handleBulkAction('feature')}>Feature</button>
            <button onClick={() => handleBulkAction('unfeature')}>Unfeature</button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Books Table */}
          <div className="table-container">
            <table className="books-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedBooks.length === books.length && books.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Book Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Sales</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book._id} className={selectedBooks.includes(book._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book._id)}
                        onChange={() => handleSelectBook(book._id)}
                      />
                    </td>
                    <td>
                      <div className="book-details">
                        <div className="book-title">{book.title}</div>
                        <div className="book-author">by {book.author}</div>
                        {book.isbn && <div className="book-isbn">ISBN: {book.isbn}</div>}
                      </div>
                    </td>
                    <td>{book.category?.name || 'N/A'}</td>
                    <td>
                      <div className="price-info">
                        <div className="current-price">{formatCurrency(book.price)}</div>
                        {book.originalPrice && book.originalPrice > book.price && (
                          <div className="original-price">{formatCurrency(book.originalPrice)}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="stock-info">
                        <div className={`stock-quantity ${getStockStatus(book)}`}>
                          {book.stock.quantity}
                        </div>
                        <div className="stock-status">
                          {getStockStatusText(book)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="status-badges">
                        <span className={`status-badge ${book.isActive ? 'active' : 'inactive'}`}>
                          {book.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {book.isFeatured && (
                          <span className="status-badge featured">Featured</span>
                        )}
                      </div>
                    </td>
                    <td>{book.salesCount || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditBook(book)}
                          className="action-btn edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="action-btn delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <StockUpdateModal
                          book={book}
                          onUpdate={handleStockUpdate}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} books)
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Stock Update Modal Component
const StockUpdateModal = ({ book, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState('set');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onUpdate(book._id, { quantity: numQuantity, operation });
    setShowModal(false);
    setQuantity('');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="action-btn stock"
        title="Update Stock"
      >
        📦
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Stock - {book.title}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Current Stock: {book.stock.quantity}</label>
              </div>
              
              <div className="form-group">
                <label>Operation:</label>
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BookManagement;
