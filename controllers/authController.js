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

const forgotPassword = async(req ,res) => {
    const user = await User.findOne({email : req.body.email});

    if(!user) {
        return res.status(400).json({msg : "user with this email not found"})
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave : false});

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/auth/resetPassword/${resetToken}`;
  const message = `You are receiving this email because you(or someone else)has requested reset of a password please make a put request to ${resetUrl}`;


try {
    await sendEmail({
        email : user.email,
        subject : "password reset",
        message

    })
    return res.status(200).json({ success: true, msg: "Email sent successfully" });

} catch (error) {
    console.error("Error during sendEmail:", error.message);
    user.resetPasswordToken = undefined,
    user.resetPasswordExpire = undefined
    await user.save({validateBeforeSave : false})
    
    return res.status(500).json("email could not be sent" );
}
}

const resetPassword = async (req, res) => {
    // Extract reset token from URL params
    let resetToken = req.params.token;
    console.log("Received reset token:", resetToken);

    if (!resetToken) {
        return res.status(400).json({ msg: 'No reset token found in request' });
    }
    resetToken = resetToken.trim();  // Trim any leading/trailing spaces
    if (resetToken.startsWith(":")) {
        resetToken = resetToken.slice(1);
    }
    console.log("Trimmed token:", resetToken);
    try {
        // Hash the reset token to match with the stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Find the user based on the reset password token and expiry time
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid token or token has expired' });
        }

        // Check if new password is valid
        const newPassword = req.body.password;
        if (!newPassword || typeof newPassword !== "string") {
            return res.status(400).json({ msg: "Invalid password format" });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Respond with the updated user and token
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: error.message });
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
