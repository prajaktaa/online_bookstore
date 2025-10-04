/**
 * index.js - Online Bookstore Server Main Entry Point
 * Author: Prajakta
 * Description: Express server with security middleware, API routes, and error handling
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(rateLimit({
  windowMs: 900000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(mongoSanitize());
app.use(bodyParser.json());

// Database connection
connectDB(process.env.MONGO_URI);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));

// Admin routes
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/books', require('./routes/admin/books'));
app.use('/api/admin/categories', require('./routes/admin/categories'));
app.use('/api/admin/orders', require('./routes/admin/orders'));

// Root route
app.get('/', (req, res) => {
  res.send('Bookstore API running');
});

// Start server with error handling
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    const newPort = PORT + 1;
    app.listen(newPort, () => {
      console.log(`Server started on port ${newPort}`);
      console.log(`API available at http://localhost:${newPort}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
