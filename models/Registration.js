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
  }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
