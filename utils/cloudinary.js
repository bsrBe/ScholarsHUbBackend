const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "documents",
        public_id: filename.replace(/\.[^/.]+$/, ""), // strip extension to avoid .pdf.pdf
        resource_type: "raw", // ensure PDFs and other files are handled correctly
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
