const mongoose = require('mongoose');

module.exports = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Server will continue running without database...');
    // Don't exit process, allow server to run for testing
  }
};