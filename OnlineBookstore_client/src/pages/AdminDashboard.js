import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardOverview from '../components/admin/DashboardOverview';
import BookManagement from '../components/admin/BookManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import OrderManagement from '../components/admin/OrderManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'books':
        return <BookManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.name}! Manage your bookstore from here.</p>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <nav className="dashboard-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">📊</span>
              Overview
            </button>
            
            <button
              className={`nav-item ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              <span className="nav-icon">📚</span>
              Books
            </button>
            
            <button
              className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <span className="nav-icon">🏷️</span>
              Categories
            </button>
            
            <button
              className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <span className="nav-icon">📦</span>
              Inventory
            </button>
            
            <button
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="nav-icon">📈</span>
              Reports & Analytics
            </button>
          </nav>
        </div>

        <div className="dashboard-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
