import API from '../api';

// Admin Dashboard API
export const adminAPI = {
  // Dashboard Overview
  getDashboardOverview: () => API.get('/admin/dashboard/overview'),
  getSalesAnalytics: (params) => API.get('/admin/dashboard/analytics/sales', { params }),
  getInventoryAnalytics: () => API.get('/admin/dashboard/analytics/inventory'),
  getCustomerAnalytics: () => API.get('/admin/dashboard/analytics/customers'),

  // Reports
  getPopularBooksReport: (params) => API.get('/admin/dashboard/reports/popular-books', { params }),
  getRevenueReport: (params) => API.get('/admin/dashboard/reports/revenue', { params }),

  // Books Management
  getBooks: (params) => API.get('/admin/books', { params }),
  getBook: (id) => API.get(`/admin/books/${id}`),
  createBook: (bookData) => API.post('/admin/books', bookData),
  updateBook: (id, bookData) => API.put(`/admin/books/${id}`, bookData),
  deleteBook: (id) => API.delete(`/admin/books/${id}`),
  permanentDeleteBook: (id) => API.delete(`/admin/books/${id}/permanent`),
  updateBookStock: (id, stockData) => API.patch(`/admin/books/${id}/stock`, stockData),
  bulkUpdateBooks: (data) => API.post('/admin/books/bulk/update', data),
  getInventorySummary: () => API.get('/admin/books/inventory/summary'),

  // Categories Management
  getCategories: (params) => API.get('/admin/categories', { params }),
  getCategoryTree: () => API.get('/admin/categories/tree'),
  getCategory: (id) => API.get(`/admin/categories/${id}`),
  createCategory: (categoryData) => API.post('/admin/categories', categoryData),
  updateCategory: (id, categoryData) => API.put(`/admin/categories/${id}`, categoryData),
  deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
  permanentDeleteCategory: (id) => API.delete(`/admin/categories/${id}/permanent`),
  reorderCategories: (categoryIds) => API.post('/admin/categories/reorder', { categoryIds }),
  getCategoryStats: (id) => API.get(`/admin/categories/${id}/stats`)
};

export default adminAPI;
