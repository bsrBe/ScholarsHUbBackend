const path = require('path');
const PartnershipRequest = require('../models/partnershipRequest');
const { uploadToCloudinary } = require("../utils/cloudinary");
const { upload } = require("../middlewares/multer");
const sendEmail = require("../utils/sendEmail");

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
              <li><strong>Email:</strong> <a href="mailto:partners@scholarshubglobal.com" style="color: #667eea;">partners@scholarshubglobal.com</a></li>
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
    await sendEmail({
      email: 'partners@scholarshubglobal.com',
      subject: `New Partnership Inquiry: ${organizationName}`,
      html: partnerEmailContent,
    });

    // Send confirmation email to the partner
    await sendEmail({
      email: email,
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
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const filename = `partner-${timestamp}-${random}`;
        
        try {
          const result = await uploadToCloudinary(file.buffer, filename, {
            folder: 'partner-documents'
          });
          
          uploadedFiles.push({
            type: 'Passport/ID Card',
            filename: result.public_id,
            originalName: file.originalname,
            url: result.secure_url,
            size: file.size,
            mimetype: file.mimetype,
            public_id: result.public_id
          });
        } catch (error) {
          console.error('Error uploading passport:', error);
        }
      }
      
      if (req.files.resume && req.files.resume.length > 0) {
        const file = req.files.resume[0];
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const filename = `partner-${timestamp}-${random}`;
        
        try {
          const result = await uploadToCloudinary(file.buffer, filename, {
            folder: 'partner-documents'
          });
          
          uploadedFiles.push({
            type: 'Resume/CV',
            filename: result.public_id,
            originalName: file.originalname,
            url: result.secure_url,
            size: file.size,
            mimetype: file.mimetype,
            public_id: result.public_id
          });
        } catch (error) {
          console.error('Error uploading resume:', error);
        }
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
      email: process.env.SMTP_EMAIL,
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
      await sendEmail(mailOptions);
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
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const filename = `partner-${timestamp}-${random}`;
        
        try {
          const result = await uploadToCloudinary(file.buffer, filename, {
            folder: 'partner-documents'
          });
          
          uploadedFiles.push({
            type: 'Business License',
            filename: result.public_id,
            originalName: file.originalname,
            url: result.secure_url,
            size: file.size,
            mimetype: file.mimetype,
            public_id: result.public_id
          });
        } catch (error) {
          console.error('Error uploading business license:', error);
        }
      }
      
      if (req.files.companyProfile && req.files.companyProfile.length > 0) {
        const file = req.files.companyProfile[0];
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const filename = `partner-${timestamp}-${random}`;
        
        try {
          const result = await uploadToCloudinary(file.buffer, filename, {
            folder: 'partner-documents'
          });
          
          uploadedFiles.push({
            type: 'Company Profile',
            filename: result.public_id,
            originalName: file.originalname,
            url: result.secure_url,
            size: file.size,
            mimetype: file.mimetype,
            public_id: result.public_id
          });
        } catch (error) {
          console.error('Error uploading company profile:', error);
        }
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
      email: process.env.SMTP_EMAIL,
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
      await sendEmail(mailOptions);
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

// Delete partnership request
const deletePartnershipRequest = async (req, res) => {
  try {
    const request = await PartnershipRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found'
      });
    }

    // Delete associated files from Cloudinary
    if (request.documents && request.documents.length > 0) {
      for (const doc of request.documents) {
        try {
          await cloudinary.uploader.destroy(doc.public_id);
        } catch (error) {
          console.error('Error deleting file from Cloudinary:', error);
        }
      }
    }

    await PartnershipRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Partnership request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the partnership request'
    });
  }
};

// Download file from Cloudinary
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Try to find by exact public_id match first (for full paths)
    let request = await PartnershipRequest.findOne({
      'documents.public_id': filename
    });
    
    if (request) {
      const document = request.documents.find(doc => doc.public_id === filename);
      if (document) {
        return res.redirect(document.url);
      }
    }
    
    // Try to find by filename match (for backward compatibility)
    request = await PartnershipRequest.findOne({
      'documents.filename': filename
    });
    
    if (request) {
      const document = request.documents.find(doc => doc.filename === filename);
      if (document) {
        return res.redirect(document.url);
      }
    }
    
    // If no exact match, try to find by partial match (extracted clean public_id)
    const cleanPublicId = filename.includes('/') ? filename.split('/').pop()?.split('.')[0] : filename.split('.')[0];
    
    request = await PartnershipRequest.findOne({
      'documents.public_id': { $regex: cleanPublicId }
    });
    
    if (request) {
      const document = request.documents.find(doc => 
        doc.public_id && doc.public_id.includes(cleanPublicId)
      );
      if (document) {
        return res.redirect(document.url);
      }
    }
    
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while downloading the file'
    });
  }
};

module.exports = {
  submitIndividualInquiry,
  submitCompanyInquiry,
  getAllPartnershipRequests,
  getPartnershipRequest,
  updateRequestStatus,
  deletePartnershipRequest,
  downloadFile,
  upload,
};
