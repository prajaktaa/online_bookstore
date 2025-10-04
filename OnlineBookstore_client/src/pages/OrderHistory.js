import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const statusColors = {
    'pending': '#ffc107',
    'processing': '#17a2b8',
    'shipped': '#6f42c1',
    'delivered': '#28a745',
    'cancelled': '#dc3545',
    'returned': '#fd7e14'
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, pagination.currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/orders?page=${pagination.currentPage}&limit=10`);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await API.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    }
  };

  const fetchTrackingInfo = async (orderId) => {
    try {
      const response = await API.get(`/orders/${orderId}/tracking`);
      setTrackingInfo(response.data);
      setShowTrackingModal(true);
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      alert('Failed to load tracking information');
    }
  };

  const cancelOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await API.put(`/orders/${orderId}/cancel`, { cancellationReason: reason });
      await fetchOrders();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const requestReturn = async (orderId) => {
    const reason = prompt('Please provide a reason for return:');
    if (!reason) return;

    try {
      await API.put(`/orders/${orderId}/return`, { returnReason: reason });
      await fetchOrders();
      alert('Return request submitted successfully');
    } catch (error) {
      console.error('Error requesting return:', error);
      alert('Failed to request return: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status) => (
    <span 
      style={{ 
        backgroundColor: statusColors[status] || '#6c757d',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}
    >
      {status}
    </span>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '24px', color: '#333' }}>Order History</h2>

      {orders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>No Orders Found</h3>
          <p style={{ color: '#888' }}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <>
          {/* Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => (
              <div 
                key={order._id}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  overflow: 'hidden'
                }}
              >
                {/* Order Header */}
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                      Order #{order.orderNumber}
                    </h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {getStatusBadge(order.status)}
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div style={{ padding: '20px' }}>
                  {/* Order Items Preview */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          {item.book?.imageUrl && (
                            <img 
                              src={item.book.imageUrl} 
                              alt={item.title}
                              style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: '500' }}>{item.title}</div>
                            <div style={{ color: '#666', fontSize: '12px' }}>Qty: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => fetchOrderDetails(order._id)}
                      style={{
                        padding: '8px 16px',
                        border: '2px solid #667eea',
                        backgroundColor: 'transparent',
                        color: '#667eea',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      View Details
                    </button>

                    {['shipped', 'delivered'].includes(order.status) && (
                      <button
                        onClick={() => fetchTrackingInfo(order._id)}
                        style={{
                          padding: '8px 16px',
                          border: '2px solid #28a745',
                          backgroundColor: 'transparent',
                          color: '#28a745',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        Track Order
                      </button>
                    )}

                    {['pending', 'processing'].includes(order.status) && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        style={{
                          padding: '8px 16px',
                          border: '2px solid #dc3545',
                          backgroundColor: 'transparent',
                          color: '#dc3545',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        Cancel Order
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => requestReturn(order._id)}
                        style={{
                          padding: '8px 16px',
                          border: '2px solid #fd7e14',
                          backgroundColor: 'transparent',
                          color: '#fd7e14',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginTop: '32px',
              padding: '16px'
            }}>
              <button 
                disabled={!pagination.hasPrev}
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dee2e6',
                  backgroundColor: pagination.hasPrev ? 'white' : '#f8f9fa',
                  color: pagination.hasPrev ? '#333' : '#6c757d',
                  borderRadius: '6px',
                  cursor: pagination.hasPrev ? 'pointer' : 'not-allowed'
                }}
              >
                Previous
              </button>
              <span style={{ color: '#666' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button 
                disabled={!pagination.hasNext}
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dee2e6',
                  backgroundColor: pagination.hasNext ? 'white' : '#f8f9fa',
                  color: pagination.hasNext ? '#333' : '#6c757d',
                  borderRadius: '6px',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h3 style={{ margin: 0 }}>Order Details</h3>
              <button 
                onClick={() => setShowOrderDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Info */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>Order Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>Order Number:</strong> {selectedOrder.orderNumber}<br/>
                  <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}<br/>
                  <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}
                </div>
                <div>
                  <strong>Total:</strong> {formatCurrency(selectedOrder.total)}<br/>
                  {selectedOrder.shippedDate && (
                    <><strong>Shipped Date:</strong> {formatDate(selectedOrder.shippedDate)}<br/></>
                  )}
                  {selectedOrder.deliveredDate && (
                    <><strong>Delivered Date:</strong> {formatDate(selectedOrder.deliveredDate)}</>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>Items Ordered</h4>
              {selectedOrder.items?.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  {item.book?.imageUrl && (
                    <img 
                      src={item.book.imageUrl} 
                      alt={item.title}
                      style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px 0' }}>{item.title}</h5>
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>by {item.author}</p>
                    <div style={{ fontSize: '14px' }}>
                      <span>Quantity: {item.quantity}</span> | 
                      <span> Price: {formatCurrency(item.price)}</span> | 
                      <span> Subtotal: {formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            {selectedOrder.shippingAddress && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>Shipping Address</h4>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  {selectedOrder.shippingAddress.name}<br/>
                  {selectedOrder.shippingAddress.street}<br/>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br/>
                  {selectedOrder.shippingAddress.country}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => setShowOrderDetails(false)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && trackingInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h3 style={{ margin: 0 }}>Order Tracking</h3>
              <button 
                onClick={() => setShowTrackingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p><strong>Order:</strong> {trackingInfo.orderNumber}</p>
              <p><strong>Status:</strong> {getStatusBadge(trackingInfo.status)}</p>
              {trackingInfo.trackingNumber && (
                <p><strong>Tracking Number:</strong> {trackingInfo.trackingNumber}</p>
              )}
              {trackingInfo.carrier && (
                <p><strong>Carrier:</strong> {trackingInfo.carrier}</p>
              )}
              {trackingInfo.estimatedDelivery && (
                <p><strong>Estimated Delivery:</strong> {formatDate(trackingInfo.estimatedDelivery)}</p>
              )}
            </div>

            {trackingInfo.statusHistory && trackingInfo.statusHistory.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Status History</h4>
                {trackingInfo.statusHistory.map((history, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      {getStatusBadge(history.status)}
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(history.timestamp)}
                      </span>
                    </div>
                    {history.note && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{history.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => setShowTrackingModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
