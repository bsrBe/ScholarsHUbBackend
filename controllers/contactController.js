const sendEmail = require('../utils/sendEmail');

const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
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

    // Email content for admin
    const adminEmailContent = `
      <h2>New Contact Form Submission</h2>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Sender Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1565c0; margin-bottom: 15px;">Message</h3>
          <p style="color: #424242; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

    // Email content for user (confirmation)
    const userEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Thank you for contacting ScholarsHub</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your Message:</strong></p>
          <p style="font-style: italic; color: #555;">"${message}"</p>
        </div>
        
        <p>Best regards,<br>The ScholarsHub Team</p>
      </div>
    `;

    // Send response immediately to avoid timeout
    res.status(200).json({
      success: true,
      message: 'Message sent successfully!'
    });

    // Process emails in background
    Promise.all([
      // Send email to admin
      sendEmail({
        email: process.env.SMTP_EMAIL || process.env.EMAIL_USER, 
        subject: `New Contact Form Message from ${name}`,
        html: adminEmailContent,
        message: `New message from ${name} (${email}): ${message}`
      }),
      // Send confirmation email to user
      sendEmail({
        email: email,
        subject: 'We received your message - ScholarsHub',
        html: userEmailContent,
        message: `Dear ${name}, We have received your message: "${message}". We will get back to you soon.`
      })
    ]).catch(error => {
      console.error('Background email sending failed:', error);
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.'
      });
    }
  }
};

module.exports = {
  submitContactForm
};
