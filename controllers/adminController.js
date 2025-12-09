const User = require("../models/userModel");
const Meeting = require("../models/meetingsModel");
const UserForm = require("../models/userForm");
const ActivityLog = require("../models/activityLog");
const { 
  forgotPassword: authForgotPassword, 
  resetPassword: authResetPassword,
  changePassword: authChangePassword
} = require("./authController");

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalMeetings, totalForms, meetingByStatusAgg] = await Promise.all([
      User.countDocuments(),
      Meeting.countDocuments(),
      UserForm.countDocuments(),
      Meeting.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const meetingsByStatus = meetingByStatusAgg.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, { scheduled: 0, completed: 0, cancelled: 0 });

    // 7/30 day counts
    const since = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [users7, users30, meetings7, meetings30, forms7, forms30] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: since(7) } }),
      User.countDocuments({ createdAt: { $gte: since(30) } }),
      Meeting.countDocuments({ createdAt: { $gte: since(7) } }),
      Meeting.countDocuments({ createdAt: { $gte: since(30) } }),
      UserForm.countDocuments({ createdAt: { $gte: since(7) } }),
      UserForm.countDocuments({ createdAt: { $gte: since(30) } }),
    ]);

    res.json({
      totals: { users: totalUsers, meetings: totalMeetings, forms: totalForms },
      meetingsByStatus,
      last7Days: { users: users7, meetings: meetings7, forms: forms7 },
      last30Days: { users: users30, meetings: meetings30, forms: forms30 },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const items = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name email role");
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getOverview = async (req, res) => {
  try {
    const [stats, activities] = await Promise.all([
      (async () => {
        const reqMock = { ...req };
        const resMock = {
          jsonPayload: null,
          json(payload) { this.jsonPayload = payload; },
          status() { return this; }
        };
        await getStats(reqMock, resMock);
        return resMock.jsonPayload;
      })(),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(20).populate("actor", "name email role"),
    ]);
    res.json({ stats, activities });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private/Admin
const changePassword = async (req, res, next) => {
  // Forward to auth controller's changePassword
  return authChangePassword(req, res, next);
};

// @desc    Forgot admin password
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Override res.send to intercept the response
  res.send = function(body) {
    // Only process if it's a successful response from auth controller
    if (res.statusCode === 200 && body && typeof body === 'object' && body.success) {
      // Check if user is admin before sending success response
      User.findOne({ email: req.body.email, role: 'admin' })
          .then(user => {
            if (!user) {
              console.log(`Password reset requested for non-admin email: ${req.body.email}`);
              return originalSend.call(res, {
                success: true,
                message: 'If an admin account with this email exists, a password reset link has been sent.'
              });
            }
            // If user is admin, send the original success response
            originalSend.call(res, body);
          })
          .catch(err => {
            console.error('Error checking admin status:', err);
            originalSend.call(res, body); // Fallback to original response
          });
    } else {
      // For non-200 or non-success responses, pass through
      originalSend.call(res, body);
    }
  };

  // Call the auth controller's forgotPassword
  return authForgotPassword(req, res, next);
};

// @desc    Reset admin password
// @route   PUT /api/admin/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Override res.send to intercept the response
  res.send = function(body) {
    // Only process if it's a successful response from auth controller
    if (res.statusCode === 200 && body && typeof body === 'object' && body.success) {
      // Update the success message to indicate admin password reset
      body.message = body.message.replace('password', 'admin password');
    }
    originalSend.call(res, body);
  };

  // Call the auth controller's resetPassword
  return authResetPassword(req, res, next);
};

module.exports = { 
  getStats, 
  getRecentActivities, 
  getOverview,
  changePassword,
  forgotPassword,
  resetPassword
};
