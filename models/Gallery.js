const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  albumName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  photos: [{
    type: String, // URLs
  }],
  videos: [{
    type: String, // URLs (YouTube, Vimeo, Cloudinary)
  }]
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
