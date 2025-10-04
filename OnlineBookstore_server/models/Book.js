const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^(?:\d{9}[\dX]|\d{13})$/, 'Please enter a valid ISBN']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price must be positive']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  publishedDate: Date,
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1']
  },
  format: {
    type: String,
    enum: ['paperback', 'hardcover', 'ebook', 'audiobook'],
    default: 'paperback'
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
BookSchema.index({ title: 'text', author: 'text', description: 'text' });
BookSchema.index({ category: 1, isActive: 1 });
BookSchema.index({ price: 1 });
BookSchema.index({ salesCount: -1 });
BookSchema.index({ 'ratings.average': -1 });
BookSchema.index({ createdAt: -1 });

// Virtual for available stock
BookSchema.virtual('availableStock').get(function() {
  return this.stock.quantity - this.stock.reserved;
});

// Virtual for discount percentage
BookSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for low stock status
BookSchema.virtual('isLowStock').get(function() {
  return this.availableStock <= this.stock.lowStockThreshold;
});

// Virtual for out of stock status
BookSchema.virtual('isOutOfStock').get(function() {
  return this.availableStock <= 0;
});

// Method to update stock
BookSchema.methods.updateStock = async function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    if (this.availableStock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stock.quantity -= quantity;
  } else if (operation === 'add') {
    this.stock.quantity += quantity;
  }
  
  return await this.save();
};

// Method to reserve stock
BookSchema.methods.reserveStock = async function(quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock to reserve');
  }
  
  this.stock.reserved += quantity;
  return await this.save();
};

// Method to release reserved stock
BookSchema.methods.releaseReservedStock = async function(quantity) {
  const releaseQuantity = Math.min(quantity, this.stock.reserved);
  this.stock.reserved -= releaseQuantity;
  return await this.save();
};

// Ensure virtual fields are serialized
BookSchema.set('toJSON', { virtuals: true });
BookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', BookSchema);
