const UserForm = require("../models/userForm");
const User = require("../models/userModel");
const { uploadToCloudinary } = require("../utils/cloudinary");
const sendEmail = require("../utils/sendEmail");

// Handle user form submission
const createUserForm = async (req, res) => {
  try {
    // check file
    if (!req.file) {
      return res.status(400).json({ message: "Document is required" });
    }

    // upload file to cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // create document in MongoDB
    const newForm = new UserForm({
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      telegram_user_name: req.body.telegram_user_name,
      educational_status: req.body.educational_status,
      destination_country: req.body.destination_country,
      client_document: result.secure_url, // save Cloudinary URL
      additional_information: req.body.additional_information,
      user_id: req.user ? req.user.id : null, // Link to user if authenticated
      status: 'pending' // Set initial status
    });

    await newForm.save();

    res.status(201).json({
      message: "Form submitted successfully",
      data: newForm,
    });
} catch (err) {
  if (err.name === "TimeoutError") {
    return res.status(408).json({ success: false, error: "Upload timed out. Try again with a smaller file." });
  }
  console.error(err);
  res.status(400).json({ success: false, error: err.message });
}

};

// For admin: get all submissions with search and filtering
const getAllForms = async (req, res) => {
  try {
    const { search, status, country, educationStatus, page = 1, limit = 10 } = req.query;
    const query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add filters
    if (status) query.status = status;
    if (country) query.destination_country = country;
    if (educationStatus) query.educational_status = educationStatus;
    
    const skip = (page - 1) * limit;
    
    const forms = await UserForm.find(query)
      .populate('reviewed_by', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await UserForm.countDocuments(query);
    
    res.status(200).json({
      forms,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching forms" });
  }
};

// For admin: get single form by id
const getFormById = async (req, res) => {
  try {
    const form = await UserForm.findById(req.params.id)
      .populate('reviewed_by', 'name email');
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ message: "Error fetching form" });
  }
};

// Get user's own form submissions
const getUserForms = async (req, res) => {
  try {
    const forms = await UserForm.find({ 
      $or: [
        { user_id: req.user.id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user forms" });
  }
};

// Admin response to form submission
const respondToForm = async (req, res) => {
  try {
    const { response, status } = req.body;
    
    if (!response || !status) {
      return res.status(400).json({ 
        message: "Response and status are required" 
      });
    }
    
    if (!['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: pending, in_review, approved, rejected" 
      });
    }
    
    const form = await UserForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    
    // Update form with admin response
    const updatedForm = await UserForm.findByIdAndUpdate(
      req.params.id,
      {
        admin_response: response,
        status: status,
        reviewed_at: new Date(),
        reviewed_by: req.user.id
      },
      { new: true }
    ).populate('reviewed_by', 'name email');
    
    // Send email notification to user
    try {
      const statusColors = {
        'pending': '#f59e0b',
        'in_review': '#3b82f6', 
        'approved': '#10b981',
        'rejected': '#ef4444'
      };

      const statusIcons = {
        'pending': '⏳',
        'in_review': '🔍',
        'approved': '✅',
        'rejected': '❌'
      };

      const statusColor = statusColors[status] || '#6b7280';
      const statusIcon = statusIcons[status] || '📋';
      const statusText = status.replace('_', ' ').toUpperCase();

      const message = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f8fafc;
                    padding: 20px;
                }
                .email-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 25px;
                    color: #374151;
                }
                .status-card {
                    background: ${statusColor}15;
                    border: 2px solid ${statusColor};
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                    text-align: center;
                }
                .status-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .status-text {
                    font-size: 20px;
                    font-weight: 600;
                    color: ${statusColor};
                    margin: 0;
                }
                .response-section {
                    margin: 30px 0;
                }
                .response-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                }
                .response-content {
                    background: #f9fafb;
                    border-left: 4px solid #667eea;
                    padding: 15px 20px;
                    border-radius: 0 8px 8px 0;
                    font-style: italic;
                    color: #4b5563;
                }
                .footer {
                    background: #f8fafc;
                    padding: 25px 30px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }
                .footer p {
                    margin: 5px 0;
                    color: #6b7280;
                }
                .logo {
                    font-weight: 700;
                    color: #667eea;
                }
                .divider {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #667eea, transparent);
                    margin: 25px 0;
                    border: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>📚 ScholarHub</h1>
                    <p>Your Educational Journey Partner</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${form.full_name}</strong>,
                    </div>
                    
                    <p>We hope this email finds you well. We wanted to update you on the status of your application submitted on ${new Date(form.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}.</p>
                    
                    <div class="status-card">
                        <div class="status-icon">${statusIcon}</div>
                        <p class="status-text">${statusText}</p>
                    </div>
                    
                    <hr class="divider">
                    
                    <div class="response-section">
                        <div class="response-title">
                            💬 Message from our team:
                        </div>
                        <div class="response-content">
                            ${response}
                        </div>
                    </div>
                    
                    <hr class="divider">
                    
                    <p>If you have any questions or need further assistance, please don't hesitate to reach out to our support team. We're here to help you every step of the way.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul style="color: #4b5563; padding-left: 20px;">
                        ${status === 'approved' ? 
                          '<li>Check your email for further instructions</li><li>Prepare required documents as advised</li><li>Stay in touch with your assigned counselor</li>' :
                          status === 'in_review' ?
                          '<li>We are currently reviewing your application</li><li>You may be contacted for additional information</li><li>Please keep your documents ready</li>' :
                          status === 'rejected' ?
                          '<li>Review the feedback provided above</li><li>Consider reapplying with improvements</li><li>Contact us for guidance on next steps</li>' :
                          '<li>Your application is in queue for review</li><li>We will update you as soon as possible</li><li>Ensure your contact information is up to date</li>'
                        }
                    </ul>
                </div>
                
                <div class="footer">
                    <p><strong class="logo">ScholarHub Team</strong></p>
                    <p>Making your educational dreams come true</p>
                    <p style="font-size: 12px; margin-top: 15px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      await sendEmail({
        email: form.email,
        subject: `${statusIcon} Application Status Update - ScholarHub`,
        html: message
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      message: "Form updated successfully and user notified",
      data: updatedForm
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating form" });
  }
};

// Download document
const downloadDocument = async (req, res) => {
  try {
    const form = await UserForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    
    // Redirect to Cloudinary URL for download
    res.redirect(form.client_document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error downloading document" });
  }
};

// Get dashboard statistics (for admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalForms = await UserForm.countDocuments();
    const pendingForms = await UserForm.countDocuments({ status: 'pending' });
    const inReviewForms = await UserForm.countDocuments({ status: 'in_review' });
    const approvedForms = await UserForm.countDocuments({ status: 'approved' });
    const rejectedForms = await UserForm.countDocuments({ status: 'rejected' });
    
    // Get recent forms
    const recentForms = await UserForm.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('full_name email status createdAt destination_country');
    
    // Get forms by country
    const formsByCountry = await UserForm.aggregate([
      {
        $group: {
          _id: '$destination_country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get forms by educational status
    const formsByEducation = await UserForm.aggregate([
      {
        $group: {
          _id: '$educational_status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      overview: {
        totalForms,
        pendingForms,
        inReviewForms,
        approvedForms,
        rejectedForms
      },
      recentForms,
      formsByCountry,
      formsByEducation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
};

module.exports = { 
  createUserForm, 
  getAllForms, 
  getFormById, 
  getUserForms,
  respondToForm,
  downloadDocument,
  getDashboardStats
};
