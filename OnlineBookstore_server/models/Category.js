const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String,
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
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

// Generate slug from name before saving
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Ensure virtual fields are serialized
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', CategorySchema);
