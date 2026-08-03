const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['User', 'Course', 'Event', 'Notice', 'Department', 'System', 'File'],
      default: 'System',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);
