const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
  },
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
  scanTime: {
    type: Date,
    default: Date.now,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Faculty or Admin who scanned
    required: true,
  }
}, { timestamps: true });

// Ensure student can only have one attendance record per event
attendanceSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
