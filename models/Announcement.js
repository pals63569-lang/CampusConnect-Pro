const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    bannerColor: {
      type: String,
      default: 'primary',
    },
    targetAudience: {
      roles: [
        {
          type: String,
          enum: ['Super Admin', 'Admin', 'Faculty Coordinator', 'Student', 'Volunteer', 'Staff', 'All'],
          default: 'All',
        },
      ],
      departments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department',
        },
      ],
    },
    scheduledPublishAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ isPublished: 1, scheduledPublishAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
