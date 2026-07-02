const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  qrVerification: {
    type: String, // verification url or QR code data
  },
  pdfPath: {
    type: String, // local path or cloudinary url to the certificate PDF
  }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
