const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    index: true,
  },
  banner: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'],
    index: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true,
  },
  speaker: {
    type: String,
    default: '',
  },
  venue: {
    type: String,
    required: [true, 'Venue location is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    index: true,
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
  },
  capacity: {
    type: Number,
    required: [true, 'Total capacity is required'],
    min: [1, 'Capacity must be at least 1'],
  },
  availableSeats: {
    type: Number,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required'],
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
    index: true,
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
    index: true,
  },
  waitlistCapacity: {
    type: Number,
    default: 50,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  mode: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid'],
    default: 'Offline',
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  speakerBio: {
    type: String,
    default: '',
  },
  speakerImage: {
    type: String,
    default: '',
  },
  agenda: [{
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' }
  }]
}, { timestamps: true });

// Compound Indexes for fast filtering and sorted listings
eventSchema.index({ category: 1, date: 1, status: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ title: 'text', description: 'text', speaker: 'text' });

module.exports = mongoose.model('Event', eventSchema);
