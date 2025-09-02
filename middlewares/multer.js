const multer = require("multer");
const path = require("path");

// store file in memory buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Invalid file type. Allowed: pdf, doc, docx, jpg, png"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { upload };
