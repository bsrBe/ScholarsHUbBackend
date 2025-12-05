const mongoose = require('mongoose');
const encryptionUtil = require('../utils/encryption');

const chatMessageSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    set: function(value) {
      // Encrypt message before saving
      return encryptionUtil.encrypt(value);
    },
    get: function(value) {
      // Decrypt message when retrieving
      return encryptionUtil.decrypt(value);
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  read_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true }, // Ensure getters are used when converting to JSON
  toObject: { getters: true }
});

// Index for efficient queries
chatMessageSchema.index({ userId: 1, sent_at: 1 });
chatMessageSchema.index({ from: 1, sent_at: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
