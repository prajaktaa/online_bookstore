const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/adminAuth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all books with advanced filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.isFeatured !== undefined) {
      filter.isFeatured = req.query.isFeatured === 'true';
    }
    
    if (req.query.lowStock === 'true') {
      filter['stock.quantity'] = { $lte: 10 };
    }
    
    if (req.query.outOfStock === 'true') {
      filter['stock.quantity'] = { $lte: 0 };
    }
    
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort object
    let sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const books = await Book.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(filter);

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book });

  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create new book
router.post('/', async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Validate category exists
    if (bookData.category) {
      const category = await Category.findById(bookData.category);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Validate subcategory exists and belongs to category
    if (bookData.subcategory) {
      const subcategory = await Category.findById(bookData.subcategory);
      if (!subcategory || subcategory.parentCategory.toString() !== bookData.category) {
        return res.status(400).json({ error: 'Invalid subcategory' });
      }
    }

    const book = new Book(bookData);
    await book.save();

    const populatedBook = await Book.findById(book._id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Book created successfully',
      book: populatedBook
    });

  } catch (error) {
    console.error('Create book error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join('. ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'ISBN already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update book
router.put('/:id', async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Validate category exists if provided
    if (bookData.category) {
      const category = await Category.findById(bookData.category);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Validate subcategory exists and belongs to category if provided
    if (bookData.subcategory) {
      const subcategory = await Category.findById(bookData.subcategory);
      if (!subcategory || subcategory.parentCategory.toString() !== bookData.category) {
        return res.status(400).json({ error: 'Invalid subcategory' });
      }
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      bookData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      message: 'Book updated successfully',
      book
    });

  } catch (error) {
    console.error('Update book error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join('. ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'ISBN already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete book (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      message: 'Book deleted successfully',
      book
    });

  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Permanently delete book
router.delete('/:id/permanent', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      message: 'Book permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete book error:', error);
    res.status(500).json({ error: 'Failed to permanently delete book' });
  }
});

// Update book stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (operation === 'set') {
      book.stock.quantity = quantity;
    } else if (operation === 'add') {
      book.stock.quantity += quantity;
    } else if (operation === 'subtract') {
      if (book.availableStock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      book.stock.quantity -= quantity;
    } else {
      return res.status(400).json({ error: 'Invalid operation' });
    }

    book.updatedBy = req.user._id;
    await book.save();

    res.json({
      message: 'Stock updated successfully',
      book: {
        _id: book._id,
        title: book.title,
        stock: book.stock,
        availableStock: book.availableStock
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Bulk operations
router.post('/bulk/update', async (req, res) => {
  try {
    const { bookIds, updates } = req.body;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ error: 'Book IDs array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    const updateData = {
      ...updates,
      updatedBy: req.user._id
    };

    const result = await Book.updateMany(
      { _id: { $in: bookIds } },
      updateData
    );

    res.json({
      message: `${result.modifiedCount} books updated successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to perform bulk update' });
  }
});

// Get inventory summary
router.get('/inventory/summary', async (req, res) => {
  try {
    const summary = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          activeBooks: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          totalStock: { $sum: '$stock.quantity' },
          totalValue: {
            $sum: {
              $multiply: ['$price', '$stock.quantity']
            }
          },
          lowStockBooks: {
            $sum: {
              $cond: [
                { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
                1,
                0
              ]
            }
          },
          outOfStockBooks: {
            $sum: {
              $cond: [{ $lte: ['$stock.quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          bookCount: { $sum: 1 },
          totalStock: { $sum: '$stock.quantity' },
          totalValue: {
            $sum: {
              $multiply: ['$price', '$stock.quantity']
            }
          }
        }
      },
      { $sort: { bookCount: -1 } }
    ]);

    res.json({
      summary: summary[0] || {
        totalBooks: 0,
        activeBooks: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockBooks: 0,
        outOfStockBooks: 0
      },
      categoryStats
    });

  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory summary' });
  }
});

module.exports = router;
