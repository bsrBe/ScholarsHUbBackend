const DuolingoRegistration = require('../models/DuolingoRegistration');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const { ErrorResponse } = require('../utils/errorResponse');

// @desc    Submit Duolingo registration
// @route   POST /api/duolingo/register
// @access  Private
exports.submitRegistration = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and email'
      });
    }

    const registration = await DuolingoRegistration.create({
      userId: req.user.id,
      name,
      email
    });

    res.status(201).json({
      success: true,
      data: registration,
      message: 'We have received your submission, we will contact you'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Duolingo registrations
// @route   GET /api/duolingo/registrations
// @access  Private/Admin
exports.getRegistrations = async (req, res, next) => {
  try {
    const registrations = await DuolingoRegistration.find()
      .populate('userId', 'name email profileImageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send polished email to user
// @route   POST /api/duolingo/send-email
// @access  Private/Admin
exports.sendPolishedEmail = async (req, res, next) => {
  try {
    const { email, subject, content, examTime, examDate } = req.body;

    if (!email || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, subject, and content'
      });
    }

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 1px solid #eee; text-align: center;">
          <h2 style="margin: 0; color: #007bff;">ScholarsHub Global</h2>
        </div>
        <div style="padding: 30px;">
          <h3 style="margin-top: 0;">${subject}</h3>
          <p style="white-space: pre-wrap;">${content}</p>
          ${examDate || examTime ? `
            <div style="background-color: #f1f8ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h4 style="margin-top: 0; color: #0056b3;">Exam Details</h4>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${examDate ? `<li><strong>Date:</strong> ${examDate}</li>` : ''}
                ${examTime ? `<li><strong>Time:</strong> ${examTime}</li>` : ''}
              </ul>
            </div>
          ` : ''}
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; border-top: 1px solid #eee; text-align: center; font-size: 0.9em; color: #666;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ScholarsHub Global. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email,
      subject,
      message: content, // text version
      html: htmlContent
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Duolingo registration status
// @route   PUT /api/duolingo/status/:id
// @access  Private/Admin
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'contacted'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const registration = await DuolingoRegistration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};
