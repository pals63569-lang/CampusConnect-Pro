const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  logo: {
    type: String, // Logo url
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  description: {
    type: String,
  },
  eventsSponsored: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Sponsor', sponsorSchema);
