const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Middleware to check if user is superadmin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Allow access if user is admin/superadmin or owns the resource
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
  const isOwner = req.user._id.toString() === req.params.userId;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireOwnershipOrAdmin
};
