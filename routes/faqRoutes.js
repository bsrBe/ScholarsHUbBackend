const express = require("express");
const router = express.Router();

const {
  createFaq,
  updateFaq,
  deleteFaq,
  getAllFaqs,
  getFaqById,
  getFaqByCallbackKey,
} = require("../controllers/faqController");

const { protect, authorize } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", getAllFaqs);
router.get("/:id", getFaqById);
router.get("/callback/:callbackKey", getFaqByCallbackKey);

// Admin routes (protected and admin only)
router.post("/", protect, authorize("admin"), createFaq);
router.put("/:id", protect, authorize("admin"), updateFaq);
router.delete("/:id", protect, authorize("admin"), deleteFaq);

module.exports = router;
