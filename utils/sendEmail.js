// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT),
//       secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
//       auth: {
//         user: process.env.SMTP_EMAIL,
//         pass: process.env.SMTP_PASSWORD,
//       },
//       logger: true,
//       debug: true,
//     });

//     const message = {
//       from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//     };

//     const info = await transporter.sendMail(message);
//     console.log("Message sent: %s", info.messageId);
//   } catch (error) {
//     console.error("Error sending email:", error.message);
//     throw error;
//   }
// };

// module.exports = sendEmail;














const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // smtp.gmail.com
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // TLS will be used automatically with port 587
      auth: {
        user: process.env.SMTP_EMAIL,      // your Gmail
        pass: process.env.SMTP_PASSWORD,   // App Password
      },
      tls: {
        rejectUnauthorized: false, // avoids certificate errors
      },
    });

    // 2️⃣ Verify SMTP connection
    try {
      await transporter.verify();
      console.log("✅ SMTP connection successful");
    } catch (verifyErr) {
      console.error("❌ SMTP verify failed", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_EMAIL,
        message: verifyErr?.message,
        code: verifyErr?.code,
        command: verifyErr?.command,
      });
      throw verifyErr;
    }

    // 3️⃣ Prepare email
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, // optional HTML content
    };

    // 4️⃣ Send email
    const info = await transporter.sendMail(message);
    console.log("📧 Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
    });
    throw error; // Re-throw to handle in calling function
  }
};

module.exports = sendEmail;