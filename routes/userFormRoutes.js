const express = require("express");
const { upload } = require("../middlewares/multer");
const {
  createUserForm,
  getAllForms,
  getFormById,
} = require("../controllers/userFormController");

const router = express.Router();

// User submits form with document
router.post("/submit", upload.single("file"), createUserForm);

// Admin routes
router.get("/allForms", getAllForms);
router.get("/forms/:id", getFormById);

module.exports = router;
