const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Registered', 'Cancelled', 'Waitlisted'],
    default: 'Registered',
  },
  qrCode: {
    type: String, // Stringified data url or path to image
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  seatNumber: {
    type: String,
    default: '',
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate registrations and optimize lookup
registrationSchema.index({ student: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);

