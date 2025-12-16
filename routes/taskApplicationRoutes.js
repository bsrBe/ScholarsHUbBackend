const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/multer");
const {
  createTaskApplication,
  getUserTaskApplications,
  getTaskApplicationById,
  getAllTaskApplications,
  respondToTaskApplication,
  addMessage,
  uploadAdditionalDocuments
} = require("../controllers/taskApplicationController");

// User routes
router.post(
  "/",
  protect,
  upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'national_identity_card', maxCount: 1 },
    { name: 'highschool_certificates', maxCount: 1 },
    { name: 'transcripts', maxCount: 1 },
    { name: 'recommendation_letter_1', maxCount: 1 },
    { name: 'recommendation_letter_2', maxCount: 1 },
    { name: 'student_cv_resume', maxCount: 1 },
    { name: 'statement_of_purpose', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 },
    { name: 'english_proficiency', maxCount: 1 },
    { name: 'recommendation_letter_3', maxCount: 1 },
    { name: 'bachelors_degree_certificate', maxCount: 1 },
    { name: 'bachelors_degree_transcript', maxCount: 1 },
    { name: 'diploma', maxCount: 1 },
    { name: 'thesis', maxCount: 1 }
  ]),
  createTaskApplication
);

router.get("/my-applications", protect, getUserTaskApplications);
router.get("/:id", protect, getTaskApplicationById);
router.post("/:id/message", protect, addMessage);

router.put(
  "/:id/documents",
  protect,
  upload.fields([
    { name: 'additional_documents_pdf', maxCount: 4 },
    { name: 'additional_documents_images', maxCount: 4 }
  ]),
  uploadAdditionalDocuments
);

// Admin routes
router.get("/", protect, admin, getAllTaskApplications);
router.put("/:id/respond", protect, admin, respondToTaskApplication);

module.exports = router;

