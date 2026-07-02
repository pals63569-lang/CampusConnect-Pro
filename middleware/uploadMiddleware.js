const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isConfigured } = require('../config/cloudinary');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Helper function to handle Cloudinary upload or fallback to local path
const uploadImage = async (file) => {
  if (!file) return '';

  if (isConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'campusconnect_events',
      });
      // Delete temporary local file
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error, using local path fallback:', error);
      return `/uploads/${path.basename(file.path)}`;
    }
  } else {
    // Return path relative to server root
    return `/uploads/${path.basename(file.path)}`;
  }
};

module.exports = {
  upload,
  uploadImage
};
