const Event = require('../models/Event');
const Department = require('../models/Department');
const Wishlist = require('../models/Wishlist');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Report = require('../models/Report');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const APIFeatures = require('../utils/apiFeatures');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/customErrors');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { getAIRecommendations } = require('../services/aiService');

// @desc    Get all events (filtered, sorted, paginated)
// @route   GET /api/v1/events
const getEvents = asyncHandler(async (req, res) => {
  const { timeframe, isFree, startDate, endDate } = req.query;

  let query = Event.find().populate('department', 'name').populate('organizer', 'name email');

  // Custom filters before APIFeatures
  const extraFilter = {};

  if (isFree !== undefined && isFree !== '') {
    if (isFree === 'true') {
      extraFilter.price = 0;
    } else {
      extraFilter.price = { $gt: 0 };
    }
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
  const features = new APIFeatures(query, req.query)
    .filter()
    .search(searchableFields)
    .sort();

  await features.paginate();

  const events = await features.query.lean();

  return res.status(200).json({
    success: true,
    message: 'Events fetched successfully',
    data: events,
    pagination: features.paginationMeta,
  });
});

// @desc    Get single event by ID
// @route   GET /api/v1/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('department', 'name')
    .populate('organizer', 'name email')
    .populate('sponsors')
    .lean();

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  return ApiResponse.success(res, 'Event details fetched successfully', { event });
});

// @desc    Create a new event
// @route   POST /api/v1/events
const createEvent = asyncHandler(async (req, res) => {
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
  } = req.body;

  const departmentObj = await Department.findOne({ name: departmentName });
  if (!departmentObj) {
    throw new NotFoundError('Academic department not found');
  }

  let bannerUrl = '';
  if (req.file) {
    bannerUrl = await uploadImage(req.file);
  }

  const rulesArr = typeof rules === 'string' ? JSON.parse(rules) : (rules || []);
  const faqsArr = typeof faqs === 'string' ? JSON.parse(faqs) : (faqs || []);

  const newEvent = await Event.create({
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
    organizer: req.user.id,
    status: 'Registration Open',
  });

  return ApiResponse.success(res, 'Event created successfully', { event: newEvent }, 201);
});

// @desc    Update an event
// @route   PUT /api/v1/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
    throw new ForbiddenError('Unauthorized modification attempt');
  }

  const {
    title,
    description,
    category,
    speaker,
    venue,
    date,
    time,
    capacity,
    registrationDeadline,
    rules,
    faqs,
    status,
  } = req.body;

  if (title) event.title = title;
  if (description) event.description = description;
  if (category) event.category = category;
  if (speaker) event.speaker = speaker;
  if (venue) event.venue = venue;
  if (date) event.date = date;
  if (time) event.time = time;
  if (status) event.status = status;
  if (registrationDeadline) event.registrationDeadline = registrationDeadline;

  if (capacity) {
    const parsedCapacity = parseInt(capacity, 10);
    const diff = parsedCapacity - event.capacity;
    event.capacity = parsedCapacity;
    event.availableSeats = Math.max(0, event.availableSeats + diff);
  }

  if (rules) event.rules = typeof rules === 'string' ? JSON.parse(rules) : rules;
  if (faqs) event.faqs = typeof faqs === 'string' ? JSON.parse(faqs) : faqs;

  if (req.file) {
    event.banner = await uploadImage(req.file);
  }

  const updatedEvent = await event.save();
  return ApiResponse.success(res, 'Event updated successfully', { event: updatedEvent });
});

// @desc    Delete an event
// @route   DELETE /api/v1/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
    throw new ForbiddenError('Unauthorized deletion attempt');
  }

  await event.deleteOne();
  return ApiResponse.success(res, 'Event deleted successfully');
});

// @desc    Get AI Recommendations for Current User
// @route   GET /api/v1/events/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const recommendedEvents = await getAIRecommendations(req.user.id);
  return ApiResponse.success(res, 'AI Recommendations fetched', { events: recommendedEvents });
});

// @desc    Update Event Status
// @route   PATCH /api/v1/events/:id/status
const updateEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
    throw new ForbiddenError('Unauthorized status modification');
  }

  event.status = status;
  await event.save();

  return ApiResponse.success(res, `Event status set to ${status}`, { event });
});

// @desc    Toggle event wishlist status for student
// @route   POST /api/v1/events/:id/wishlist
const toggleWishlist = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const event = await Event.findById(eventId);
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

  return ApiResponse.success(res, isWished ? 'Added to wishlist' : 'Removed from wishlist', {
    isWished,
    wishlist,
  });
});

// @desc    Toggle event featured status
// @route   PATCH /api/v1/events/:id/featured
const toggleFeaturedEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  event.isFeatured = !event.isFeatured;
  await event.save();

  return ApiResponse.success(res, `Event featured status set to ${event.isFeatured}`, { event });
});

// @desc    Toggle event trending status
// @route   PATCH /api/v1/events/:id/trending
const toggleTrendingEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  event.isTrending = !event.isTrending;
  await event.save();

  return ApiResponse.success(res, `Event trending status set to ${event.isTrending}`, { event });
});

// @desc    Get search suggestions for live search autocomplete
// @route   GET /api/v1/events/suggestions
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return ApiResponse.success(res, 'No search query provided', { suggestions: [] });
  }

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

  return ApiResponse.success(res, 'Search suggestions fetched', { suggestions });
});

// @desc    Get user interaction status for an event (wishlist, registration, attendance)
// @route   GET /api/v1/events/:id/user-status
const getUserEventStatus = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const wishlist = await Wishlist.findOne({ student: userId, events: eventId }).lean();
  const inWishlist = !!wishlist;

  const registration = await Registration.findOne({ student: userId, event: eventId }).lean();
  const attendance = await Attendance.findOne({ student: userId, event: eventId }).lean();

  return ApiResponse.success(res, 'User event status fetched', {
    inWishlist,
    registrationStatus: registration ? registration.status : null,
    registrationId: registration ? registration._id : null,
    qrCode: registration ? registration.qrCode : null,
    seatNumber: registration ? registration.seatNumber : null,
    attended: !!attendance,
  });
});

// @desc    Get similar events
// @route   GET /api/v1/events/:id/similar
const getSimilarEvents = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
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

  return ApiResponse.success(res, 'Similar events fetched', { events: similar });
});

// @desc    Report an event
// @route   POST /api/v1/events/:id/report
const reportEvent = asyncHandler(async (req, res) => {
  const { reason, comments } = req.body;
  if (!reason) {
    throw new BadRequestError('Please provide a reason for reporting');
  }

  const event = await Event.findById(req.params.id).lean();
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  const report = await Report.create({
    event: req.params.id,
    reporter: req.user.id,
    reason,
    comments: comments || '',
  });

  return ApiResponse.success(
    res,
    'Event reported successfully to administrators',
    { report },
    201
  );
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRecommendations,
  updateEventStatus,
  toggleWishlist,
  toggleFeaturedEvent,
  toggleTrendingEvent,
  getSearchSuggestions,
  getUserEventStatus,
  getSimilarEvents,
  reportEvent,
};
