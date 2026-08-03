const User = require('../../models/User');
const Event = require('../../models/Event');
const Announcement = require('../../models/Announcement');
const Department = require('../../models/Department');

const mongoose = require('mongoose');

class SearchService {
  async globalSearch(q, type = 'all') {
    if (!q || mongoose.connection.readyState !== 1) {
      return { users: [], events: [], notices: [], departments: [] };
    }

    const regex = new RegExp(q, 'i');
    const results = {};

    try {
      if (type === 'all' || type === 'users') {
        results.users = await User.find({
          $or: [{ name: regex }, { email: regex }, { role: regex }],
        })
          .limit(5)
          .select('name email role profilePic department')
          .lean();
      }

      if (type === 'all' || type === 'events') {
        results.events = await Event.find({
          $or: [{ title: regex }, { category: regex }, { venue: regex }, { speaker: regex }],
        })
          .limit(5)
          .select('title category venue date availableSeats status')
          .lean();
      }

      if (type === 'all' || type === 'notices') {
        results.notices = await Announcement.find({
          $or: [{ title: regex }, { content: regex }],
          isPublished: true,
        })
          .limit(5)
          .select('title scheduledPublishAt bannerColor')
          .lean();
      }

      if (type === 'all' || type === 'departments') {
        results.departments = await Department.find({ name: regex })
          .limit(5)
          .select('name code description')
          .lean();
      }
    } catch (_err) {
      return { users: [], events: [], notices: [], departments: [] };
    }

    return results;
  }
}

module.exports = new SearchService();
