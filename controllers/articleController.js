const Article = require("../models/articleModel");

// @desc    Create an article
// @route   POST /api/articles
// @access  Private/Admin
const createArticle = async (req, res) => {
  const { title, content, category } = req.body;

  try {
    const article = new Article({
      title,
      content,
      category,
    });

    const createdArticle = await article.save();
    res.status(201).json(createdArticle);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an article
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = async (req, res) => {
  const { title, content, category } = req.body;

  try {
    const article = await Article.findById(req.params.id);

    if (article) {
      article.title = title || article.title;
      article.content = content || article.content;
      article.category = category || article.category;

      const updatedArticle = await article.save();
      res.json(updatedArticle);
    } else {
      res.status(404).json({ message: "Article not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (article) {
      await article.remove();
      res.json({ message: "Article removed" });
    } else {
      res.status(404).json({ message: "Article not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({});
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get article by ID
// @route   GET /api/articles/:id
// @access  Public
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ message: "Article not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
};
