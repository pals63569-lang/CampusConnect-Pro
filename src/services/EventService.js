const eventRepository = require('../repositories/EventRepository');
const Department = require('../../models/Department');
const Wishlist = require('../../models/Wishlist');
const Registration = require('../../models/Registration');
const Attendance = require('../../models/Attendance');
const Report = require('../../models/Report');
const APIFeatures = require('../../utils/apiFeatures');
const Event = require('../../models/Event');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../errors/DomainErrors');
const { uploadImage } = require('../../middleware/uploadMiddleware');
const { getAIRecommendations } = require('../../services/aiService');
const cacheService = require('../cache/cacheService');
const socketServer = require('../sockets/socketServer');

class EventService {
  async getEvents(queryParams) {
    const cacheKey = `events:${JSON.stringify(queryParams)}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { timeframe, isFree, startDate, endDate } = queryParams;

    let query = Event.find().populate('department', 'name').populate('organizer', 'name email');
    const extraFilter = {};

    if (isFree !== undefined && isFree !== '') {
      extraFilter.price = isFree === 'true' ? 0 : { $gt: 0 };
    }

    if (timeframe === 'upcoming') {
      extraFilter.date = { $gte: new Date() };
      extraFilter.status = { $ne: 'Cancelled' };
    } else if (timeframe === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      extraFilter.date = { $gte: startOfToday, $lte: endOfToday };
      extraFilter.status = { $ne: 'Cancelled' };
    } else if (timeframe === 'week') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      extraFilter.date = { $gte: startOfToday, $lte: endOfWeek };
      extraFilter.status = { $ne: 'Cancelled' };
    } else if (startDate || endDate) {
      extraFilter.date = {};
      if (startDate) extraFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const endLimit = new Date(endDate);
        endLimit.setHours(23, 59, 59, 999);
        extraFilter.date.$lte = endLimit;
      }
    }

    if (Object.keys(extraFilter).length > 0) {
      query = query.find(extraFilter);
    }

    const searchableFields = ['title', 'description', 'speaker', 'venue', 'category'];
    const features = new APIFeatures(query, queryParams)
      .filter()
      .search(searchableFields)
      .sort();

    await features.paginate();

    const events = await features.query.lean();
    const result = {
      events,
      pagination: features.paginationMeta,
    };

    await cacheService.set(cacheKey, result, 60);
    return result;
  }

  async getEventById(id) {
    const cacheKey = `event:${id}`;
    const cachedEvent = await cacheService.get(cacheKey);
    if (cachedEvent) {
      return cachedEvent;
    }

    const event = await eventRepository.incrementViews(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    await cacheService.set(cacheKey, event, 120);
    return event;
  }

  async createEvent(eventData, user, file) {
    const {
      title,
      description,
      category,
      departmentName,
      speaker,
      venue,
      date,
      time,
      capacity,
      registrationDeadline,
      rules,
      faqs,
    } = eventData;

    const departmentObj = await Department.findOne({ name: departmentName });
    if (!departmentObj) {
      throw new NotFoundError('Academic department not found');
    }

    let bannerUrl = '';
    if (file) {
      bannerUrl = await uploadImage(file);
    }

    const rulesArr = typeof rules === 'string' ? JSON.parse(rules) : (rules || []);
    const faqsArr = typeof faqs === 'string' ? JSON.parse(faqs) : (faqs || []);

    const newEvent = await eventRepository.create({
      title,
      description,
      category,
      department: departmentObj._id,
      speaker,
      venue,
      date,
      time,
      capacity: parseInt(capacity, 10),
      availableSeats: parseInt(capacity, 10),
      registrationDeadline,
      banner: bannerUrl,
      rules: rulesArr,
      faqs: faqsArr,
      organizer: user.id,
      status: 'Registration Open',
    });

    await cacheService.delByPattern('events:*');
    socketServer.emitEventCreated(newEvent);

    return newEvent;
  }

  async updateEvent(id, updateData, user, file) {
    let event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizer.toString() !== user.id && !['Admin', 'Super Admin'].includes(user.role)) {
      throw new ForbiddenError('Unauthorized modification attempt');
    }

    if (file) {
      event.banner = await uploadImage(file);
    }

    const updatedEvent = await eventRepository.updateById(id, updateData);
    await cacheService.del(`event:${id}`);
    await cacheService.delByPattern('events:*');

    return updatedEvent;
  }

  async deleteEvent(id, user) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizer.toString() !== user.id && !['Admin', 'Super Admin'].includes(user.role)) {
      throw new ForbiddenError('Unauthorized deletion attempt');
    }

    await eventRepository.deleteById(id);
    await cacheService.del(`event:${id}`);
    await cacheService.delByPattern('events:*');

    return true;
  }

  async updateEventStatus(id, status, user) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizer.toString() !== user.id && !['Admin', 'Super Admin'].includes(user.role)) {
      throw new ForbiddenError('Unauthorized status modification');
    }

    event.status = status;
    await event.save();
    await cacheService.del(`event:${id}`);
    await cacheService.delByPattern('events:*');

    return event;
  }

  async toggleFeaturedEvent(id) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    event.isFeatured = !event.isFeatured;
    await event.save();
    await cacheService.del(`event:${id}`);
    await cacheService.delByPattern('events:*');

    return event;
  }

  async toggleTrendingEvent(id) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    event.isTrending = !event.isTrending;
    await event.save();
    await cacheService.del(`event:${id}`);
    await cacheService.delByPattern('events:*');

    return event;
  }

  async getSearchSuggestions(q) {
    if (!q) return [];
    const suggestions = await Event.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { speaker: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(6)
      .select('title category speaker venue')
      .lean();

    return suggestions;
  }

  async getUserEventStatus(eventId, userId) {
    const wishlist = await Wishlist.findOne({ student: userId, events: eventId }).lean();
    const registration = await Registration.findOne({ student: userId, event: eventId }).lean();
    const attendance = await Attendance.findOne({ student: userId, event: eventId }).lean();

    return {
      inWishlist: !!wishlist,
      registrationStatus: registration ? registration.status : null,
      registrationId: registration ? registration._id : null,
      qrCode: registration ? registration.qrCode : null,
      seatNumber: registration ? registration.seatNumber : null,
      attended: !!attendance,
    };
  }

  async getSimilarEvents(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const similar = await Event.find({
      _id: { $ne: event._id },
      status: { $ne: 'Cancelled' },
      $or: [{ category: event.category }, { department: event.department }],
    })
      .limit(3)
      .populate('department', 'name')
      .lean();

    return similar;
  }

  async getRecommendations(userId) {
    return await getAIRecommendations(userId);
  }

  async toggleWishlist(eventId, userId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    let wishlist = await Wishlist.findOne({ student: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ student: userId, events: [] });
    }

    const index = wishlist.events.indexOf(eventId);
    let isWished = false;
    if (index > -1) {
      wishlist.events.splice(index, 1);
    } else {
      wishlist.events.push(eventId);
      isWished = true;
    }

    await wishlist.save();
    return { isWished, wishlist };
  }

  async reportEvent(eventId, userId, reason, comments) {
    if (!reason) {
      throw new BadRequestError('Please provide a reason for reporting');
    }

    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const report = await Report.create({
      event: eventId,
      reporter: userId,
      reason,
      comments: comments || '',
    });

    return report;
  }
}

module.exports = new EventService();
