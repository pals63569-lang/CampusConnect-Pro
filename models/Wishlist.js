const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }]
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
