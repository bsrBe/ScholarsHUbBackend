const express = require("express");
const { upload } = require("../middlewares/multer");
const { protect, authorize ,optionalAuth } = require("../middlewares/authMiddleware");
const {
  createUserForm,
  getAllForms,
  getFormById,
  getUserForms,
  respondToForm,
  downloadDocument,
  getDashboardStats,
} = require("../controllers/userFormController");

const router = express.Router();

// Public routes
router.post("/submit", optionalAuth, upload.single("file"), createUserForm);
// User routes (protected)
router.get("/my-forms", protect, getUserForms);

// Admin routes (protected and admin only)
router.get("/dashboard-stats", protect, authorize("admin"), getDashboardStats);
router.get("/", protect, authorize("admin"), getAllForms);
router.get("/:id", protect, authorize("admin"), getFormById);
router.put("/:id/respond", protect, authorize("admin"), respondToForm);
router.get("/:id/download", protect, authorize("admin"), downloadDocument);

module.exports = router;

