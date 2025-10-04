import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/AdminComponents.css';

const DashboardOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardOverview();
      setOverview(response.data.overview);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (!overview) return <div>No data available</div>;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <h2>Dashboard Overview</h2>
        <button onClick={fetchDashboardData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📚</div>
          <div className="metric-content">
            <h3>Total Books</h3>
            <div className="metric-value">{overview.counts.totalBooks}</div>
            <div className="metric-subtitle">
              {overview.counts.activeBooks} active
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">
              {formatCurrency(overview.sales.totalRevenue)}
            </div>
            <div className="metric-subtitle">
              {overview.sales.totalOrdersCompleted} orders completed
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>Inventory Value</h3>
            <div className="metric-value">
              {formatCurrency(overview.inventory.totalInventoryValue)}
            </div>
            <div className="metric-subtitle">
              {overview.inventory.lowStockBooks} low stock items
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <div className="metric-value">{overview.counts.totalUsers}</div>
            <div className="metric-subtitle">Registered customers</div>
          </div>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="performance-section">
        <h3>Today's Performance</h3>
        <div className="performance-grid">
          <div className="performance-item">
            <span className="performance-label">Revenue</span>
            <span className="performance-value">
              {formatCurrency(overview.sales.todayRevenue)}
            </span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Orders</span>
            <span className="performance-value">
              {overview.sales.todayOrders}
            </span>
          </div>
          <div className="performance-item">
            <span className="performance-label">This Month</span>
            <span className="performance-value">
              {formatCurrency(overview.sales.monthRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(overview.inventory.lowStockBooks > 0 || overview.inventory.outOfStockBooks > 0) && (
        <div className="alerts-section">
          <h3>⚠️ Inventory Alerts</h3>
          <div className="alerts-grid">
            {overview.inventory.lowStockBooks > 0 && (
              <div className="alert-item warning">
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <div className="alert-title">Low Stock Items</div>
                  <div className="alert-description">
                    {overview.inventory.lowStockBooks} books are running low on stock
                  </div>
                </div>
              </div>
            )}
            
            {overview.inventory.outOfStockBooks > 0 && (
              <div className="alert-item error">
                <span className="alert-icon">🚫</span>
                <div className="alert-content">
                  <div className="alert-title">Out of Stock</div>
                  <div className="alert-description">
                    {overview.inventory.outOfStockBooks} books are out of stock
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="activity-grid">
          {/* Recent Orders */}
          <div className="activity-card">
            <h3>Recent Orders</h3>
            <div className="activity-list">
              {overview.recentOrders.length > 0 ? (
                overview.recentOrders.map((order) => (
                  <div key={order._id} className="activity-item">
                    <div className="activity-info">
                      <div className="activity-title">
                        Order #{order._id.slice(-6)}
                      </div>
                      <div className="activity-subtitle">
                        {order.user?.name || 'Unknown User'}
                      </div>
                    </div>
                    <div className="activity-meta">
                      <div className="activity-value">
                        {formatCurrency(order.total)}
                      </div>
                      <div className={`activity-status ${order.status}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">No recent orders</div>
              )}
            </div>
          </div>

          {/* Top Selling Books */}
          <div className="activity-card">
            <h3>Top Selling Books</h3>
            <div className="activity-list">
              {overview.topBooks.length > 0 ? (
                overview.topBooks.map((book, index) => (
                  <div key={book._id} className="activity-item">
                    <div className="activity-info">
                      <div className="activity-title">
                        {index + 1}. {book.title}
                      </div>
                      <div className="activity-subtitle">
                        by {book.author}
                      </div>
                    </div>
                    <div className="activity-meta">
                      <div className="activity-value">
                        {book.salesCount} sold
                      </div>
                      <div className="activity-status">
                        {book.stock.quantity} in stock
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">No sales data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
