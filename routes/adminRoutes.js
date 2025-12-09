const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const { 
  getStats, 
  getRecentActivities, 
  getOverview, 
  changePassword,
  forgotPassword,
  resetPassword 
} = require("../controllers/adminController");

const router = express.Router();

// Public routes (no authentication required)
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Protected routes (require authentication and admin role)
router.use(protect, admin);

// Dashboard routes
router.get("/stats", getStats);
router.get("/activities", getRecentActivities);
router.get("/overview", getOverview);

// Password management routes
router.put("/change-password", changePassword);

module.exports = router;


