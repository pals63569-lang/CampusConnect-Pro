const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Waitlist = require('../models/Waitlist');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Badge = require('../models/Badge');
const { generateQRCode } = require('../services/qrService');
const { generateTicketPDF } = require('../services/pdfService');
const { sendRegistrationTicket } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

// @desc    Register for an event
// @route   POST /api/registrations
const registerForEvent = async (req, res, next) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (['Cancelled', 'Completed'].includes(event.status)) {
      return res.status(400).json({ success: false, message: `Registration closed: Event is ${event.status}` });
    }

    if (new Date(event.registrationDeadline) < Date.now()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existingReg = await Registration.findOne({ student: userId, event: eventId });
    if (existingReg && existingReg.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `You are already registered/waitlisted for this event as: ${existingReg.status}`
      });
    }

    let registration;

    if (event.availableSeats > 0) {
      // Direct registration
      event.availableSeats -= 1;
      await event.save();

      registration = await Registration.create({
        student: userId,
        event: eventId,
        status: 'Registered',
      });

      // Populate student name & email for ticket generation
      const studentObj = await User.findById(userId);
      registration.student = studentObj;
      registration.event = event;

      // Generate QR Code containing the registration ID
      const qrDataUrl = await generateQRCode(registration._id.toString());
      registration.qrCode = qrDataUrl;
      await registration.save();

      // Generate Ticket PDF
      const pdfRelativePath = await generateTicketPDF(registration, qrDataUrl);
      
      // Send Ticket Email
      await sendRegistrationTicket(studentObj.email, event.title, registration._id.toString(), path.join(__dirname, '..', pdfRelativePath));

      res.status(201).json({
        success: true,
        message: 'Successfully registered! Ticket sent to email.',
        status: 'Registered',
        registration
      });
    } else {
      // Event is full, add to Waitlist
      let waitlist = await Waitlist.findOne({ event: eventId });
      if (!waitlist) {
        waitlist = await Waitlist.create({ event: eventId, list: [] });
      }

      const position = waitlist.list.length + 1;
      waitlist.list.push({ student: userId, position });
      await waitlist.save();

      registration = await Registration.create({
        student: userId,
        event: eventId,
        status: 'Waitlisted',
      });

      res.status(201).json({
        success: true,
        message: `Event is full. You have been placed on the waitlist at position #${position}.`,
        status: 'Waitlisted',
        registration
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel event registration
// @route   POST /api/registrations/:id/cancel
const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.student.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized cancellation' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Registration is already cancelled' });
    }

    const event = registration.event;
    const oldStatus = registration.status;

    registration.status = 'Cancelled';
    await registration.save();

    if (oldStatus === 'Registered') {
      event.availableSeats += 1;
      await event.save();

      // Process Waitlist: Promote the next person
      const waitlist = await Waitlist.findOne({ event: event._id });
      if (waitlist && waitlist.list.length > 0) {
        // Sort to get the first position
        waitlist.list.sort((a, b) => a.position - b.position);
        const nextInLine = waitlist.list.shift(); // Remove first element
        
        // Re-index remaining waitlisted students
        waitlist.list.forEach((item, index) => {
          item.position = index + 1;
        });
        await waitlist.save();

        // Update promoted user's registration
        const promotedReg = await Registration.findOne({ student: nextInLine.student, event: event._id });
        if (promotedReg) {
          event.availableSeats -= 1;
          await event.save();

          promotedReg.status = 'Registered';

          const studentUser = await User.findById(nextInLine.student);
          promotedReg.student = studentUser;
          promotedReg.event = event;

          const qrDataUrl = await generateQRCode(promotedReg._id.toString());
          promotedReg.qrCode = qrDataUrl;
          await promotedReg.save();

          const pdfRelativePath = await generateTicketPDF(promotedReg, qrDataUrl);
          await sendRegistrationTicket(studentUser.email, event.title, promotedReg._id.toString(), path.join(__dirname, '..', pdfRelativePath));
        }
      }
    } else if (oldStatus === 'Waitlisted') {
      // Remove from waitlist array
      const waitlist = await Waitlist.findOne({ event: event._id });
      if (waitlist) {
        waitlist.list = waitlist.list.filter(item => item.student.toString() !== req.user.id);
        // Re-index
        waitlist.list.sort((a, b) => a.position - b.position);
        waitlist.list.forEach((item, index) => {
          item.position = index + 1;
        });
        await waitlist.save();
      }
    }

    res.status(200).json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan QR Code to mark attendance
// @route   POST /api/registrations/scan
const scanAttendance = async (req, res, next) => {
  const { registrationId } = req.body;

  try {
    const registration = await Registration.findById(registrationId)
      .populate('event')
      .populate('student');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid ticket details' });
    }

    if (registration.status !== 'Registered') {
      return res.status(400).json({ success: false, message: `Ticket is not valid: Registration status is ${registration.status}` });
    }

    // Check if attendance already logged
    const existingAttendance = await Attendance.findOne({
      student: registration.student._id,
      event: registration.event._id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${registration.student.name} at ${new Date(existingAttendance.scanTime).toLocaleTimeString()}`,
        duplicate: true
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      registration: registration._id,
      student: registration.student._id,
      event: registration.event._id,
      markedBy: req.user.id,
    });

    // Reward points for attending (50 points)
    const studentUser = await User.findById(registration.student._id);
    studentUser.rewardPoints += 50;

    // Check & Award Badges
    const totalAttendances = await Attendance.countDocuments({ student: studentUser._id });
    
    // Look up default system badges (Bronze/Silver/Gold/Top Participant)
    let badgeAwarded = null;
    if (totalAttendances === 1) {
      const b = await Badge.findOne({ type: 'Bronze' });
      if (b && !studentUser.badges.includes(b._id)) {
        studentUser.badges.push(b._id);
        badgeAwarded = b;
      }
    } else if (totalAttendances === 3) {
      const b = await Badge.findOne({ type: 'Silver' });
      if (b && !studentUser.badges.includes(b._id)) {
        studentUser.badges.push(b._id);
        badgeAwarded = b;
      }
    } else if (totalAttendances === 5) {
      const b = await Badge.findOne({ type: 'Gold' });
      if (b && !studentUser.badges.includes(b._id)) {
        studentUser.badges.push(b._id);
        badgeAwarded = b;
      }
    }

    await studentUser.save();

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${studentUser.name}!`,
      studentName: studentUser.name,
      eventName: registration.event.title,
      scanTime: attendance.scanTime,
      pointsAwarded: 50,
      totalPoints: studentUser.rewardPoints,
      badgeAwarded: badgeAwarded ? badgeAwarded.name : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF ticket file
// @route   GET /api/registrations/:id/ticket-pdf
const downloadTicket = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (registration.student.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filename = `ticket_${registration._id}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'tickets', filename);

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      // Re-generate if missing
      const qrDataUrl = registration.qrCode || await generateQRCode(registration._id.toString());
      const relativePath = await generateTicketPDF(registration, qrDataUrl);
      const fullPath = path.join(__dirname, '..', relativePath);
      res.download(fullPath, filename);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a certificate by certificate number
// @route   GET /api/registrations/verify-certificate/:certNo
const verifyCertificate = async (req, res, next) => {
  try {
    const Certificate = require('../models/Certificate');
    const cert = await Certificate.findOne({ certificateNumber: req.params.certNo })
      .populate('student', 'name email')
      .populate({
        path: 'event',
        populate: { path: 'department', select: 'name' }
      });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate is valid and verified',
      certificate: {
        certificateNumber: cert.certificateNumber,
        studentName: cert.student.name,
        eventName: cert.event.title,
        issueDate: cert.issueDate,
        departmentName: cert.event.department ? cert.event.department.name : 'College Administration',
        pdfPath: cert.pdfPath
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF Certificate file
// @route   GET /api/registrations/certificates/:certNo/download
const downloadCertificateByNo = async (req, res, next) => {
  try {
    const Certificate = require('../models/Certificate');
    const cert = await Certificate.findOne({ certificateNumber: req.params.certNo });
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Allow the student who earned it, or Admin/Faculty to download
    if (cert.student.toString() !== req.user.id && !['Admin', 'Super Admin', 'Faculty Coordinator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filename = `cert_${cert.certificateNumber}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'certificates', filename);

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      // Re-generate if missing
      const studentUser = await User.findById(cert.student);
      const eventObj = await Event.findById(cert.event).populate('department');
      const { generateQRCode } = require('../services/qrService');
      const { generateCertificatePDF } = require('../services/pdfService');

      const qrDataUrl = await generateQRCode(cert.qrVerification);
      const relativePath = await generateCertificatePDF({
        studentName: studentUser.name,
        eventName: eventObj.title,
        departmentName: eventObj.department ? eventObj.department.name : 'Campus Activities',
        issueDate: cert.issueDate,
        certificateNumber: cert.certificateNumber,
        qrDataUrl
      });
      const fullPath = path.join(__dirname, '..', relativePath);
      res.download(fullPath, filename);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  scanAttendance,
  downloadTicket,
  verifyCertificate,
  downloadCertificateByNo,
};

