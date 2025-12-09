const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto"); 

const register = async (req ,res , next) => {
    const {name , email , password ,  role , profileImageUrl} = req.body
    try {
        const user = await User.create({name , email , password,  role , profileImageUrl})

        // Generate confirmation token and save it
        const confirmationToken = user.generateEmailConfirmationToken();
        await user.save({ validateBeforeSave: false });

        // Send confirmation email asynchronously (don't wait for it)
        const confirmUrl = `${req.protocol}://${req.get("host")}/api/auth/confirmEmail/${confirmationToken}`;
        const message = `Click the link to confirm your email: ${confirmUrl}`;
        const html = `
  <html>
    <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; padding:24px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="margin-top:0; color:#111827;">Confirm your email</h2>
        <p style="color:#4b5563; line-height:1.5;">
          Thanks for signing up to ScholarsHub. Please click the button below to verify your email address.
        </p>
        <p style="text-align:center; margin:24px 0;">
          <a href="${confirmUrl}"
             style="display:inline-block; padding:12px 24px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:999px; font-weight:600;">
            Confirm email
          </a>
        </p>
        <p style="color:#6b7280; font-size:12px; line-height:1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${confirmUrl}" style="color:#2563eb; word-break:break-all;">${confirmUrl}</a>
        </p>
      </div>
    </body>
  </html>
        `;

        // Fire and forget - send email in background
        sendEmail({
            email: user.email,
            subject: "Email Confirmation",
            message,
            html
        }).catch((mailErr) => {
            // Log error but don't block the response
            console.error("Error sending confirmation email (async):", mailErr?.message || mailErr);
        });

        // Return response immediately
        return res.status(200).json({
            success: true,
            msg: "Registration successful. Please check your email to confirm your account."
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, msg: "Email already Registered" });
        }
        return res.status(500).json({message : error.message})
    }
}

const Login = async (req, res, next) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    try {
        // Input validation
        if (!email || !password) {
            console.log('Missing credentials - email:', !!email, 'password:', !!password);
            return res.status(400).json({ success: false, msg: "Please provide both email and password" });
        }

        console.log('Looking up user in database...');
        const user = await User.findOne({ email }).select("+password");
        
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(401).json({ success: false, msg: "Invalid credentials" });
        }

        console.log('User found, checking password...');
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ success: false, msg: "Invalid credentials" });
        }

        if (!user.isEmailConfirmed) {
            console.log('Email not confirmed for user:', email);
            
            // In development, allow login without email confirmation
            if (process.env.NODE_ENV === "development") {
                console.log('Development mode: Bypassing email confirmation');
            } else {
                // Generate confirmation token and save it
                const confirmationToken = user.generateEmailConfirmationToken();
                await user.save({ validateBeforeSave: false });

                const confirmUrl = `${req.protocol}://${req.get("host")}/api/auth/confirmEmail/${confirmationToken}`;
                const message = `Click the link to confirm your email: ${confirmUrl}`;
                const html = `
  <html>
    <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; padding:24px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="margin-top:0; color:#111827;">Confirm your email</h2>
        <p style="color:#4b5563; line-height:1.5;">
          Please click the button below to verify your email address.
        </p>
        <p style="text-align:center; margin:24px 0;">
          <a href="${confirmUrl}"
             style="display:inline-block; padding:12px 24px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:999px; font-weight:600;">
            Confirm email
          </a>
        </p>
        <p style="color:#6b7280; font-size:12px; line-height:1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${confirmUrl}" style="color:#2563eb; word-break:break-all;">${confirmUrl}</a>
        </p>
      </div>
    </body>
  </html>
                `;

                // Send email asynchronously (don't wait for it)
                sendEmail({
                    email: user.email,
                    subject: "Email Confirmation",
                    message,
                    html
                }).catch((e) => {
                    // Log error but don't block the response
                    console.error("Error sending confirmation email (async):", e?.message || e);
                });

                // Return response immediately
                return res.status(403).json({ 
                    success: false,
                    msg: "Please verify your email. Confirmation link sent." 
                });
            }
        }

        console.log('User authenticated successfully, generating token...');
        
        // If we get here, login is successful
        const token = user.getSignedJwtToken();
        
        // Set cookie options
        const options = {
            expires: new Date(
                Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        };
        
        // Remove password from output
        user.password = undefined;
        
        // Prepare user data for response
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            isEmailConfirmed: user.isEmailConfirmed
        };
        
        console.log('Login successful, sending response for user:', user.email);
        console.log('Token generated:', token ? 'Yes' : 'No');
        
        // Send token in cookie and JSON response
        const response = {
            success: true,
            token,
            user: userData
        };
        
        console.log('Sending login response:', JSON.stringify(response, null, 2));
        
        return res.status(200)
            .cookie('token', token, options)
            .json(response);
            
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            msg: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
    


const getMe = async (req, res, next) => {
    try {
        // Get token from header or cookie
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.cookieToken) {
            token = req.cookies.cookieToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from the token
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImageUrl: user.profileImageUrl,
                isEmailConfirmed: user.isEmailConfirmed
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, invalid token'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const sendTokenResponse = (user , statusCode , res) => {
    const token = user.getSignedJwtToken();
    const days = Number(process.env.JWT_COOKIES_EXPIRE || 30);
    const isDev = process.env.NODE_ENV === "development";
    const options = {
        expires : new Date (Date.now() +  days * 24 * 60 * 60 * 1000),
        httpOnly : true,
        sameSite: isDev ? "Lax" : "None",
        secure: !isDev,
    }

      // Set the cookie and log it for debugging
    // res.cookie("cookieToken", token, options);
    // console.log("Cookie Set:", res.getHeaders()["set-cookie"]);

    
    res.
    status(statusCode)
    .cookie("cookieToken" , token , options)
    .json({user , token})
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email address'
            });
        }

        const user = await User.findOne({ email });

        // Don't reveal if the email exists or not for security reasons
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        // Generate and save reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
        
        // Create email content
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #1a365d; margin-top: 0;">🔒 Password Reset Request</h2>
                <p>Hello ${user.name || 'there'},</p>
                <p>We received a request to reset the password for your ScholarHub account.</p>
                <p>Please click the button below to set a new password:</p>
                <div style="margin: 32px 0; text-align: center;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #718096; font-size: 14px; line-height: 1.5;">
                    This link will expire in 30 minutes. If you didn't request this, please ignore this email or 
                    contact support if you have any concerns.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="font-size: 12px; color: #a0aec0; margin-bottom: 0;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #4299e1; word-break: break-all;">${resetUrl}</a>
                </p>
            </div>
        `;

        // Send email
        await sendEmail({
            email: user.email,
            subject: '🔐 Password Reset Request - ScholarHub',
            message: `Please use this link to reset your password: ${resetUrl}`,
            html: message
        });

        console.log(`Password reset email sent to: ${user.email}`);
        
        return res.status(200).json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Error in forgotPassword:', error);
        
        // Reset token if there was an error sending the email
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
        
        return res.status(500).json({
            success: false,
            error: 'Failed to process password reset request. Please try again.'
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        // Extract reset token and password from request body
        const { token, password } = req.body;
        
        console.log("Reset password request received. Token:", token ? 'received' : 'missing');
        
        if (!token) {
            console.error('No reset token provided in request body');
            return res.status(400).json({ 
                success: false,
                error: 'No reset token provided' 
            });
        }

        if (!password || typeof password !== 'string') {
            console.error('Invalid password format');
            return res.status(400).json({ 
                success: false,
                error: 'Please provide a valid password' 
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            });
        }

        // Hash the reset token to match with the stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token.trim())
            .digest('hex');

        console.log("Looking for user with hashed token:", hashedToken);

        // Find the user based on the reset password token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            // Check if the token exists but is expired
            const expiredUser = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $lte: Date.now() }
            });
            
            if (expiredUser) {
                console.error('Password reset token has expired');
                return res.status(400).json({ 
                    success: false,
                    error: 'This password reset link has expired. Please request a new one.' 
                });
            }
            
            console.error('Invalid password reset token');
            return res.status(400).json({ 
                success: false,
                error: 'Invalid password reset link. Please request a new one.' 
            });
        }

        // Set and save the new password
        try {
            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            
            await user.save();
            
            console.log('Password reset successful for user:', user.email);
            
            // Send confirmation email
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Password Changed Successfully',
                    message: 'Your password has been successfully changed.',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Password Changed Successfully</h2>
                            <p>Your password has been successfully updated. If you did not make this change, please contact support immediately.</p>
                            <p>If you initiated this change, you can ignore this email.</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send password change confirmation email:', emailError);
                // Don't fail the request if email sending fails
            }
            
            // Respond with success message
            return res.status(200).json({
                success: true,
                message: 'Password reset successful. You can now log in with your new password.'
            });
            
        } catch (saveError) {
            console.error('Error saving new password:', saveError);
            return res.status(500).json({
                success: false,
                error: 'Failed to update password. Please try again.'
            });
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'An error occurred while resetting your password. Please try again.' 
        });
    }
};



const confirmEmail = async (req, res) => {
    const { token } = req.params;

   
    if (!token) {
        console.error("No token provided");
        return res.status(400).json({ msg: "No token provided" });
    }

    try {
        
        const decoded = jwt.decode(token, { complete: true });
   

        if (!decoded) {
            console.error("Token could not be decoded.");
            return res.status(400).json({ msg: "Invalid token format" });
        }

        // Now verify the token
        const verifiedDecoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
        

        const user = await User.findOne({ email: verifiedDecoded.email });

        if (!user) {
            console.log("User not found for email:", verifiedDecoded.email);
            return res.status(400).json({ msg: "Invalid token or user not found" });
        }

        // Mark email as confirmed
        user.isEmailConfirmed = true;
        user.confirmationToken = undefined;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL;
        return res.redirect(`${frontendUrl}/auth/confirm-email?status=success`);

    } catch (error) {
        console.error("Error verifying token:", error.message);
        const frontendUrl = process.env.FRONTEND_URL;
        return res.redirect(`${frontendUrl}/auth/confirm-email?status=error&message=Invalid or expired token`);
    }
};

const logout = async (req, res) => {
    res
      .clearCookie("cookieToken", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "development" ? "Lax" : "None",
        secure: process.env.NODE_ENV !== "development",
      })
      .status(200)
      .json({ success: true, msg: "Logged out" });
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                msg: "Please provide both current and new passwords" 
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                msg: "New password must be at least 8 characters long" 
            });
        }

        // Get user from the authenticated request (from protect middleware)
        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                msg: "User not found" 
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                msg: "Current password is incorrect" 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            msg: "Password changed successfully" 
        });

    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ 
            success: false, 
            msg: "Server error while changing password" 
        });
    }
};

module.exports = { register, Login, getMe, forgotPassword, resetPassword, confirmEmail, logout, changePassword };
