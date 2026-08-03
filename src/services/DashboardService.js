const User = require('../../models/User');
const Event = require('../../models/Event');
const Registration = require('../../models/Registration');
const Attendance = require('../../models/Attendance');

class DashboardService {
  async getAdminStats() {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await User.countDocuments({ isDeleted: false, isActive: true });
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments({ status: 'Registered' });

    const recentLogins = await User.find({ isDeleted: false })
      .sort('-lastLoginAt')
      .limit(5)
      .select('name email role lastLoginAt')
      .lean();

    return {
      totalUsers,
      activeUsers,
      totalEvents,
      totalRegistrations,
      recentLogins,
    };
  }

  async getFacultyStats(userId) {
    const events = await Event.find({ organizer: userId }).lean();
    const eventIds = events.map((e) => e._id);
    const registrations = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Registered' });

    return {
      myEventsCount: events.length,
      totalRegistrations: registrations,
    };
  }

  async getStudentStats(userId) {
    const registrations = await Registration.find({ student: userId })
      .populate('event', 'title date venue status banner')
      .sort('-createdAt')
      .lean();

    const attendances = await Attendance.countDocuments({ student: userId });
    const user = await User.findById(userId).select('rewardPoints badges').populate('badges').lean();

    return {
      registrations,
      attendedEventsCount: attendances,
      rewardPoints: user ? user.rewardPoints : 0,
      badges: user ? user.badges : [],
    };
  }

  async getAnalytics(timeframe = 'monthly') {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const newRegistrations = await User.countDocuments({ createdAt: { $gte: startDate } });
    const eventCount = await Event.countDocuments({ createdAt: { $gte: startDate } });
    const attendanceCount = await Attendance.countDocuments({ scanTime: { $gte: startDate } });

    return {
      timeframe,
      startDate,
      endDate: now,
      newRegistrations,
      eventCount,
      attendanceCount,
    };
  }
}

module.exports = new DashboardService();
