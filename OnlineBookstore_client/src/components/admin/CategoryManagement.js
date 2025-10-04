import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import '../../styles/AdminComponents.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    isActive: true,
    sortOrder: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }

    try {
      if (editingCategory) {
        await adminAPI.put(`/categories/${editingCategory._id}`, formData);
      } else {
        await adminAPI.post('/categories', formData);
      }
      
      await fetchCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', parentCategory: '', isActive: true, sortOrder: 0 });
      setErrors({});
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ submit: 'Failed to save category' });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentCategory: category.parentCategory?._id || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await adminAPI.delete(`/categories/${categoryId}`);
        await fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. It may be in use by books.');
      }
    }
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentCategory);
  };

  const getCategoryTree = () => {
    const parentCategories = categories.filter(cat => !cat.parentCategory);
    return parentCategories.map(parent => ({
      ...parent,
      children: categories.filter(cat => cat.parentCategory?._id === parent._id)
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading categories...</div>;
  }

  return (
    <div className="category-management">
      <div className="management-header">
        <h2>Category Management</h2>
        <button 
          className="primary-btn"
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setFormData({ name: '', description: '', parentCategory: '', isActive: true, sortOrder: 0 });
          }}
        >
          Add New Category
        </button>
      </div>

      {/* Category Tree View */}
      <div className="table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Parent Category</th>
              <th>Books Count</th>
              <th>Status</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCategoryTree().map(category => (
              <React.Fragment key={category._id}>
                {/* Parent Category */}
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>{category.description}</td>
                  <td>-</td>
                  <td>{category.booksCount || 0}</td>
                  <td>
                    <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(category)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(category._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Child Categories */}
                {category.children.map(child => (
                  <tr key={child._id}>
                    <td style={{ paddingLeft: '32px' }}>
                      ├─ {child.name}
                    </td>
                    <td>{child.description}</td>
                    <td>{category.name}</td>
                    <td>{child.booksCount || 0}</td>
                    <td>
                      <span className={`status-badge ${child.isActive ? 'active' : 'inactive'}`}>
                        {child.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{child.sortOrder}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEdit(child)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(child._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setErrors({});
                }}
              >
                ×
              </button>
            </div>

            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                />
                {errors.name && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows="3"
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e1e5e9', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                >
                  <option value="">None (Top Level Category)</option>
                  {getParentCategories()
                    .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                    .map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div style={{ margin: '16px 0' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active (visible to customers)
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
