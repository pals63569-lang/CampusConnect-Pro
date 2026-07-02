const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEventReminder } = require('./emailService');
const Notification = require('../models/Notification');

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find events starting in the next 24 hours
    const upcomingEvents = await Event.find({
      date: { $gte: now, $lte: targetTime }
    });

    for (const event of upcomingEvents) {
      // Find registered students who haven't received a reminder
      const registrations = await Registration.find({
        event: event._id,
        status: 'Registered',
        reminderSent: { $ne: true }
      }).populate('student');

      for (const reg of registrations) {
        if (reg.student && reg.student.email) {
          const hoursLeft = Math.round((new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60));
          const timeStr = `${hoursLeft > 0 ? hoursLeft : 0} hours`;

          // Send Email
          await sendEventReminder(reg.student.email, event.title, timeStr);

          // Create Dashboard Notification
          await Notification.create({
            user: reg.student._id,
            title: `Reminder: ${event.title}`,
            message: `The event is starting in ${timeStr} at ${event.venue || 'scheduled venue'}.`,
            type: 'All'
          });

          // Mark reminder as sent
          reg.reminderSent = true;
          await reg.save();
        }
      }
    }
  } catch (error) {
    console.error('Error running event reminder checker:', error);
  }
};

const startReminderService = () => {
  // Run once immediately on startup
  checkAndSendReminders();
  // Run every 30 minutes
  setInterval(checkAndSendReminders, 30 * 60 * 1000);
  console.log('⏰ Event Reminder Service Initialized.');
};

module.exports = { startReminderService };
