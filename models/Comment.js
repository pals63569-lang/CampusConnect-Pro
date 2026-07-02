const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  discussionPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionPost',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isFacultyAnswer: {
    type: Boolean,
    default: false,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
