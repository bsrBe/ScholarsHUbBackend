const TaskApplication = require("../models/taskApplication");
const { uploadToCloudinary } = require("../utils/cloudinary");
const ActivityLog = require("../models/activityLog");

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

    // Upload required files
    const requiredFields = ['passport', 'highschool_certificates', 'transcripts', 
      'recommendation_letter_1', 'recommendation_letter_2', 'student_cv_resume', 
      'statement_of_purpose', 'birth_certificate'];

    for (const field of requiredFields) {
      if (!fileFields[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
      const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
      uploadedFiles[field] = result.secure_url;
    }

    // Upload optional files
    const optionalFields = ['national_identity_card', 'english_proficiency'];
    for (const field of optionalFields) {
      if (fileFields[field]) {
        const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
        uploadedFiles[field] = result.secure_url;
      }
    }

    // Upload masters/phd specific files
    if (applicant_type === 'masters' || applicant_type === 'phd') {
      const mastersRequired = ['recommendation_letter_3', 'bachelors_degree_certificate', 'bachelors_degree_transcript'];
      for (const field of mastersRequired) {
        if (!fileFields[field]) {
          return res.status(400).json({ error: `${field} is required for ${applicant_type} applicants` });
        }
        const result = await uploadToCloudinary(fileFields[field].buffer, fileFields[field].originalname);
        uploadedFiles[field] = result.secure_url;
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

    const application = await TaskApplication.findByIdAndUpdate(
      id,
      {
        admin_response: response,
        status,
        reviewed_at: new Date(),
        reviewed_by: adminId
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

module.exports = {
  createTaskApplication,
  getUserTaskApplications,
  getTaskApplicationById,
  getAllTaskApplications,
  respondToTaskApplication,
  addMessage
};

