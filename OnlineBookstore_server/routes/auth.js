const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phoneNumber
    });

    // Generate email verification token
    const emailVerificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response (in production, you'd send verification email here)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber
      },
      // In production, don't send this token in response - send via email
      emailVerificationToken: emailVerificationToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: errors.join('. ') 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email/Username and password are required' 
      });
    }

    // Find user by email or username
    // Special case for demo user: allow login with "demo" username
    let user;
    if (email.toLowerCase() === 'demo') {
      user = await User.findOne({ email: 'demo@example.com' });
    } else {
      user = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      });
    }
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid email/username or password' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ 
        error: 'Invalid email/username or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Verification token is required' 
      });
    }

    const user = await User.findByEmailVerificationToken(token);

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();

    res.json({ 
      message: 'Email verified successfully' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal whether user exists or not
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // In production, send email with reset link
    // For now, return the token (remove this in production)
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - send via email instead
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Reset token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findByPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({ 
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Change password (for logged-in users)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({ 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
      .populate('wishlist');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber,
        addresses: user.addresses,
        wishlist: user.wishlist,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, addresses } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (addresses) updateData.addresses = addresses;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        phoneNumber: user.phoneNumber,
        addresses: user.addresses
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: errors.join('. ') 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Logout (client-side token removal, but this endpoint can be used for logging)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    
    res.json({ 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user.id);
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// @desc    Create demo user (for development/demo purposes)
// @route   POST /api/auth/create-demo-user
// @access  Public
router.post('/create-demo-user', async (req, res) => {
  try {
    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });
    
    if (existingUser) {
      return res.json({ 
        message: 'Demo user already exists',
        email: 'demo@example.com'
      });
    }

    // Create demo user
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@example.com',
      username: 'demo',
      password: 'demo123',
      isEmailVerified: true,
      role: 'user'
    });

    await demoUser.save();

    res.status(201).json({
      message: 'Demo user created successfully',
      user: {
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role
      }
    });

  } catch (error) {
    console.error('Create demo user error:', error);
    res.status(500).json({ 
      error: 'Failed to create demo user' 
    });
  }
});

module.exports = router;
