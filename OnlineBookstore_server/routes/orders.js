const express = require('express');
const router = express.Router();
const razorpay = require('../utils/razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');

// Create new order
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
