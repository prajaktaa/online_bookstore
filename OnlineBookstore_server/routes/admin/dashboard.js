const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/adminAuth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get basic counts
    const [
      totalBooks,
      activeBooks,
      totalCategories,
      totalUsers,
      totalOrders
    ] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments()
    ]);

    // Get sales statistics
    const salesStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrdersCompleted: { $sum: 1 }
        }
      }
    ]);

    // Get today's sales
    const todaysSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$total' },
          todayOrders: { $sum: 1 }
        }
      }
    ]);

    // Get this month's sales
    const monthSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          monthRevenue: { $sum: '$total' },
          monthOrders: { $sum: 1 }
        }
      }
    ]);

    // Get inventory alerts
    const inventoryAlerts = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          lowStockBooks: {
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
          outOfStockBooks: {
            $sum: {
              $cond: [{ $lte: ['$stock.quantity', 0] }, 1, 0]
            }
          },
          totalInventoryValue: {
            $sum: {
              $multiply: ['$price', '$stock.quantity']
            }
          }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id user total status createdAt');

    // Get top selling books
    const topBooks = await Book.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('title author price salesCount stock');

    const overview = {
      counts: {
        totalBooks,
        activeBooks,
        totalCategories,
        totalUsers,
        totalOrders
      },
      sales: {
        totalRevenue: salesStats[0]?.totalRevenue || 0,
        totalOrdersCompleted: salesStats[0]?.totalOrdersCompleted || 0,
        todayRevenue: todaysSales[0]?.todayRevenue || 0,
        todayOrders: todaysSales[0]?.todayOrders || 0,
        monthRevenue: monthSales[0]?.monthRevenue || 0,
        monthOrders: monthSales[0]?.monthOrders || 0
      },
      inventory: {
        lowStockBooks: inventoryAlerts[0]?.lowStockBooks || 0,
        outOfStockBooks: inventoryAlerts[0]?.outOfStockBooks || 0,
        totalInventoryValue: inventoryAlerts[0]?.totalInventoryValue || 0
      },
      recentOrders,
      topBooks
    };

    res.json({ overview });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Sales analytics
router.get('/analytics/sales', async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let dateFilter = {};
    let groupBy = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case 'month':
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case 'year':
          dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          };
          break;
      }
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get category-wise sales
    const categorySales = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'books',
          localField: 'items.book',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      { $unwind: '$bookInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'bookInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo._id',
          categoryName: { $first: '$categoryInfo.name' },
          revenue: {
            $sum: {
              $multiply: ['$items.quantity', '$items.price']
            }
          },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      salesData,
      categorySales
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Inventory analytics
router.get('/analytics/inventory', async (req, res) => {
  try {
    // Get stock level distribution
    const stockDistribution = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          excellent: {
            $sum: {
              $cond: [{ $gt: ['$stock.quantity', 50] }, 1, 0]
            }
          },
          good: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gt: ['$stock.quantity', '$stock.lowStockThreshold'] },
                    { $lte: ['$stock.quantity', 50] }
                  ]
                }, 
                1, 
                0
              ]
            }
          },
          low: {
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

    // Get books with low stock
    const lowStockBooks = await Book.find({
      isActive: true,
      $expr: {
        $and: [
          { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
          { $gt: ['$stock.quantity', 0] }
        ]
      }
    })
      .populate('category', 'name')
      .select('title author stock category price')
      .sort({ 'stock.quantity': 1 })
      .limit(20);

    // Get out of stock books
    const outOfStockBooks = await Book.find({
      isActive: true,
      'stock.quantity': { $lte: 0 }
    })
      .populate('category', 'name')
      .select('title author stock category price')
      .sort({ 'stock.quantity': 1 })
      .limit(20);

    // Get category-wise inventory value
    const categoryInventoryValue = await Book.aggregate([
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
          totalBooks: { $sum: 1 },
          totalStock: { $sum: '$stock.quantity' },
          totalValue: {
            $sum: {
              $multiply: ['$price', '$stock.quantity']
            }
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      stockDistribution: stockDistribution[0] || {
        excellent: 0,
        good: 0,
        low: 0,
        outOfStock: 0
      },
      lowStockBooks,
      outOfStockBooks,
      categoryInventoryValue
    });

  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

// Popular books report
router.get('/reports/popular-books', async (req, res) => {
  try {
    const { period = 'month', limit = 20 } = req.query;

    const now = new Date();
    let dateFilter = {};

    switch (period) {
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }

    const popularBooks = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.book',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: {
              $multiply: ['$items.quantity', '$items.price']
            }
          },
          avgPrice: { $avg: '$items.price' }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      { $unwind: '$bookInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'bookInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          _id: 1,
          title: '$bookInfo.title',
          author: '$bookInfo.author',
          category: '$categoryInfo.name',
          totalQuantity: 1,
          totalRevenue: 1,
          avgPrice: 1,
          currentStock: '$bookInfo.stock.quantity'
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ popularBooks });

  } catch (error) {
    console.error('Popular books report error:', error);
    res.status(500).json({ error: 'Failed to generate popular books report' });
  }
});

// Revenue report
router.get('/reports/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateFilter = {};
    let grouping = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
    }

    switch (groupBy) {
      case 'day':
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        grouping = {
          year: { $year: '$createdAt' }
        };
        break;
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: grouping,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get summary statistics
    const summary = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
          maxOrderValue: { $max: '$total' },
          minOrderValue: { $min: '$total' }
        }
      }
    ]);

    res.json({
      revenueData,
      summary: summary[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        maxOrderValue: 0,
        minOrderValue: 0
      }
    });

  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// Customer analytics
router.get('/analytics/customers', async (req, res) => {
  try {
    // Get customer statistics
    const customerStats = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          verifiedCustomers: {
            $sum: {
              $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0]
            }
          },
          activeCustomers: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get new registrations trend
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const registrationTrend = await User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newRegistrations: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top customers by order value
    const topCustomers = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      customerStats: customerStats[0] || {
        totalCustomers: 0,
        verifiedCustomers: 0,
        activeCustomers: 0
      },
      registrationTrend,
      topCustomers
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

module.exports = router;
