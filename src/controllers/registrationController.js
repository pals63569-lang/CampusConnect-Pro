const registrationService = require('../services/RegistrationService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const HttpStatusCodes = require('../constants/httpStatusCodes');
const Registration = require('../../models/Registration');
const Certificate = require('../../models/Certificate');
const User = require('../../models/User');
const Event = require('../../models/Event');
const { generateQRCode } = require('../../services/qrService');
const { generateTicketPDF, generateCertificatePDF } = require('../../services/pdfService');
const { NotFoundError, ForbiddenError } = require('../errors/DomainErrors');
const path = require('path');
const fs = require('fs');

// @desc    Register for an event
// @route   POST /api/v1/registrations
const registerForEvent = asyncHandler(async (req, res) => {
  const result = await registrationService.registerForEvent(req.body.eventId, req.user.id);
  return ResponseFormatter.success(
    res,
    result.status === 'Registered'
      ? 'Successfully registered! Ticket sent to email.'
      : `Event is full. Placed on waitlist at position #${result.position}.`,
    result,
    null,
    HttpStatusCodes.CREATED
  );
});

// @desc    Cancel event registration
// @route   POST /api/v1/registrations/:id/cancel
const cancelRegistration = asyncHandler(async (req, res) => {
  await registrationService.cancelRegistration(req.params.id, req.user);
  return ResponseFormatter.success(res, 'Registration cancelled successfully');
});

// @desc    Scan QR Code to mark attendance
// @route   POST /api/v1/registrations/scan
const scanAttendance = asyncHandler(async (req, res) => {
  const result = await registrationService.scanAttendance(req.body.registrationId, req.user.id);
  if (result.duplicate) {
    return res.status(400).json({
      success: false,
      message: result.message,
      duplicate: true,
    });
  }
  return ResponseFormatter.success(res, `Attendance marked successfully for ${result.studentName}!`, result);
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
  const filePath = path.join(__dirname, '..', '..', 'uploads', 'tickets', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    const qrDataUrl = registration.qrCode || await generateQRCode(registration._id.toString());
    const relativePath = await generateTicketPDF(registration, qrDataUrl);
    const fullPath = path.join(__dirname, '..', '..', relativePath);
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

  return ResponseFormatter.success(res, 'Certificate is valid and verified', {
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
  const filePath = path.join(__dirname, '..', '..', 'uploads', 'certificates', filename);

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
    const fullPath = path.join(__dirname, '..', '..', relativePath);
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
