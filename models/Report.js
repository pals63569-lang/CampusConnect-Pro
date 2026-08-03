const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  comments: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
