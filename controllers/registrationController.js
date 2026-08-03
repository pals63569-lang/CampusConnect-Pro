const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Waitlist = require('../models/Waitlist');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Certificate = require('../models/Certificate');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/customErrors');
const { generateQRCode } = require('../services/qrService');
const { generateTicketPDF, generateCertificatePDF } = require('../services/pdfService');
const { sendRegistrationTicket } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

// @desc    Register for an event
// @route   POST /api/v1/registrations
const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (['Cancelled', 'Completed'].includes(event.status)) {
    throw new BadRequestError(`Registration closed: Event is ${event.status}`);
  }

  if (new Date(event.registrationDeadline) < Date.now()) {
    throw new BadRequestError('Registration deadline has passed');
  }

  const existingReg = await Registration.findOne({ student: userId, event: eventId });
  if (existingReg && existingReg.status !== 'Cancelled') {
    throw new BadRequestError(`You are already registered/waitlisted for this event as: ${existingReg.status}`);
  }

  const prefix = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
  const num = Math.floor(Math.random() * 50) + 1;
  const seatNumber = `${prefix}-${num}`;

  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId, availableSeats: { $gt: 0 } },
    { $inc: { availableSeats: -1 } },
    { new: true }
  );

  let registration;
  if (updatedEvent) {
    registration = await Registration.create({
      student: userId,
      event: eventId,
      status: 'Registered',
      seatNumber,
    });

    const studentObj = await User.findById(userId);
    registration.student = studentObj;
    registration.event = updatedEvent;

    const qrDataUrl = await generateQRCode(registration._id.toString());
    registration.qrCode = qrDataUrl;
    await registration.save();

    const pdfRelativePath = await generateTicketPDF(registration, qrDataUrl);
    await sendRegistrationTicket(studentObj.email, updatedEvent.title, registration._id.toString(), path.join(__dirname, '..', pdfRelativePath));

    return ApiResponse.success(res, 'Successfully registered! Ticket sent to email.', {
      status: 'Registered',
      registration,
    }, 201);
  } else {
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

    return ApiResponse.success(res, `Event is full. You have been placed on the waitlist at position #${position}.`, {
      status: 'Waitlisted',
      registration,
    }, 201);
  }
});

// @desc    Cancel event registration
// @route   POST /api/v1/registrations/:id/cancel
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id).populate('event');
  if (!registration) {
    throw new NotFoundError('Registration not found');
  }

  if (registration.student.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
    throw new ForbiddenError('Unauthorized cancellation attempt');
  }

  if (registration.status === 'Cancelled') {
    throw new BadRequestError('Registration is already cancelled');
  }

  const event = registration.event;
  const oldStatus = registration.status;

  registration.status = 'Cancelled';
  await registration.save();

  if (oldStatus === 'Registered') {
    event.availableSeats += 1;
    await event.save();

    const waitlist = await Waitlist.findOne({ event: event._id });
    if (waitlist && waitlist.list.length > 0) {
      waitlist.list.sort((a, b) => a.position - b.position);
      const nextInLine = waitlist.list.shift();

      waitlist.list.forEach((item, index) => {
        item.position = index + 1;
      });
      await waitlist.save();

      const promotedReg = await Registration.findOne({ student: nextInLine.student, event: event._id });
      if (promotedReg) {
        event.availableSeats -= 1;
        await event.save();

        const prefix = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
        const num = Math.floor(Math.random() * 50) + 1;
        promotedReg.seatNumber = `${prefix}-${num}`;
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
    const waitlist = await Waitlist.findOne({ event: event._id });
    if (waitlist) {
      waitlist.list = waitlist.list.filter(item => item.student.toString() !== req.user.id);
      waitlist.list.sort((a, b) => a.position - b.position);
      waitlist.list.forEach((item, index) => {
        item.position = index + 1;
      });
      await waitlist.save();
    }
  }

  return ApiResponse.success(res, 'Registration cancelled successfully');
});

// @desc    Scan QR Code to mark attendance
// @route   POST /api/v1/registrations/scan
const scanAttendance = asyncHandler(async (req, res) => {
  const { registrationId } = req.body;

  const registration = await Registration.findById(registrationId)
    .populate('event')
    .populate('student');

  if (!registration) {
    throw new NotFoundError('Invalid ticket details');
  }

  if (registration.status !== 'Registered') {
    throw new BadRequestError(`Ticket is not valid: Registration status is ${registration.status}`);
  }

  const existingAttendance = await Attendance.findOne({
    student: registration.student._id,
    event: registration.event._id,
  });

  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: `Attendance already marked for ${registration.student.name} at ${new Date(existingAttendance.scanTime).toLocaleTimeString()}`,
      duplicate: true,
    });
  }

  const attendance = await Attendance.create({
    registration: registration._id,
    student: registration.student._id,
    event: registration.event._id,
    markedBy: req.user.id,
  });

  const studentUser = await User.findById(registration.student._id);
  studentUser.rewardPoints += 50;

  const totalAttendances = await Attendance.countDocuments({ student: studentUser._id });
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

  return ApiResponse.success(res, `Attendance marked successfully for ${studentUser.name}!`, {
    studentName: studentUser.name,
    eventName: registration.event.title,
    scanTime: attendance.scanTime,
    pointsAwarded: 50,
    totalPoints: studentUser.rewardPoints,
    badgeAwarded: badgeAwarded ? badgeAwarded.name : null,
  });
});

// @desc    Download PDF ticket file
// @route   GET /api/v1/registrations/:id/ticket-pdf
const downloadTicket = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id).populate('event');
  if (!registration) {
    throw new NotFoundError('Ticket not found');
  }

  if (registration.student.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
    throw new ForbiddenError('Access denied');
  }

  const filename = `ticket_${registration._id}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', 'tickets', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    const qrDataUrl = registration.qrCode || await generateQRCode(registration._id.toString());
    const relativePath = await generateTicketPDF(registration, qrDataUrl);
    const fullPath = path.join(__dirname, '..', relativePath);
    res.download(fullPath, filename);
  }
});

// @desc    Verify a certificate by certificate number
// @route   GET /api/v1/registrations/verify-certificate/:certNo
const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateNumber: req.params.certNo })
    .populate('student', 'name email')
    .populate({
      path: 'event',
      populate: { path: 'department', select: 'name' },
    });

  if (!cert) {
    throw new NotFoundError('Certificate not found or invalid');
  }

  return ApiResponse.success(res, 'Certificate is valid and verified', {
    certificate: {
      certificateNumber: cert.certificateNumber,
      studentName: cert.student ? cert.student.name : 'Student',
      eventName: cert.event ? cert.event.title : 'Event',
      issueDate: cert.issueDate,
      departmentName: cert.event && cert.event.department ? cert.event.department.name : 'College Administration',
      pdfPath: cert.pdfPath,
    },
  });
});

// @desc    Download PDF Certificate file
// @route   GET /api/v1/registrations/certificates/:certNo/download
const downloadCertificateByNo = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateNumber: req.params.certNo });
  if (!cert) {
    throw new NotFoundError('Certificate not found');
  }

  if (cert.student.toString() !== req.user.id && !['Admin', 'Super Admin', 'Faculty Coordinator'].includes(req.user.role)) {
    throw new ForbiddenError('Access denied');
  }

  const filename = `cert_${cert.certificateNumber}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', 'certificates', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    const studentUser = await User.findById(cert.student);
    const eventObj = await Event.findById(cert.event).populate('department');

    const qrDataUrl = await generateQRCode(cert.qrVerification);
    const relativePath = await generateCertificatePDF({
      studentName: studentUser ? studentUser.name : 'Student',
      eventName: eventObj ? eventObj.title : 'Event',
      departmentName: eventObj && eventObj.department ? eventObj.department.name : 'Campus Activities',
      issueDate: cert.issueDate,
      certificateNumber: cert.certificateNumber,
      qrDataUrl,
    });
    const fullPath = path.join(__dirname, '..', relativePath);
    res.download(fullPath, filename);
  }
});

module.exports = {
  registerForEvent,
  cancelRegistration,
  scanAttendance,
  downloadTicket,
  verifyCertificate,
  downloadCertificateByNo,
};
