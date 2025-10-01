const express = require('express');
const Book = require('../models/Book');

const router = express.Router();

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed database with sample books
router.post('/seed', async (req, res) => {
  try {
    await Book.insertMany([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 299,
        description: 'A classic American novel'
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        price: 349,
        description: 'A gripping tale of racial injustice'
      },
      {
        title: '1984',
        author: 'George Orwell',
        price: 399,
        description: 'A dystopian social science fiction novel'
      }
    ]);
    
    res.json({ success: true, message: 'Books seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
