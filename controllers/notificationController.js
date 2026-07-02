const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to read this notification' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Create global announcement
// @route   POST /api/notifications/announce
const createAnnouncement = async (req, res, next) => {
  const { title, content, bannerColor } = req.body;
  try {
    const announcement = await Announcement.create({
      title,
      content,
      bannerColor: bannerColor || 'primary',
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active announcements
// @route   GET /api/notifications/announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  createAnnouncement,
  getAnnouncements,
};
