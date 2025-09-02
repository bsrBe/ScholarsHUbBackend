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

const { protect, admin } = require("../middlewares/authMiddleware");

// Create FAQ
router.post("/create",  createFaq);//protect, admin,

// Get all FAQs
router.get("/all", getAllFaqs);

// Get FAQ by callback key
router.get("/callback/:callbackKey", getFaqByCallbackKey);

// Update FAQ
router.put("/update/:id", protect, admin, updateFaq);

// Delete FAQ
router.delete("/delete/:id", protect, admin, deleteFaq);

// Get FAQ by ID
router.get("/get/:id", getFaqById);

module.exports = router;
