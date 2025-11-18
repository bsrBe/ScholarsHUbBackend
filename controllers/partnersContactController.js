const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PartnershipRequest = require('../models/partnershipRequest');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'partner-documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).substring(1);
      return `partner-${timestamp}-${random}.${ext}`;
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Submit partners contact form
const submitPartnerInquiry = async (req, res) => {
  try {
    const {
      organizationName,
      contactPerson,
      email,
      phone,
      organizationType,
      partnershipInterest,
      message,
      country,
      website,
    } = req.body;

    // Validate required fields
    if (!organizationName || !contactPerson || !email || !country || !organizationType || !partnershipInterest || partnershipInterest.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields and select at least one partnership interest.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Prepare email content
    const partnershipInterests = partnershipInterest.map(interest => {
      const interestMap = {
        'university': 'University Partnership',
        'recruitment': 'Student Recruitment',
        'education': 'Education Services',
        'technology': 'Technology Integration',
        'marketing': 'Marketing Collaboration',
        'other': 'Other Opportunities'
      };
      return interestMap[interest] || interest;
    }).join(', ');

    // Email to partners team
    const partnerEmailContent = `
      <h2>New Partnership Inquiry</h2>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Organization Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Organization Name:</td>
              <td style="padding: 8px;">${organizationName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Contact Person:</td>
              <td style="padding: 8px;">${contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Email:</td>
              <td style="padding: 8px;">${email}</td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Phone:</td>
              <td style="padding: 8px;">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Organization Type:</td>
              <td style="padding: 8px;">${organizationType.charAt(0).toUpperCase() + organizationType.slice(1)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Country:</td>
              <td style="padding: 8px;">${country}</td>
            </tr>
            ${website ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #495057;">Website:</td>
              <td style="padding: 8px;"><a href="${website}" target="_blank">${website}</a></td>
            </tr>` : ''}
          </table>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1565c0; margin-bottom: 15px;">Partnership Interests</h3>
          <p style="color: #424242;">${partnershipInterests}</p>
        </div>
        
        ${message ? `
        <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #7b1fa2; margin-bottom: 15px;">Additional Information</h3>
          <p style="color: #424242; white-space: pre-wrap;">${message}</p>
        </div>` : ''}
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0;">
            <strong>Next Steps:</strong> Please review this inquiry and respond within 2-3 business days.
          </p>
        </div>
      </div>
    `;

    // Confirmation email to the partner
    const confirmationEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ScholarsHub Partnership</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for your interest in partnering with us!</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Inquiry Received</h2>
          
          <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
            Dear ${contactPerson},
          </p>
          
          <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
            Thank you for submitting a partnership inquiry to ScholarsHub. We have received your information and our partnership team is excited to review the potential collaboration opportunities.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">Your Submission Details:</h3>
            <ul style="color: #495057; line-height: 1.8;">
              <li><strong>Organization:</strong> ${organizationName}</li>
              <li><strong>Contact Person:</strong> ${contactPerson}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Organization Type:</strong> ${organizationType.charAt(0).toUpperCase() + organizationType.slice(1)}</li>
              <li><strong>Country:</strong> ${country}</li>
              <li><strong>Partnership Interests:</strong> ${partnershipInterests}</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-bottom: 15px;">What Happens Next?</h3>
            <ol style="color: #155724; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Our partnership team will review your inquiry within 2-3 business days</li>
              <li>We'll assess how our organizations can best collaborate</li>
              <li>You'll receive a personalized response with next steps</li>
              <li>We may schedule a call to discuss partnership opportunities in detail</li>
            </ol>
          </div>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">Need to Reach Us Sooner?</h3>
            <p style="color: #495057; line-height: 1.6;">
              Feel free to contact our partnership team directly at:
            </p>
            <ul style="color: #495057; line-height: 1.8;">
              <li><strong>Email:</strong> <a href="mailto:partners@scholarshub.com" style="color: #667eea;">partners@scholarshub.com</a></li>
              <li><strong>Phone:</strong> +1 (234) 567-890</li>
            </ul>
          </div>
          
          <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
            We look forward to exploring how we can work together to create amazing opportunities for students worldwide.
          </p>
          
          <p style="color: #495057; line-height: 1.6;">
            Best regards,<br>
            The ScholarsHub Partnership Team
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            This is an automated confirmation. We'll be in touch soon!
          </p>
          <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px;">
            &copy; 2024 ScholarsHub. Making educational dreams come true globally.
          </p>
        </div>
      </div>
    `;

    // Send email to partners team
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'partners@scholarshub.com',
      subject: `New Partnership Inquiry: ${organizationName}`,
      html: partnerEmailContent,
    });

    // Send confirmation email to the partner
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Partnership Inquiry Received - ScholarsHub',
      html: confirmationEmailContent,
    });

    res.status(200).json({
      success: true,
      message: 'Partnership inquiry submitted successfully. We will contact you within 2-3 business days.'
    });

  } catch (error) {
    console.error('Error submitting partner inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your inquiry. Please try again later.'
    });
  }
};

const submitIndividualInquiry = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      profession,
      expertise,
      message,
      country
    } = req.body;
    
    // Validate required fields first
    if (!fullName || !email || !country || !profession) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }
    
    // Handle uploaded files
    const uploadedFiles = [];
    
    if (req.files) {
      if (req.files.passport && req.files.passport.length > 0) {
        const file = req.files.passport[0];
        uploadedFiles.push({
          type: 'Passport/ID Card',
          filename: file.filename,
          originalName: file.originalname,
          url: file.path, // cloudinary returns URL in path
          size: file.size,
          mimetype: file.mimetype,
          public_id: file.filename // for cloudinary management
        });
      }
      
      if (req.files.resume && req.files.resume.length > 0) {
        const file = req.files.resume[0];
        uploadedFiles.push({
          type: 'Resume/CV',
          filename: file.filename,
          originalName: file.originalname,
          url: file.path, // cloudinary returns URL in path
          size: file.size,
          mimetype: file.mimetype,
          public_id: file.filename // for cloudinary management
        });
      }
    }
    
    // Parse expertise array
    const expertiseArray = expertise ? expertise.split(',').map(item => item.trim()) : [];
    
    // Save to database
    const partnershipRequest = new PartnershipRequest({
      type: 'individual',
      fullName,
      email,
      phone,
      profession,
      expertise: expertiseArray,
      message,
      country,
      documents: uploadedFiles
    });
    
    await partnershipRequest.save();
    
    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Individual Partnership Inquiry - ${fullName}`,
      html: `
        <h2>Individual Partnership Inquiry</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Profession:</strong> ${profession}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Areas of Expertise:</strong> ${expertiseArray.join(', ') || 'None specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${uploadedFiles.length > 0 ? `
          <h3>Uploaded Documents:</h3>
          <ul>
            ${uploadedFiles.map(file => `
              <li><strong>${file.type}:</strong> ${file.originalName} (${(file.size / 1024).toFixed(2)} KB)</li>
            `).join('')}
          </ul>
        ` : '<p><strong>Documents:</strong> None uploaded</p>'}
      `
    };
    
    // Send email (optional - don't fail if email fails)
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue with success response even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Your inquiry has been submitted successfully! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error submitting individual inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again later.'
    });
  }
};

// Submit company partnership inquiry with file uploads
const submitCompanyInquiry = async (req, res) => {
  try {
    const { organizationName, contactPerson, email, phone, organizationType, country, website, message, partnershipInterest } = req.body;
    
    // Validate required fields first
    if (!organizationName || !contactPerson || !email || !country || !organizationType) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }
    
    // Parse partnership interest array from JSON string
    const parsedPartnershipInterest = JSON.parse(partnershipInterest || '[]');
    
    // Handle uploaded files
    const uploadedFiles = [];
    
    if (req.files) {
      if (req.files.businessLicense && req.files.businessLicense.length > 0) {
        const file = req.files.businessLicense[0];
        uploadedFiles.push({
          type: 'Business License',
          filename: file.filename,
          originalName: file.originalname,
          url: file.path, // cloudinary returns URL in path
          size: file.size,
          mimetype: file.mimetype,
          public_id: file.filename // for cloudinary management
        });
      }
      
      if (req.files.companyProfile && req.files.companyProfile.length > 0) {
        const file = req.files.companyProfile[0];
        uploadedFiles.push({
          type: 'Company Profile',
          filename: file.filename,
          originalName: file.originalname,
          url: file.path, // cloudinary returns URL in path
          size: file.size,
          mimetype: file.mimetype,
          public_id: file.filename // for cloudinary management
        });
      }
    }
    
    // Save to database
    const partnershipRequest = new PartnershipRequest({
      type: 'company',
      organizationName,
      contactPerson,
      email,
      phone,
      organizationType,
      country,
      website,
      message,
      partnershipInterest: parsedPartnershipInterest,
      documents: uploadedFiles
    });
    
    await partnershipRequest.save();
    
    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Company Partnership Inquiry - ${organizationName}`,
      html: `
        <h2>Company Partnership Inquiry</h2>
        <p><strong>Organization:</strong> ${organizationName}</p>
        <p><strong>Contact Person:</strong> ${contactPerson}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Organization Type:</strong> ${organizationType}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Website:</strong> ${website || 'Not provided'}</p>
        <p><strong>Partnership Interest:</strong> ${parsedPartnershipInterest.join(', ') || 'None specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${uploadedFiles.length > 0 ? `
          <h3>Uploaded Documents:</h3>
          <ul>
            ${uploadedFiles.map(file => `
              <li><strong>${file.type}:</strong> ${file.originalName} (${(file.size / 1024).toFixed(2)} KB)</li>
            `).join('')}
          </ul>
        ` : '<p><strong>Documents:</strong> None uploaded</p>'}
      `
    };
    
    // Send email (optional - don't fail if email fails)
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue with success response even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Your inquiry has been submitted successfully! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error submitting company inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again later.'
    });
  }
};

// Get all partnership requests
const getAllPartnershipRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    
    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const requests = await PartnershipRequest.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await PartnershipRequest.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      message: 'Partnership requests retrieved successfully',
      data: requests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching partnership requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partnership requests'
    });
  }
};

// Download uploaded file
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find the file in database documents
    const partnershipRequest = await PartnershipRequest.findOne({
      'documents.filename': filename
    });
    
    if (!partnershipRequest) {
      return res.status(404).json({
        success: false,
        message: 'File not found in database'
      });
    }
    
    const document = partnershipRequest.documents.find(doc => doc.filename === filename);
    
    if (!document || !document.url) {
      return res.status(404).json({
        success: false,
        message: 'File URL not found'
      });
    }
    
    // Redirect to cloudinary URL
    res.redirect(document.url);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
};

// Update partnership request status
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updateData = {
      status,
      reviewedAt: new Date(),
      notes
    };
    
    // If user is authenticated, add reviewedBy
    if (req.user) {
      updateData.reviewedBy = req.user._id;
    }
    
    const request = await PartnershipRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: request
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
};

// Get single partnership request
const getPartnershipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await PartnershipRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Partnership request retrieved successfully',
      data: request
    });
  } catch (error) {
    console.error('Error fetching partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partnership request'
    });
  }
};

module.exports = {
  submitIndividualInquiry,
  submitCompanyInquiry,
  getAllPartnershipRequests,
  getPartnershipRequest,
  updateRequestStatus,
  downloadFile,
  upload,
};
