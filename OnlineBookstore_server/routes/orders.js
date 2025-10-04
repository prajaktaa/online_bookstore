const express = require('express');
const router = express.Router();
const razorpay = require('../utils/razorpay');
const Order = require('../models/Order');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// @desc    Get customer's orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user._id })
      .populate('items.book', 'title author imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user._id });

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

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate('items.book', 'title author imageUrl isbn');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    // Update order status
    order.cancellationReason = cancellationReason;
    await order.updateStatus('cancelled', `Order cancelled by customer: ${cancellationReason}`, req.user._id);

    // Restore book stock quantities
    for (const item of order.items) {
      await Book.findByIdAndUpdate(
        item.book,
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Request order return
// @route   PUT /api/orders/:id/return
// @access  Private
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { returnReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be returned (only delivered orders)
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Only delivered orders can be returned' 
      });
    }

    // Check return window (e.g., 30 days)
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (Date.now() - order.deliveredDate.getTime() > returnWindow) {
      return res.status(400).json({ 
        message: 'Return window has expired (30 days from delivery)' 
      });
    }

    // Update order status
    order.returnReason = returnReason;
    await order.updateStatus('returned', `Return requested by customer: ${returnReason}`, req.user._id);

    res.json({
      message: 'Return request submitted successfully',
      order
    });

  } catch (error) {
    console.error('Error requesting return:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get order tracking info
// @route   GET /api/orders/:id/tracking
// @access  Private
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).select('orderNumber status trackingNumber carrier estimatedDelivery statusHistory shippedDate deliveredDate');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      shippedDate: order.shippedDate,
      deliveredDate: order.deliveredDate,
      statusHistory: order.statusHistory
    });

  } catch (error) {
    console.error('Error fetching tracking info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order (legacy - keeping for Razorpay integration)
router.post('/create', async (req, res) => {
  try {
    const { items, amount } = req.body;
    
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR'
    });
    
    // Save order to database
    const newOrder = new Order({
      items,
      amount,
      razorpayOrderId: order.id
    });
    
    await newOrder.save();
    
    res.json({
      orderId: order.id,
      amount: order.amount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for payment verification
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    
    if (sig === expected) {
      // Payment verified successfully
      console.log('Payment webhook verified');
      res.json({ success: true });
    } else {
      console.log('Invalid webhook signature');
      res.status(400).send('Invalid signature');
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
