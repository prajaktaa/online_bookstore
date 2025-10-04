const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const Book = require('../../models/Book');
const User = require('../../models/User');
const { protect, isAdmin } = require('../../middleware/auth');

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.orderNumber) filter.orderNumber = new RegExp(req.query.orderNumber, 'i');
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.book', 'title author isbn')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single order details for admin
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
router.get('/:id', protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phoneNumber')
      .populate('items.book', 'title author isbn imageUrl')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const { status, note, trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // Update additional fields for shipped status
    if (status === 'shipped') {
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;
      if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Update order status
    await order.updateStatus(status, note, req.user._id);

    // Populate for response
    await order.populate('customer', 'name email');
    await order.populate('items.book', 'title author');

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add admin notes to order
// @route   PUT /api/admin/orders/:id/notes
// @access  Private/Admin
router.put('/:id/notes', protect, isAdmin, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.adminNotes = adminNotes;
    await order.save();

    res.json({
      message: 'Admin notes updated successfully',
      adminNotes: order.adminNotes
    });

  } catch (error) {
    console.error('Error updating admin notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Process refund
// @route   PUT /api/admin/orders/:id/refund
// @access  Private/Admin
router.put('/:id/refund', protect, isAdmin, async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Can only refund cancelled or returned orders' 
      });
    }

    if (refundAmount > order.total) {
      return res.status(400).json({ 
        message: 'Refund amount cannot exceed order total' 
      });
    }

    // Update order with refund information
    order.refundAmount = refundAmount;
    order.refundDate = new Date();
    order.paymentStatus = 'refunded';
    
    // Add to status history
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Refund processed: $${refundAmount}. Reason: ${refundReason}`,
      updatedBy: req.user._id
    });

    await order.save();

    // Restore book stock if cancelled
    if (order.status === 'cancelled') {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(
          item.book,
          { $inc: { stockQuantity: item.quantity } }
        );
      }
    }

    res.json({
      message: 'Refund processed successfully',
      refundAmount: order.refundAmount,
      refundDate: order.refundDate
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get order statistics for dashboard
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
router.get('/stats/dashboard', protect, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get order statistics
    const stats = await Order.getOrderStats(startDate, new Date());

    // Get status breakdown
    const statusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      createdAt: { $gte: startDate }
    })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer total status createdAt');

    // Get top customers
    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $project: {
          customer: { $arrayElemAt: ['$customer', 0] },
          totalOrders: 1,
          totalSpent: 1
        }
      }
    ]);

    res.json({
      summary: stats,
      statusBreakdown: statusStats,
      recentOrders,
      topCustomers,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Export orders to CSV
// @route   GET /api/admin/orders/export
// @access  Private/Admin
router.get('/export/csv', protect, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.book', 'title author isbn')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader = 'Order Number,Customer Name,Customer Email,Status,Total,Items Count,Order Date,Shipped Date,Delivered Date\n';
    const csvRows = orders.map(order => {
      const itemsCount = order.items.length;
      const orderDate = order.createdAt.toISOString().split('T')[0];
      const shippedDate = order.shippedDate ? order.shippedDate.toISOString().split('T')[0] : '';
      const deliveredDate = order.deliveredDate ? order.deliveredDate.toISOString().split('T')[0] : '';
      
      return `${order.orderNumber},${order.customer.name},${order.customer.email},${order.status},${order.total},${itemsCount},${orderDate},${shippedDate},${deliveredDate}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    res.send(csv);

  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
