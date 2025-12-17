const TaskApplication = require("../models/taskApplication");
const { uploadToCloudinary } = require("../utils/cloudinary");
const ActivityLog = require("../models/activityLog");
const sendEmail = require("../utils/sendEmail");

// Create a new task application
const createTaskApplication = async (req, res) => {
  try {
    const { applicant_type } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!['undergraduate', 'masters', 'phd'].includes(applicant_type)) {
      return res.status(400).json({ error: "Invalid applicant type" });
    }

    // Check if user already has a pending application
    const existing = await TaskApplication.findOne({
      user_id: userId,
      status: { $in: ['pending', 'in_review'] }
    });

    if (existing) {
      return res.status(400).json({ error: "You already have a pending application" });
    }

    // Upload all files to Cloudinary
    const uploadPromises = [];
    const fileFields = {
      passport: req.files?.passport?.[0],
      national_identity_card: req.files?.national_identity_card?.[0],
      highschool_certificates: req.files?.highschool_certificates?.[0],
      transcripts: req.files?.transcripts?.[0],
      recommendation_letter_1: req.files?.recommendation_letter_1?.[0],
      recommendation_letter_2: req.files?.recommendation_letter_2?.[0],
      student_cv_resume: req.files?.student_cv_resume?.[0],
      statement_of_purpose: req.files?.statement_of_purpose?.[0],
      birth_certificate: req.files?.birth_certificate?.[0],
      english_proficiency: req.files?.english_proficiency?.[0],
      recommendation_letter_3: req.files?.recommendation_letter_3?.[0],
      bachelors_degree_certificate: req.files?.bachelors_degree_certificate?.[0],
      bachelors_degree_transcript: req.files?.bachelors_degree_transcript?.[0],
      diploma: req.files?.diploma?.[0],
      thesis: req.files?.thesis?.[0],
    };

    const uploadedFiles = {};

    // Upload required files (only passport, high school certificates, and transcripts are required)
    const requiredFields = ['passport', 'highschool_certificates', 'transcripts'];

    for (const field of requiredFields) {
      if (!fileFields[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
      const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
      uploadedFiles[field] = result.secure_url;
    }

    // Upload optional base files
    const optionalFields = ['national_identity_card', 'english_proficiency', 
      'recommendation_letter_1', 'recommendation_letter_2', 'student_cv_resume', 
      'statement_of_purpose', 'birth_certificate'];
    for (const field of optionalFields) {
      if (fileFields[field]) {
        const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
        uploadedFiles[field] = result.secure_url;
      }
    }

    // Upload masters/phd specific files
    if (applicant_type === 'masters' || applicant_type === 'phd') {
      const mastersRequired = ['bachelors_degree_certificate', 'bachelors_degree_transcript'];
      for (const field of mastersRequired) {
        if (!fileFields[field]) {
          return res.status(400).json({ error: `${field} is required for ${applicant_type} applicants` });
        }
        const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
        uploadedFiles[field] = result.secure_url;
      }

      // recommendation_letter_3 is now optional for masters/phd
      if (fileFields.recommendation_letter_3) {
        const result = await uploadToCloudinary(fileFields.recommendation_letter_3.buffer, fileFields.recommendation_letter_3.originalname);
        uploadedFiles.recommendation_letter_3 = result.secure_url;
      }

      if (fileFields.diploma) {
        const result = await uploadToCloudinary(fileFields.diploma.buffer, fileFields.diploma.originalname);
        uploadedFiles.diploma = result.secure_url;
      }
    }

    // Upload PhD specific file
    if (applicant_type === 'phd') {
      if (!fileFields.thesis) {
        return res.status(400).json({ error: "thesis is required for PhD applicants" });
      }
      const result = await uploadToCloudinary(fileFields.thesis.buffer, fileFields.thesis.originalname);
      uploadedFiles.thesis = result.secure_url;
    }

    // Create task application
    const taskApplication = new TaskApplication({
      user_id: userId,
      applicant_type,
      destination: req.body.destination || null,
      ...uploadedFiles,
      status: 'pending'
    });

    await taskApplication.save();

    await ActivityLog.create({
      actor: userId,
      action: "TASK_APPLICATION_CREATE",
      entityType: "TaskApplication",
      entityId: String(taskApplication._id),
      metadata: { applicant_type }
    });

    // Send confirmation email in background
    const user = await require("../models/userModel").findById(userId);
    if (user && user.email) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">📚 ScholarsHub</h1>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #2c3e50;">Application Received!</h2>
            <p>Dear ${user.name},</p>
            <p>Thank you for submitting your ${applicant_type} application to ScholarsHub.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Application Type:</strong> ${applicant_type.toUpperCase()}</p>
              <p style="margin: 10px 0 0 0;"><strong>Status:</strong> Pending Review</p>
            </div>
            
            <p>Our team will review your application and get back to you soon. You can check your application status anytime by logging into your account.</p>
            
            <p>Best regards,<br>The ScholarsHub Team</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">© 2024 ScholarsHub. Making educational dreams come true.</p>
          </div>
        </div>
      `;

      sendEmail({
        email: user.email,
        subject: "Application Received - ScholarsHub",
        html: emailContent,
        message: `Your ${applicant_type} application has been received and is pending review.`
      }).catch(err => console.error("Failed to send confirmation email:", err));
    }

    res.status(201).json({
      message: "Task application submitted successfully",
      data: taskApplication
    });
  } catch (error) {
    console.error("Error creating task application:", error);
    res.status(500).json({ error: "Failed to create task application" });
  }
};

// Get user's task applications
const getUserTaskApplications = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const applications = await TaskApplication.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate('reviewed_by', 'name email');

    res.json(applications);
  } catch (error) {
    console.error("Error fetching task applications:", error);
    res.status(500).json({ error: "Failed to fetch task applications" });
  }
};

// Get single task application by ID
const getTaskApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    const application = await TaskApplication.findById(id)
      .populate('user_id', 'name email')
      .populate('reviewed_by', 'name email')
      .populate('messages.sent_by', 'name email role');

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check access: user can only see their own, admin can see all
    if (!isAdmin && String(application.user_id._id) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(application);
  } catch (error) {
    console.error("Error fetching task application:", error);
    res.status(500).json({ error: "Failed to fetch task application" });
  }
};

// Admin: Get all task applications
const getAllTaskApplications = async (req, res) => {
  try {
    const { status, applicant_type, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (applicant_type) query.applicant_type = applicant_type;

    if (search) {
      query.$or = [
        { 'user_id.name': { $regex: search, $options: 'i' } },
        { 'user_id.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      TaskApplication.find(query)
        .populate('user_id', 'name email')
        .populate('reviewed_by', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TaskApplication.countDocuments(query)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error fetching task applications:", error);
    res.status(500).json({ error: "Failed to fetch task applications" });
  }
};

// Admin: Respond to task application
const respondToTaskApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body;
    const adminId = req.user?._id;

    if (!adminId || req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }


    // Process uploaded documents if any
    let admin_response_documents = [];
    if (req.files && req.files.length > 0) {
      const { uploadToCloudinary } = require("../utils/cloudinary");
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, file.originalname);
          admin_response_documents.push(result.secure_url);
        } catch (uploadError) {
          console.error("Error uploading admin document:", uploadError);
          // Continue with other files or fail? Failing might be safer to let admin know
          // But currently we'll log and continue to not block the whole response
        }
      }
    }

    const application = await TaskApplication.findByIdAndUpdate(
      id,
      {
        admin_response: response,
        status,
        isRead: false,
        reviewed_at: new Date(),
        reviewed_by: adminId,
        $push: { admin_response_documents: { $each: admin_response_documents } }
      },
      { new: true }
    ).populate('user_id', 'name email');

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    await ActivityLog.create({
      actor: adminId,
      action: "TASK_APPLICATION_UPDATE",
      entityType: "TaskApplication",
      entityId: String(id),
      metadata: { status, response }
    });

    // Send status update email in background
    if (application.user_id && application.user_id.email) {
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

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">📚 ScholarsHub</h1>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #2c3e50;">Application Status Update</h2>
            <p>Dear ${application.user_id.name},</p>
            
            <div style="background: ${statusColor}15; border: 2px solid ${statusColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">${statusIcon}</div>
              <p style="font-size: 20px; font-weight: 600; color: ${statusColor}; margin: 0;">${statusText}</p>
            </div>
            
            ${response ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message from our team:</strong></p>
              <p style="margin: 10px 0 0 0; font-style: italic;">${response}</p>
            </div>
            ` : ''}
            
            <p>You can view your application details by logging into your account on our website.</p>
            
            <p>Best regards,<br>The ScholarsHub Team</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">© 2024 ScholarsHub. Making educational dreams come true.</p>
          </div>
        </div>
      `;

      sendEmail({
        email: application.user_id.email,
        subject: `${statusIcon} Application Status Update - ScholarsHub`,
        html: emailContent,
        message: `Your application status has been updated to: ${statusText}. ${response || ''}`
      }).catch(err => console.error("Failed to send status update email:", err));
    }

    res.json({
      message: "Application updated successfully",
      data: application
    });
  } catch (error) {
    console.error("Error updating task application:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
};

// Add message to task application
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const application = await TaskApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check access
    if (!isAdmin && String(application.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    application.messages.push({
      from: isAdmin ? 'admin' : 'user',
      message: message.trim(),
      sent_by: userId
    });

    await application.save();

    await ActivityLog.create({
      actor: userId,
      action: "TASK_APPLICATION_MESSAGE",
      entityType: "TaskApplication",
      entityId: String(id),
      metadata: { from: isAdmin ? 'admin' : 'user' }
    });

    const updated = await TaskApplication.findById(id)
      .populate('messages.sent_by', 'name email role');

    res.json({
      message: "Message added successfully",
      data: updated
    });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Failed to add message" });
  }
};

// Upload additional documents
const uploadAdditionalDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await TaskApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check ownership
    if (String(application.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pdfFiles = req.files?.additional_documents_pdf || [];
    const imageFiles = req.files?.additional_documents_images || [];

    const pdfUrls = [];
    const imageUrls = [];

    // Upload PDFs
    for (const file of pdfFiles) {
      const result = await uploadToCloudinary(file.buffer, file.originalname, { folder: 'documents' });
      pdfUrls.push(result.secure_url);
    }

    // Upload Images
    for (const file of imageFiles) {
      const result = await uploadToCloudinary(file.buffer, file.originalname, { folder: 'documents' });
      imageUrls.push(result.secure_url);
    }

    // Update application
    if (pdfUrls.length > 0) {
      application.additional_documents_pdf.push(...pdfUrls);
    }
    if (imageUrls.length > 0) {
      application.additional_documents_images.push(...imageUrls);
    }

    await application.save();

    await ActivityLog.create({
      actor: userId,
      action: "TASK_APPLICATION_UPDATE_DOCS",
      entityType: "TaskApplication",
      entityId: String(id),
      metadata: { 
        pdf_count: pdfUrls.length,
        image_count: imageUrls.length
      }
    });

    res.json({
      message: "Additional documents uploaded successfully",
      data: application
    });

  } catch (error) {
    console.error("Error uploading additional documents:", error);
    res.status(500).json({ error: "Failed to upload documents" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    await TaskApplication.updateMany(
      { user_id: userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

module.exports = {
  createTaskApplication,
  getUserTaskApplications,
  getTaskApplicationById,
  getAllTaskApplications,
  respondToTaskApplication,
  addMessage,
  uploadAdditionalDocuments,
  markAsRead
};

