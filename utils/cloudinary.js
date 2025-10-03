const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    // Determine if it's an image or document based on file extension
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
    
    const uploadOptions = {
      folder: options.folder || (isImage ? "thumbnails" : "documents"),
      public_id: filename.replace(/\.[^/.]+$/, ""), // strip extension
      resource_type: isImage ? "image" : "raw",
      use_filename: true,
      unique_filename: false,
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
