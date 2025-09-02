const Faq = require("../models/faqModel");

// @desc    Create a FAQ
// @route   POST /api/faqs
// @access  Private/Admin
const createFaq = async (req, res) => {
  const { question, answer } = req.body;

  try {
    const faq = new Faq({
      question,
      answer,
    });

    const createdFaq = await faq.save();
    res.status(201).json(createdFaq);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
const updateFaq = async (req, res) => {
  const { question, answer } = req.body;

  try {
    const faq = await Faq.findById(req.params.id);

    if (faq) {
      faq.question = question || faq.question;
      faq.answer = answer || faq.answer;

      const updatedFaq = await faq.save();
      res.json(updatedFaq);
    } else {
      res.status(404).json({ message: "FAQ not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (faq) {
      await faq.remove();
      res.json({ message: "FAQ removed" });
    } else {
      res.status(404).json({ message: "FAQ not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all FAQs
// @route   GET /api/faqs
// @access  Public
const getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({});
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get FAQ by ID
// @route   GET /api/faqs/:id
// @access  Public
const getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (faq) {
      res.json(faq);
    } else {
      res.status(404).json({ message: "FAQ not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get FAQ by callback key
// @route   GET /api/faqs/callback/:callbackKey
// @access  Public
const getFaqByCallbackKey = async (req, res) => {
  try {
    const faq = await Faq.findOne({ callbackKey: req.params.callbackKey });

    if (faq) {
      res.json(faq);
    } else {
      res.status(404).json({ message: "FAQ not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createFaq,
  updateFaq,
  deleteFaq,
  getAllFaqs,
  getFaqById,
  getFaqByCallbackKey,
};
