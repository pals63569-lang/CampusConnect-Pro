const mongoose = require('mongoose');

const waitlistEntrySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  }
});

const waitlistSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true,
  },
  list: [waitlistEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
