const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{ book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, qty: Number }],
  amount: Number,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: { type: String, default: 'created' }
});
module.exports = mongoose.model('Order', OrderSchema);
