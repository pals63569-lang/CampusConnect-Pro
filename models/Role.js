const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Super Admin', 'Admin', 'Faculty Coordinator', 'Student', 'Volunteer', 'Guest'],
  },
  description: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
