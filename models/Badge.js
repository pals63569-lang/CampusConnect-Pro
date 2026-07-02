const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  iconClass: {
    type: String,
    required: true, // Font Awesome classes like 'fas fa-medal text-warning'
  },
  type: {
    type: String,
    required: true,
    enum: ['Gold', 'Silver', 'Bronze', 'Volunteer', 'Champion', 'Organizer', 'Speaker', 'Top Participant'],
  }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
