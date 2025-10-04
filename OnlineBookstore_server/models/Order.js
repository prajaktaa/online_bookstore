const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: String,
  isbn: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Order Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Shipping Information
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'United States'
    },
    phoneNumber: String
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'razorpay', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,

  // Tracking Information
  trackingNumber: String,
  carrier: String,
  estimatedDelivery: Date,

  // Status History
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Notes and Special Instructions
  customerNotes: String,
  adminNotes: String,
  
  // Cancellation/Return Information
  cancellationReason: String,
  returnReason: String,
  refundAmount: Number,
  refundDate: Date,

  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date,
  cancelledDate: Date
}, {
  timestamps: true
});

// Generate unique order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of the day
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  
  next();
});

// Update status with history tracking
OrderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status changed from ${oldStatus} to ${newStatus}`,
    updatedBy: updatedBy
  });
  
  // Update relevant dates
  switch (newStatus) {
    case 'shipped':
      this.shippedDate = new Date();
      break;
    case 'delivered':
      this.deliveredDate = new Date();
      break;
    case 'cancelled':
      this.cancelledDate = new Date();
      break;
  }
  
  return this.save();
};

// Calculate totals
OrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  return this;
};

// Static method to get order statistics
OrderSchema.statics.getOrderStats = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        statusBreakdown: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        totalOrders: 1,
        totalRevenue: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        statusBreakdown: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    statusBreakdown: []
  };
};

// Index for better query performance
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
