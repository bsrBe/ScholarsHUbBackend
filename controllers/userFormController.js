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
    
    const adminId = req.user._id;

    // Process uploaded documents if any
    let admin_response_documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, file.originalname);
          admin_response_documents.push(result.secure_url);
        } catch (uploadError) {
          console.error("Error uploading admin document:", uploadError);
        }
      }
    }

    const updatedForm = await UserForm.findByIdAndUpdate(
      req.params.id,
      {
        status,
        admin_response: response,
        isRead: false,
        reviewed_at: new Date(),
        reviewed_by: adminId,
        $push: { admin_response_documents: { $each: admin_response_documents } }
      },
      { new: true }
    ).populate('user_id', 'name email');

    if (!updatedForm) {
      return res.status(404).json({ message: "Form not found" });
    }
    
    // Send status update email
    if (updatedForm.email) {

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
              <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center; }
                  .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
                  .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
                  .content { padding: 40px 30px; }
                  .status-card { background-color: ${statusColor}15; border-left: 5px solid ${statusColor}; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; display: flex; align-items: center; }
                  .status-icon { font-size: 32px; margin-right: 15px; }
                  .status-text { color: ${statusColor}; font-weight: 700; font-size: 18px; margin: 0; }
                  .response-section { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 25px; }
                  .response-title { font-weight: 600; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; }
                  .response-content { color: #475569; font-style: italic; white-space: pre-wrap; }
                  .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
                  .logo { color: #1e3a8a; font-weight: 700; }
                  .divider { border: 0; height: 1px; background: #e2e8f0; margin: 25px 0; }
                  .greeting { font-size: 16px; margin-bottom: 20px; color: #1e293b; }
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
                          Hello <strong>${updatedForm.full_name}</strong>,
                      </div>
                      
                      <p>We hope this email finds you well. We wanted to update you on the status of your application submitted on ${new Date(updatedForm.createdAt).toLocaleDateString('en-US', { 
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
          email: updatedForm.email,
          subject: `${statusIcon} Application Status Update - ScholarHub`,
          html: message
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the request if email fails
      }
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


const markAsRead = async (req, res) => {
    try {
      const userId = req.user?._id;
      // Mark forms where user_id matches OR email matches (since forms support email-based lookup sometimes, but usually user_id is safer if consistent)
      // The getUserForms controller uses $or user_id OR email. We should likely do the same or just user_id if we trust auth.
      // Let's stick to user_id for now as email matching for updates is tricky without ensuring it's the right user.
      await UserForm.updateMany(
        { 
          $or: [
            { user_id: userId },
            { email: req.user.email }
          ],
          isRead: false 
        },
        { isRead: true }
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking forms as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  };

module.exports = { 
  createUserForm, 
  getAllForms, 
  getFormById, 
  getUserForms,
  respondToForm,
  downloadDocument,
  getDashboardStats,
  markAsRead
};
