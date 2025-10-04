import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import '../../styles/AdminComponents.css';

const BookForm = ({ book, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    publisher: '',
    publishedDate: '',
    pages: '',
    language: 'English',
    format: 'Paperback',
    dimensions: '',
    weight: '',
    stockQuantity: '',
    minStockLevel: '5',
    tags: '',
    isActive: true,
    isFeatured: false,
    imageUrl: '',
    thumbnailUrl: ''
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        description: book.description || '',
        price: book.price?.toString() || '',
        originalPrice: book.originalPrice?.toString() || '',
        category: book.category?._id || book.category || '',
        publisher: book.publisher || '',
        publishedDate: book.publishedDate ? book.publishedDate.split('T')[0] : '',
        pages: book.pages?.toString() || '',
        language: book.language || 'English',
        format: book.format || 'Paperback',
        dimensions: book.dimensions || '',
        weight: book.weight?.toString() || '',
        stockQuantity: book.stockQuantity?.toString() || '',
        minStockLevel: book.minStockLevel?.toString() || '5',
        tags: book.tags?.join(', ') || '',
        isActive: book.isActive !== undefined ? book.isActive : true,
        isFeatured: book.isFeatured !== undefined ? book.isFeatured : false,
        imageUrl: book.imageUrl || '',
        thumbnailUrl: book.thumbnailUrl || ''
      });
    }
  }, [book]);

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Valid stock quantity is required';
    }

    // Validate ISBN format (basic check)
    if (formData.isbn && !/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)/.test(formData.isbn.replace(/[- ]/g, ''))) {
      newErrors.isbn = 'Invalid ISBN format';
    }

    // Validate price comparison
    if (formData.originalPrice && parseFloat(formData.originalPrice) < parseFloat(formData.price)) {
      newErrors.originalPrice = 'Original price should be higher than current price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const bookData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        pages: formData.pages ? parseInt(formData.pages) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        stockQuantity: parseInt(formData.stockQuantity),
        minStockLevel: parseInt(formData.minStockLevel),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        publishedDate: formData.publishedDate || undefined
      };

      await onSave(bookData);
      onClose();
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors({ submit: 'Failed to save book. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h3>{book ? 'Edit Book' : 'Add New Book'}</h3>
          <button className="close-btn" onClick={onClose} type="button">×</button>
        </div>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Basic Information */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#333' }}>Basic Information</h4>
              
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter book title"
                />
                {errors.title && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Enter author name"
                />
                {errors.author && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.author}</span>}
              </div>

              <div className="form-group">
                <label>ISBN *</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="Enter ISBN"
                />
                {errors.isbn && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.isbn}</span>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Publisher</label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Enter publisher name"
                />
              </div>

              <div className="form-group">
                <label>Published Date</label>
                <input
                  type="date"
                  name="publishedDate"
                  value={formData.publishedDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Details & Pricing */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#333' }}>Details & Pricing</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label>Original Price</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.originalPrice && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.originalPrice}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Pages</label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleChange}
                    placeholder="Number of pages"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Format</label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                >
                  <option value="Paperback">Paperback</option>
                  <option value="Hardcover">Hardcover</option>
                  <option value="E-book">E-book</option>
                  <option value="Audiobook">Audiobook</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Dimensions</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="e.g., 6 x 9 inches"
                  />
                </div>

                <div className="form-group">
                  <label>Weight (oz)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Weight in ounces"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter book description"
              rows="4"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e1e5e9', borderRadius: '6px', resize: 'vertical' }}
            />
            {errors.description && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.description}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                placeholder="Available stock"
                min="0"
              />
              {errors.stockQuantity && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.stockQuantity}</span>}
            </div>

            <div className="form-group">
              <label>Min Stock Level</label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                placeholder="Minimum stock"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Tag1, Tag2, Tag3"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Cover Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>Thumbnail URL</label>
              <input
                type="url"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://example.com/thumb.jpg"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', margin: '16px 0' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active (visible to customers)
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              Featured (show on homepage)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (book ? 'Update Book' : 'Create Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookForm;
