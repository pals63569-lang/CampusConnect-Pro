const cloudinary = require('cloudinary').v2;
require('dotenv').config();

let isConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isConfigured = true;
  console.log('Cloudinary Configured Successfully.');
} else {
  console.log('Cloudinary credentials missing. File uploads will default to local folder storage.');
}

module.exports = {
  cloudinary,
  isConfigured,
};
