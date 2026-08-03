const BaseRepository = require('./BaseRepository');
const Announcement = require('../../models/Announcement');
const mongoose = require('mongoose');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super(Announcement);
  }

  async findPublishedAnnouncements(userRole, departmentId) {
    if (mongoose.connection.readyState !== 1) {
      return [];
    }

    const now = new Date();
    const query = {
      isPublished: true,
      active: true,
      scheduledPublishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };

    if (userRole || departmentId) {
      query.$and = [
        {
          $or: [
            { 'targetAudience.roles': 'All' },
            { 'targetAudience.roles': userRole },
            { 'targetAudience.departments': departmentId },
          ],
        },
      ];
    }

    try {
      return await this.model.find(query).sort({ scheduledPublishAt: -1 }).populate('createdBy', 'name email').lean();
    } catch (_err) {
      return [];
    }
  }
}

module.exports = new AnnouncementRepository();
