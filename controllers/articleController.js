const Article = require("../models/articleModel");
const { uploadToCloudinary } = require("../utils/cloudinary");

// @desc    Create an article
// @route   POST /api/articles
// @access  Private/Admin
const createArticle = async (req, res) => {
  try {
    const { title, content, category, excerpt, readTime, publishDate, featured } = req.body;
    
    const articleData = {
      title,
      content,
      category,
      excerpt: excerpt || '',
      readTime: readTime || '',
      publishDate: publishDate || null,
      featured: featured === 'true' || featured === true || false,
    };

    // If file was uploaded, upload to Cloudinary and add thumbnail URL
    if (req.file) {
      console.log('Uploading thumbnail to Cloudinary...');
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      articleData.thumbnail = result.secure_url;
      console.log('Thumbnail uploaded:', result.secure_url);
    }

    const article = new Article(articleData);
    const createdArticle = await article.save();
    res.status(201).json(createdArticle);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update an article
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = async (req, res) => {
  try {
    const { title, content, category, excerpt, readTime, publishDate, featured } = req.body;

    const article = await Article.findById(req.params.id);

    if (article) {
      article.title = title || article.title;
      article.content = content || article.content;
      article.category = category || article.category;
      article.excerpt = excerpt !== undefined ? excerpt : article.excerpt;
      article.readTime = readTime !== undefined ? readTime : article.readTime;
      article.publishDate = publishDate !== undefined ? publishDate : article.publishDate;
      article.featured = featured !== undefined ? (featured === 'true' || featured === true) : article.featured;

      // If new file was uploaded, upload to Cloudinary and update thumbnail
      if (req.file) {
        console.log('Uploading new thumbnail to Cloudinary...');
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        article.thumbnail = result.secure_url;
        console.log('New thumbnail uploaded:', result.secure_url);
      }

      const updatedArticle = await article.save();
      res.json(updatedArticle);
    } else {
      res.status(404).json({ message: "Article not found" });
    }
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (article) {
      await Article.findByIdAndDelete(req.params.id);
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
    const articles = await Article.find({}).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single article
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
