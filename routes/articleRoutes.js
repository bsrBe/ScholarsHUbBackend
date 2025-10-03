const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multer");
const {
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
} = require("../controllers/articleController");

const { protect, authorize } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", getAllArticles);
router.get("/:id", getArticleById);

// Admin routes (protected and admin only)
router.post("/", protect, authorize("admin"), upload.single("thumbnail"), createArticle);
router.put("/:id", protect, authorize("admin"), upload.single("thumbnail"), updateArticle);
router.delete("/:id", protect, authorize("admin"), deleteArticle);

module.exports = router;
