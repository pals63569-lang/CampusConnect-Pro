const registrationRepository = require('../repositories/RegistrationRepository');
const eventRepository = require('../repositories/EventRepository');
const userRepository = require('../repositories/UserRepository');
const Waitlist = require('../../models/Waitlist');
const Attendance = require('../../models/Attendance');
const Badge = require('../../models/Badge');
const Certificate = require('../../models/Certificate');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../errors/DomainErrors');
const { generateQRCode } = require('../../services/qrService');
const { generateTicketPDF, generateCertificatePDF } = require('../../services/pdfService');
const { sendRegistrationTicket } = require('../../services/emailService');
const socketServer = require('../sockets/socketServer');
const cacheService = require('../cache/cacheService');
const path = require('path');
const fs = require('fs');

class RegistrationService {
  async registerForEvent(eventId, userId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (['Cancelled', 'Completed'].includes(event.status)) {
      throw new BadRequestError(`Registration closed: Event is ${event.status}`);
    }

    if (new Date(event.registrationDeadline) < Date.now()) {
      throw new BadRequestError('Registration deadline has passed');
    }

    const existingReg = await registrationRepository.findActiveRegistration(userId, eventId);
    if (existingReg) {
      throw new BadRequestError(`You are already registered/waitlisted for this event as: ${existingReg.status}`);
    }

    const prefix = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
    const num = Math.floor(Math.random() * 50) + 1;
    const seatNumber = `${prefix}-${num}`;

    const updatedEvent = await eventRepository.decrementSeatsIfAvailable(eventId);

    if (updatedEvent) {
      let registration = await registrationRepository.create({
        student: userId,
        event: eventId,
        status: 'Registered',
        seatNumber,
      });

      const studentObj = await userRepository.findById(userId);
      registration.student = studentObj;
      registration.event = updatedEvent;

      const qrDataUrl = await generateQRCode(registration._id.toString());
      registration.qrCode = qrDataUrl;
      await registration.save();

      const pdfRelativePath = await generateTicketPDF(registration, qrDataUrl);
      await sendRegistrationTicket(
        studentObj.email,
        updatedEvent.title,
        registration._id.toString(),
        path.join(__dirname, '..', '..', pdfRelativePath)
      );

      await cacheService.del(`event:${eventId}`);
      await cacheService.delByPattern('events:*');
      socketServer.emitSeatUpdate(eventId, updatedEvent.availableSeats);

      return {
        status: 'Registered',
        registration,
      };
    } else {
      let waitlist = await Waitlist.findOne({ event: eventId });
      if (!waitlist) {
        waitlist = await Waitlist.create({ event: eventId, list: [] });
      }

      const position = waitlist.list.length + 1;
      waitlist.list.push({ student: userId, position });
      await waitlist.save();

      const registration = await registrationRepository.create({
        student: userId,
        event: eventId,
        status: 'Waitlisted',
      });

      return {
        status: 'Waitlisted',
        position,
        registration,
      };
    }
  }

  async cancelRegistration(registrationId, user) {
    const registration = await registrationRepository.findById(registrationId, 'event');
    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.student.toString() !== user.id && !['Admin', 'Super Admin'].includes(user.role)) {
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
      await eventRepository.incrementSeats(event._id);

      const waitlist = await Waitlist.findOne({ event: event._id });
      if (waitlist && waitlist.list.length > 0) {
        waitlist.list.sort((a, b) => a.position - b.position);
        const nextInLine = waitlist.list.shift();

        waitlist.list.forEach((item, index) => {
          item.position = index + 1;
        });
        await waitlist.save();

        const promotedReg = await registrationRepository.findByStudentAndEvent(nextInLine.student, event._id);
        if (promotedReg) {
          await eventRepository.decrementSeatsIfAvailable(event._id);

          const prefix = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
          const num = Math.floor(Math.random() * 50) + 1;
          promotedReg.seatNumber = `${prefix}-${num}`;
          promotedReg.status = 'Registered';

          const studentUser = await userRepository.findById(nextInLine.student);
          promotedReg.student = studentUser;
          promotedReg.event = event;

          const qrDataUrl = await generateQRCode(promotedReg._id.toString());
          promotedReg.qrCode = qrDataUrl;
          await promotedReg.save();

          const pdfRelativePath = await generateTicketPDF(promotedReg, qrDataUrl);
          await sendRegistrationTicket(
            studentUser.email,
            event.title,
            promotedReg._id.toString(),
            path.join(__dirname, '..', '..', pdfRelativePath)
          );
        }
      }
    }

    await cacheService.del(`event:${event._id}`);
    await cacheService.delByPattern('events:*');

    return true;
  }

  async scanAttendance(registrationId, markerUserId) {
    const registration = await registrationRepository.findById(registrationId, 'event student');
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
      return {
        duplicate: true,
        message: `Attendance already marked for ${registration.student.name}`,
      };
    }

    const attendance = await Attendance.create({
      registration: registration._id,
      student: registration.student._id,
      event: registration.event._id,
      markedBy: markerUserId,
    });

    const studentUser = await userRepository.findById(registration.student._id);
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

    return {
      duplicate: false,
      studentName: studentUser.name,
      eventName: registration.event.title,
      scanTime: attendance.scanTime,
      pointsAwarded: 50,
      totalPoints: studentUser.rewardPoints,
      badgeAwarded: badgeAwarded ? badgeAwarded.name : null,
    };
  }
}

module.exports = new RegistrationService();
