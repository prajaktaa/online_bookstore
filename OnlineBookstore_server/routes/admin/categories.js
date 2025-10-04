const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Book = require('../models/Book');
const { authenticateToken, requireAdmin } = require('../middleware/adminAuth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all categories with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.parentCategory) {
      filter.parentCategory = req.query.parentCategory;
    } else if (req.query.topLevel === 'true') {
      filter.parentCategory = null;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments(filter);

    res.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category tree (hierarchical structure)
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    // Build tree structure
    const categoryMap = {};
    const tree = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap[category._id] = {
        ...category.toObject(),
        children: []
      };
    });

    // Second pass: build tree
    categories.forEach(category => {
      if (category.parentCategory) {
        const parent = categoryMap[category.parentCategory._id];
        if (parent) {
          parent.children.push(categoryMap[category._id]);
        }
      } else {
        tree.push(categoryMap[category._id]);
      }
    });

    res.json({ tree });

  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ error: 'Failed to fetch category tree' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .populate('subcategories')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get book count for this category
    const bookCount = await Book.countDocuments({ 
      category: category._id, 
      isActive: true 
    });

    res.json({ 
      category: {
        ...category.toObject(),
        bookCount
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Validate parent category exists if provided
    if (categoryData.parentCategory) {
      const parentCategory = await Category.findById(categoryData.parentCategory);
      if (!parentCategory) {
        return res.status(400).json({ error: 'Invalid parent category' });
      }
    }

    const category = new Category(categoryData);
    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name slug')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Category created successfully',
      category: populatedCategory
    });

  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join('. ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Validate parent category exists if provided
    if (categoryData.parentCategory) {
      const parentCategory = await Category.findById(categoryData.parentCategory);
      if (!parentCategory) {
        return res.status(400).json({ error: 'Invalid parent category' });
      }

      // Prevent circular reference
      if (categoryData.parentCategory === req.params.id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true, runValidators: true }
    )
      .populate('parentCategory', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join('. ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Check if category has books
    const bookCount = await Book.countDocuments({ 
      category: req.params.id, 
      isActive: true 
    });

    if (bookCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${bookCount} active books. Please move or delete the books first.` 
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ 
      parentCategory: req.params.id, 
      isActive: true 
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${subcategoryCount} active subcategories. Please move or delete the subcategories first.` 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category deleted successfully',
      category
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Permanently delete category
router.delete('/:id/permanent', async (req, res) => {
  try {
    // Check if category has books
    const bookCount = await Book.countDocuments({ category: req.params.id });

    if (bookCount > 0) {
      return res.status(400).json({ 
        error: `Cannot permanently delete category with ${bookCount} books. Please delete all books first.` 
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ 
      parentCategory: req.params.id 
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        error: `Cannot permanently delete category with ${subcategoryCount} subcategories. Please delete all subcategories first.` 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete category error:', error);
    res.status(500).json({ error: 'Failed to permanently delete category' });
  }
});

// Reorder categories
router.post('/reorder', async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'Category IDs array is required' });
    }

    // Update sort order for each category
    const updatePromises = categoryIds.map((categoryId, index) => {
      return Category.findByIdAndUpdate(categoryId, { 
        sortOrder: index + 1,
        updatedBy: req.user._id
      });
    });

    await Promise.all(updatePromises);

    res.json({
      message: 'Categories reordered successfully'
    });

  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// Get category statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Get basic stats
    const stats = await Book.aggregate([
      { $match: { category: mongoose.Types.ObjectId(categoryId), isActive: true } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          totalStock: { $sum: '$stock.quantity' },
          totalValue: {
            $sum: {
              $multiply: ['$price', '$stock.quantity']
            }
          },
          averagePrice: { $avg: '$price' },
          totalSales: { $sum: '$salesCount' }
        }
      }
    ]);

    // Get stock status breakdown
    const stockStats = await Book.aggregate([
      { $match: { category: mongoose.Types.ObjectId(categoryId), isActive: true } },
      {
        $group: {
          _id: null,
          inStock: {
            $sum: {
              $cond: [{ $gt: ['$stock.quantity', '$stock.lowStockThreshold'] }, 1, 0]
            }
          },
          lowStock: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
                    { $gt: ['$stock.quantity', 0] }
                  ]
                }, 
                1, 
                0
              ]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $lte: ['$stock.quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalBooks: 0,
        totalStock: 0,
        totalValue: 0,
        averagePrice: 0,
        totalSales: 0
      },
      stockStats: stockStats[0] || {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      }
    });

  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

module.exports = router;
