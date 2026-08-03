const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Volunteer = require('../models/Volunteer');
const Certificate = require('../models/Certificate');
const Department = require('../models/Department');
const Wishlist = require('../models/Wishlist');
const PDFDocument = require('pdfkit');

// @desc    Get Student Dashboard data
// @route   GET /api/dashboards/student
const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const registrations = await Registration.find({ student: userId })
      .populate({
        path: 'event',
        populate: { path: 'department', select: 'name' }
      });
      
    const registered = registrations.filter(r => r.status === 'Registered');
    const waitlisted = registrations.filter(r => r.status === 'Waitlisted');

    const totalAttendances = await Attendance.countDocuments({ student: userId });
    
    const wishlist = await Wishlist.findOne({ student: userId }).populate('events');
    const wishlistCount = wishlist ? wishlist.events.length : 0;

    const userDetails = await User.findById(userId)
      .populate('badges')
      .populate('department', 'name');

    // Get Leaderboard (Top 5 students by Reward Points)
    const leaderboard = await User.find({ role: 'Student' })
      .select('name rewardPoints profilePic')
      .sort({ rewardPoints: -1 })
      .limit(5);

    // Get certificates
    const certificates = await Certificate.find({ student: userId }).populate('event', 'title date');

    res.status(200).json({
      success: true,
      registered,
      waitlisted,
      totalAttendances,
      wishlistCount,
      leaderboard,
      certificates,
      rewardPoints: userDetails.rewardPoints,
      badges: userDetails.badges,
      department: userDetails.department ? userDetails.department.name : 'N/A'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Faculty Coordinator Dashboard data
// @route   GET /api/dashboards/faculty
const getFacultyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get events organized by this faculty coordinator
    const events = await Event.find({ organizer: userId }).populate('department', 'name');
    const eventIds = events.map(e => e._id);

    // Get total registrations for these events
    const registrationsCount = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Registered' });
    const waitlistedCount = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Waitlisted' });
    const attendanceCount = await Attendance.countDocuments({ event: { $in: eventIds } });

    // Pending volunteer applications
    const pendingVolunteers = await Volunteer.find({ event: { $in: eventIds }, status: 'Pending' })
      .populate('student', 'name email')
      .populate('event', 'title');

    res.status(200).json({
      success: true,
      events,
      registrationsCount,
      waitlistedCount,
      attendanceCount,
      pendingVolunteers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard data
// @route   GET /api/dashboards/admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalFaculty = await User.countDocuments({ role: 'Faculty Coordinator' });
    const totalVolunteers = await Volunteer.countDocuments({ status: 'Approved' });
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments({ status: 'Registered' });
    const totalAttendance = await Attendance.countDocuments();

    // Query list of students
    const studentsList = await User.find({ role: 'Student' })
      .select('name email rewardPoints isVerified')
      .limit(10);

    // Query list of faculty coordinators
    const facultyList = await User.find({ role: 'Faculty Coordinator' })
      .select('name email isVerified')
      .limit(10);

    // Department breakdown for chart
    const depts = await Department.find();
    const deptStats = await Promise.all(
      depts.map(async (d) => {
        const count = await Event.countDocuments({ department: d._id });
        return { departmentName: d.name, eventCount: count };
      })
    );

    // Recent activity logs (based on recent registrations)
    const recentRegs = await Registration.find()
      .populate('student', 'name')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const activityLogs = recentRegs.map(reg => ({
      action: 'Event Registration',
      details: `${reg.student ? reg.student.name : 'Unknown Student'} registered for "${reg.event ? reg.event.title : 'Event'}"`,
      createdAt: reg.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsersCount: totalUsers,
          totalEventsCount: totalEvents,
          totalRegistrationsCount: totalRegistrations,
          checkedInCount: totalAttendance
        },
        users: {
          students: studentsList,
          faculty: facultyList
        },
        deptStats,
        activityLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Volunteer Dashboard tasks
// @route   GET /api/dashboards/volunteer
const getVolunteerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all events where student is an approved volunteer
    const volunteerJobs = await Volunteer.find({ student: userId, status: 'Approved' })
      .populate('event', 'title date venue time');

    res.status(200).json({ success: true, volunteerJobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Event Reports
// @route   GET /api/dashboards/reports
const exportReport = async (req, res, next) => {
  const { type, format, eventId } = req.query;

  try {
    let data = [];
    let headers = [];
    let filename = `report_${type}_${Date.now()}`;

    if (type === 'attendance') {
      const query = eventId ? { event: eventId } : {};
      const list = await Attendance.find(query)
        .populate('student', 'name email department')
        .populate('event', 'title date');

      headers = ['Student Name', 'Student Email', 'Event Title', 'Event Date', 'Check-In Time'];
      data = list.map(item => [
        item.student.name,
        item.student.email,
        item.event.title,
        new Date(item.event.date).toLocaleDateString(),
        new Date(item.scanTime).toLocaleTimeString()
      ]);
      filename = `attendance_report_${eventId || 'all'}`;
    } else if (type === 'registration') {
      const query = eventId ? { event: eventId } : {};
      const list = await Registration.find(query)
        .populate('student', 'name email')
        .populate('event', 'title');

      headers = ['Student Name', 'Student Email', 'Event Title', 'Status', 'Registration Date'];
      data = list.map(item => [
        item.student.name,
        item.student.email,
        item.event.title,
        item.status,
        new Date(item.registrationDate).toLocaleDateString()
      ]);
      filename = `registration_report_${eventId || 'all'}`;
    } else if (type === 'events') {
      const list = await Event.find().populate('department', 'name');
      headers = ['Event Title', 'Category', 'Department', 'Venue', 'Date', 'Capacity', 'Available Seats', 'Status'];
      data = list.map(item => [
        item.title,
        item.category,
        item.department.name,
        item.venue,
        new Date(item.date).toLocaleDateString(),
        item.capacity,
        item.availableSeats,
        item.status
      ]);
      filename = 'events_summary_report';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type requested' });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);

      let csvContent = headers.join(',') + '\n';
      data.forEach(row => {
        csvContent += row.map(val => `"${val}"`).join(',') + '\n';
      });

      return res.status(200).send(csvContent);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      doc.pipe(res);

      doc.fontSize(18).text('CampusConnect-Pro System Report', { align: 'center', bold: true });
      doc.fontSize(12).text(`Report Type: ${type.toUpperCase()}`, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' });
      doc.moveDown(2);

      // Render flat lines
      data.forEach((row, rIdx) => {
        doc.fontSize(10).fillColor('#1e1b4b');
        let textRow = `${rIdx + 1}. `;
        headers.forEach((h, hIdx) => {
          textRow += `${h}: ${row[hIdx]} | `;
        });
        doc.text(textRow.substring(0, textRow.length - 3));
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    } else {
      return res.status(400).json({ success: false, message: 'Format not supported (use csv or pdf)' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
  getFacultyDashboard,
  getAdminDashboard,
  getVolunteerDashboard,
  exportReport,
};
