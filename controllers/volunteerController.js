const Volunteer = require('../models/Volunteer');
const Event = require('../models/Event');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Certificate = require('../models/Certificate');
const { generateQRCode } = require('../services/qrService');
const { generateCertificatePDF } = require('../services/pdfService');

// @desc    Apply to volunteer for an event
// @route   POST /api/volunteers/apply
const applyToVolunteer = async (req, res, next) => {
  const { eventId } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existingApp = await Volunteer.findOne({ student: req.user.id, event: eventId });
    if (existingApp) {
      return res.status(400).json({ success: false, message: `Volunteer application already: ${existingApp.status}` });
    }

    const volunteer = await Volunteer.create({
      student: req.user.id,
      event: eventId,
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer application submitted successfully. Pending faculty approval.',
      volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteers list (for faculty/admin)
// @route   GET /api/volunteers/event/:eventId
const getVolunteers = async (req, res, next) => {
  try {
    const volunteers = await Volunteer.find({ event: req.params.eventId })
      .populate('student', 'name email department')
      .populate('event', 'title');

    res.status(200).json({ success: true, count: volunteers.length, volunteers });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject volunteer
// @route   PATCH /api/volunteers/:id/status
const updateVolunteerStatus = async (req, res, next) => {
  const { status } = req.body;
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    volunteer.status = status;
    await volunteer.save();

    res.status(200).json({ success: true, message: `Volunteer application ${status}`, volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign tasks to volunteer
// @route   POST /api/volunteers/:id/tasks
const assignTasks = async (req, res, next) => {
  const { taskName } = req.body;
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found' });
    }

    volunteer.assignedTasks.push({ taskName, status: 'Pending' });
    await volunteer.save();

    res.status(200).json({ success: true, message: 'Task assigned successfully', volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task progress (student volunteer)
// @route   PATCH /api/volunteers/:id/tasks/:taskId
const updateTaskStatus = async (req, res, next) => {
  const { status } = req.body; // Pending, In Progress, Completed
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found' });
    }

    if (volunteer.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized task modification' });
    }

    const task = volunteer.assignedTasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = status;
    await volunteer.save();

    res.status(200).json({ success: true, message: `Task marked as ${status}`, volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Log hours worked and award volunteer certificate
// @route   PATCH /api/volunteers/:id/hours
const logHours = async (req, res, next) => {
  const { hours } = req.body;
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .populate('student')
      .populate('event');

    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found' });
    }

    volunteer.hoursWorked += parseFloat(hours);

    // Award Reward points for volunteering (10 points per hour)
    const studentUser = await User.findById(volunteer.student._id);
    studentUser.rewardPoints += Math.round(hours * 10);

    // If total logged hours reach threshold (e.g. 5 hours) and certificate not generated yet
    if (volunteer.hoursWorked >= 5 && !volunteer.certificateGenerated) {
      volunteer.certificateGenerated = true;

      // Award "Volunteer Badge"
      const vBadge = await Badge.findOne({ type: 'Volunteer' });
      if (vBadge && !studentUser.badges.includes(vBadge._id)) {
        studentUser.badges.push(vBadge._id);
      }

      // Generate Certificate in DB
      const certNo = `VOL-${volunteer.event._id.toString().substring(18)}-${studentUser._id.toString().substring(18)}`;
      
      const verificationUrl = `http://localhost:3000/verify-cert.html?certNo=${certNo}`;
      const qrDataUrl = await generateQRCode(verificationUrl);

      const certPdfPath = await generateCertificatePDF({
        studentName: studentUser.name,
        eventName: `${volunteer.event.title} (Volunteer Service)`,
        departmentName: 'Campus Activities',
        issueDate: new Date(),
        certificateNumber: certNo,
        qrDataUrl
      });

      await Certificate.create({
        student: studentUser._id,
        event: volunteer.event._id,
        certificateNumber: certNo,
        qrVerification: verificationUrl,
        pdfPath: certPdfPath
      });
    }

    await studentUser.save();
    await volunteer.save();

    res.status(200).json({
      success: true,
      message: `Logged ${hours} hours worked. Reward points updated!`,
      volunteer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToVolunteer,
  getVolunteers,
  updateVolunteerStatus,
  assignTasks,
  updateTaskStatus,
  logHours,
};
