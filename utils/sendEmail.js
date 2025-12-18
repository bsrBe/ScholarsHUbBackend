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
        const port = Number(process.env.SMTP_PORT) || 587;
        
        console.log(`[Email] Attempting to send email to: ${options.email}`);
        console.log(`[Email] Using Host: ${process.env.SMTP_HOST}, Port: ${port}, Secure: ${port === 465}`);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
            connectionTimeout: 40000, // 40 seconds
        });

        const message = {
            from: `${process.env.FROM_NAME} <${process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        console.log(`✅ [Email] Success! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("❌ [Email] Failed to send email.");
        console.error(`[Email] Error Message: ${error.message}`);
        console.error(`[Email] Error Code: ${error.code}`);
        console.error(`[Email] Full Error:`, error);
        throw error;
    }
};

module.exports = sendEmail;