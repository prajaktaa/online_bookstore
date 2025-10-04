import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import '../../styles/AdminComponents.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    orderNumber: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    note: '',
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#ffc107' },
    { value: 'processing', label: 'Processing', color: '#17a2b8' },
    { value: 'shipped', label: 'Shipped', color: '#6f42c1' },
    { value: 'delivered', label: 'Delivered', color: '#28a745' },
    { value: 'cancelled', label: 'Cancelled', color: '#dc3545' },
    { value: 'returned', label: 'Returned', color: '#fd7e14' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/admin/orders?${queryParams}`);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/status`, statusUpdate);
      await fetchOrders();
      setShowStatusUpdate(false);
      setSelectedOrder(null);
      setStatusUpdate({ status: '', note: '', trackingNumber: '', carrier: '', estimatedDelivery: '' });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleRefund = async (orderId) => {
    const refundAmount = prompt('Enter refund amount:');
    const refundReason = prompt('Enter refund reason:');
    
    if (refundAmount && refundReason) {
      try {
        await api.put(`/admin/orders/${orderId}/refund`, {
          refundAmount: parseFloat(refundAmount),
          refundReason
        });
        await fetchOrders();
        alert('Refund processed successfully');
      } catch (error) {
        console.error('Error processing refund:', error);
        alert('Failed to process refund');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: statusOption?.color || '#6c757d',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        {statusOption?.label || status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</div>;
  }

  return (
    <div className="order-management">
      <div className="management-header">
        <h2>Order Management</h2>
        <div>
          <button 
            className="primary-btn"
            onClick={() => window.open('/api/admin/orders/export/csv', '_blank')}
            style={{ marginRight: '12px' }}
          >
            Export CSV
          </button>
          <button className="primary-btn" onClick={fetchOrders}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by order number..."
            value={filters.orderNumber}
            onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
          />
          
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="filter-select"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="filter-select"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                </td>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{order.customer?.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{order.customer?.email}</div>
                  </div>
                </td>
                <td>
                  <div>
                    <div>{order.items?.length || 0} items</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {order.items?.slice(0, 2).map(item => item.title).join(', ')}
                      {order.items?.length > 2 && '...'}
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{formatCurrency(order.total)}</strong>
                </td>
                <td>
                  {getStatusBadge(order.status)}
                </td>
                <td>
                  {formatDate(order.createdAt)}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setSelectedOrder(order);
                        setStatusUpdate({ 
                          status: order.status, 
                          note: '', 
                          trackingNumber: order.trackingNumber || '',
                          carrier: order.carrier || '',
                          estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.split('T')[0] : ''
                        });
                        setShowStatusUpdate(true);
                      }}
                      title="Update Status"
                    >
                      ✏️
                    </button>
                    {['cancelled', 'returned'].includes(order.status) && !order.refundAmount && (
                      <button 
                        className="action-btn"
                        onClick={() => handleRefund(order._id)}
                        title="Process Refund"
                        style={{ backgroundColor: '#28a745', color: 'white' }}
                      >
                        💰
                      </button>
                    )}
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
          disabled={!pagination.hasPrev}
          onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages} 
          ({pagination.totalOrders} total orders)
        </span>
        <button 
          disabled={!pagination.hasNext}
          onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
        >
          Next
        </button>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Order Details - {selectedOrder.orderNumber}</h3>
              <button className="close-btn" onClick={() => setShowOrderDetails(false)}>×</button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Customer Information */}
              <div style={{ marginBottom: '24px' }}>
                <h4>Customer Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <strong>Name:</strong> {selectedOrder.customer?.name}<br/>
                    <strong>Email:</strong> {selectedOrder.customer?.email}<br/>
                    <strong>Phone:</strong> {selectedOrder.customer?.phoneNumber || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}<br/>
                    <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}<br/>
                    <strong>Total:</strong> <strong>{formatCurrency(selectedOrder.total)}</strong>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: '24px' }}>
                  <h4>Shipping Address</h4>
                  <div>
                    {selectedOrder.shippingAddress.name}<br/>
                    {selectedOrder.shippingAddress.street}<br/>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br/>
                    {selectedOrder.shippingAddress.country}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: '24px' }}>
                <h4>Order Items</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>
                          <div>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>by {item.author}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatCurrency(item.price)}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '18px' }}>
                  <strong>Total: {formatCurrency(selectedOrder.total)}</strong>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4>Status History</h4>
                  <div>
                    {selectedOrder.statusHistory.map((history, index) => (
                      <div key={index} style={{ 
                        padding: '12px', 
                        border: '1px solid #eee', 
                        borderRadius: '4px', 
                        marginBottom: '8px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {getStatusBadge(history.status)}
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {formatDate(history.timestamp)}
                          </span>
                        </div>
                        {history.note && (
                          <div style={{ marginTop: '8px', fontSize: '14px' }}>{history.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowOrderDetails(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Order Status - {selectedOrder.orderNumber}</h3>
              <button className="close-btn" onClick={() => setShowStatusUpdate(false)}>×</button>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Note</label>
              <textarea
                value={statusUpdate.note}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, note: e.target.value })}
                placeholder="Add a note about this status change..."
                rows="3"
                style={{ width: '100%', padding: '10px 12px', border: '2px solid #e1e5e9', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>

            {statusUpdate.status === 'shipped' && (
              <>
                <div className="form-group">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    value={statusUpdate.trackingNumber}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div className="form-group">
                  <label>Carrier</label>
                  <select
                    value={statusUpdate.carrier}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, carrier: e.target.value })}
                  >
                    <option value="">Select Carrier</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estimated Delivery</label>
                  <input
                    type="date"
                    value={statusUpdate.estimatedDelivery}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, estimatedDelivery: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowStatusUpdate(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleStatusUpdate}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
