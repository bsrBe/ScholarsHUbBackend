// const brevo = require("@getbrevo/brevo");

// const sendEmail = async (options) => {
//   try {
//     // Initialize Brevo API client
//     const apiInstance = new brevo.TransactionalEmailsApi();
//     apiInstance.setApiKey(
//       brevo.TransactionalEmailsApiApiKeys.apiKey,
//       process.env.BREVO_API_KEY
//     );

//     // Prepare email
//     const sendSmtpEmail = new brevo.SendSmtpEmail();
//     sendSmtpEmail.sender = {
//       name: process.env.FROM_NAME,
//       email: process.env.FROM_EMAIL,
//     };
//     sendSmtpEmail.to = [{ email: options.email }];
//     sendSmtpEmail.subject = options.subject;
//     sendSmtpEmail.textContent = options.message;
//     if (options.html) {
//       sendSmtpEmail.htmlContent = options.html;
//     }

//     // Send email
//     const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
//     console.log("📧 Email sent successfully via Brevo:", response.messageId);
//     return response;
//   } catch (error) {
//     console.error("❌ Error sending email:", {
//       message: error?.message,
//       status: error?.response?.status,
//       statusText: error?.response?.statusText,
//       body: error?.response?.body,
//       data: error?.response?.data,
//     });
//     throw error;
//   }
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    try {
      const transporter = nodemailer.createTransport({
  host: "mail.scholarshubglobal.com",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  // tls: {
  //   rejectUnauthorized: true,
  // },
});

        const message = {
            from: `${process.env.FROM_NAME} <${process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

module.exports = sendEmail;