const brevo = require("@getbrevo/brevo");

const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    
    // Debug logging (masked)
    if (!apiKey) {
      console.error("❌ [Brevo] BREVO_API_KEY is missing from environment variables!");
    } else {
      console.log(`[Brevo] API Key found. Length: ${apiKey.length}, Prefix: ${apiKey.substring(0, 10)}...`);
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );

    // Prepare email
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Use environment variables with fallbacks
    const fromEmail = process.env.FROM_EMAIL || "contact@scholarshubglobal.com";
    const fromName = process.env.FROM_NAME || "ScholarsHub Global";

    sendSmtpEmail.sender = {
      name: fromName,
      email: fromEmail,
    };
    
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.message;
    
    if (options.html) {
      sendSmtpEmail.htmlContent = options.html;
    }

    console.log(`[Brevo] Sending email to ${options.email} from ${fromEmail}...`);

    // Send email
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ [Brevo] Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    console.error("❌ [Brevo] Error sending email:");
    console.error({
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.body || error?.response?.data,
    });
    throw error;
  }
};

module.exports = sendEmail;
