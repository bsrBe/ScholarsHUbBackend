const mongoose = require('mongoose');

const partnershipRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['individual', 'company']
  },
  
  // Individual fields
  fullName: {
    type: String,
    required: function() {
      return this.type === 'individual';
    }
  },
  profession: {
    type: String,
    required: function() {
      return this.type === 'individual';
    }
  },
  expertise: [{
    type: String
  }],
  
  // Company fields
  organizationName: {
    type: String,
    required: function() {
      return this.type === 'company';
    }
  },
  contactPerson: {
    type: String,
    required: function() {
      return this.type === 'company';
    }
  },
  organizationType: {
    type: String,
    required: function() {
      return this.type === 'company';
    }
  },
  partnershipInterest: [{
    type: String
  }],
  website: {
    type: String,
    required: false
  },
  
  // Common fields
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: {
    type: Date
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
partnershipRequestSchema.index({ type: 1, status: 1 });
partnershipRequestSchema.index({ submittedAt: -1 });
partnershipRequestSchema.index({ email: 1 });

module.exports = mongoose.model('PartnershipRequest', partnershipRequestSchema);
