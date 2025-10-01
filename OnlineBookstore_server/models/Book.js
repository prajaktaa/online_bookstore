const mongoose = require('mongoose');
const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Book', BookSchema);
