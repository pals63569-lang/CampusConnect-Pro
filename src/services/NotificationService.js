const Notification = require('../../models/Notification');
const socketServer = require('../sockets/socketServer');
const { sendEventReminder } = require('../../services/emailService');
const logger = require('../../utils/logger');

class NotificationService {
  async sendNotification({ userId, title, message, type = 'InApp', priority = 'Normal', category = 'System', email = null }) {
    try {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
      });

      // Real-time socket broadcast
      socketServer.emitNotification(userId, {
        id: notification._id,
        title,
        message,
        priority,
        category,
        createdAt: notification.createdAt,
      });

      // Email delivery fallback if requested or urgent
      if (email && (type === 'Email' || priority === 'High')) {
        await sendEventReminder(email, title, message);
      }

      return notification;
    } catch (error) {
      logger.error(`Notification delivery failed: ${error.message}`);
    }
  }

  async sendBulkNotification({ userIds, title, message, priority = 'Normal' }) {
    const notifications = userIds.map((id) => ({
      user: id,
      title,
      message,
    }));

    await Notification.insertMany(notifications);

    userIds.forEach((id) => {
      socketServer.emitNotification(id, { title, message, priority });
    });
  }

  async getUserNotifications(userId) {
    return await Notification.find({ user: userId }).sort('-createdAt').limit(20).lean();
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
  }
}

module.exports = new NotificationService();
