const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['تم', 'مرفوض', 'معلق'],
    default: 'تم'
  },
  transactionId: {
    type: String,
    unique: true,
    default: function() {
      return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6);
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);