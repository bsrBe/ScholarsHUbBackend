const UserForm = require("../models/userForm");
const { uploadToCloudinary } = require("../utils/cloudinary");

// Handle user form submission
const createUserForm = async (req, res) => {
  try {
    // check file
    if (!req.file) {
      return res.status(400).json({ message: "Document is required" });
    }

    // upload file to cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // create document in MongoDB
    const newForm = new UserForm({
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      telegram_user_name: req.body.telegram_user_name,
      educational_status: req.body.educational_status,
      destination_country: req.body.destination_country,
      client_document: result.secure_url, // save Cloudinary URL
      additional_information: req.body.additional_information,
    });

    await newForm.save();

    res.status(201).json({
      message: "Form submitted successfully",
      data: newForm,
    });
} catch (err) {
  if (err.name === "TimeoutError") {
    return res.status(408).json({ success: false, error: "Upload timed out. Try again with a smaller file." });
  }
  console.error(err);
  res.status(400).json({ success: false, error: err.message });
}

};

// For admin: get all submissions
const getAllForms = async (req, res) => {
  try {
    const forms = await UserForm.find().sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (err) {
    res.status(500).json({ message: "Error fetching forms" });
  }
};

// For admin: get single form by id
const getFormById = async (req, res) => {
  try {
    const form = await UserForm.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ message: "Error fetching form" });
  }
};

module.exports = { createUserForm, getAllForms, getFormById };
