const express = require("express");
const router = express.Router();

const {
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
} = require("../controllers/articleController");

const { protect, admin } = require("../middlewares/authMiddleware");

// Create article
router.post("/create", protect, admin, createArticle);

// Get all articles
router.get("/all", getAllArticles);

// Get single article by ID
router.get("/get/:id", getArticleById);

// Update article
router.put("/update/:id", protect, admin, updateArticle);

// Delete article
router.delete("/delete/:id", protect, admin, deleteArticle);

module.exports = router;
