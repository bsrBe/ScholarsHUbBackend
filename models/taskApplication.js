const mongoose = require("mongoose");

const taskApplicationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicant_type: {
    type: String,
    enum: ['undergraduate', 'masters', 'phd'],
    required: true
  },
  destination: {
    type: String,
    required: false
  },
  // Common documents for all types
  passport: {
    type: String, // Cloudinary URL
    required: true
  },
  national_identity_card: {
    type: String, // Cloudinary URL
    required: false
  },
  highschool_certificates: {
    type: String, // Cloudinary URL
    required: true
  },
  transcripts: {
    type: String, // Cloudinary URL
    required: true
  },
  recommendation_letter_1: {
    type: String, // Cloudinary URL
    required: false
  },
  recommendation_letter_2: {
    type: String, // Cloudinary URL
    required: false
  },
  student_cv_resume: {
    type: String, // Cloudinary URL
    required: false
  },
  statement_of_purpose: {
    type: String, // Cloudinary URL
    required: false
  },
  birth_certificate: {
    type: String, // Cloudinary URL
    required: false
  },
  english_proficiency: {
    type: String, // Cloudinary URL
    required: false
  },
  // Masters and PhD additional documents
  recommendation_letter_3: {
    type: String, // Cloudinary URL
    required: false
  },
  bachelors_degree_certificate: {
    type: String, // Cloudinary URL
    required: false
  },
  bachelors_degree_transcript: {
    type: String, // Cloudinary URL
    required: false
  },
  diploma: {
    type: String, // Cloudinary URL
    required: false
  },
  // PhD additional document
  thesis: {
    type: String, // Cloudinary URL
    required: false
  },
  // Additional optional documents
  additional_documents_pdf: [{
    type: String // Cloudinary URLs
  }],
  additional_documents_images: [{
    type: String // Cloudinary URLs
  }],
  // Status and admin response
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: true
  },
  admin_response: {
    type: String,
    required: false,
    trim: true
  },
  admin_response_documents: [{
    type: String // Cloudinary URLs
  }],
  reviewed_at: {
    type: Date,
    required: false
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Messages between user and admin
  messages: [{
    from: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    sent_at: {
      type: Date,
      default: Date.now
    },
    sent_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("TaskApplication", taskApplicationSchema);

