const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  banner: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  speaker: {
    type: String,
    default: '',
  },
  venue: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  gallery: [{
    type: String,
  }],
  rules: [{
    type: String,
  }],
  faqs: [faqSchema],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sponsors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor',
  }],
  status: {
    type: String,
    required: true,
    enum: ['Upcoming', 'Registration Open', 'Registration Closed', 'Live', 'Completed', 'Cancelled'],
    default: 'Upcoming',
  },
  waitlistCapacity: {
    type: Number,
    default: 50,
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
