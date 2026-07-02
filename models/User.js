const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Super Admin', 'Admin', 'Faculty Coordinator', 'Student', 'Volunteer', 'Guest'],
    default: 'Guest',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  profilePic: {
    type: String,
    default: '',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  interests: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  rewardPoints: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
