const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  // Try to get the token from:
  // 1. Authorization header (Bearer token)
  // 2. Cookie (cookieToken)
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.cookieToken) {
    // Get token from cookie
    token = req.cookies.cookieToken;
  }

  // If no token is found
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, no token provided" 
    });
  }

  try {
    // Verify the token with JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object (excluding password)
    req.user = await User.findById(decoded.id).select("-password");

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    // Token verification failed, unauthorized access
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};



const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

// Generic authorize function that can check for any role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user found" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this resource` 
      });
    }
    
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.cookieToken;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch (e) {
    console.error("Token verification failed:", e.message);
    // ignore auth errors for optional auth
  }
  next();
};

module.exports = { protect, admin, authorize, optionalAuth };
