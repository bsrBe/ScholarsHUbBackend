const mongoose = require('mongoose');

const duolingoRegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  status: {
    type: String,
    enum: ['pending', 'contacted'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DuolingoRegistration', duolingoRegistrationSchema);
