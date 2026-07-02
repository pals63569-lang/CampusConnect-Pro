const Event = require('../models/Event');
const Department = require('../models/Department');
const Wishlist = require('../models/Wishlist');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { getAIRecommendations } = require('../services/aiService');

// @desc    Get all events (filtered, sorted, paginated)
// @route   GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const { category, department, status, search, sortBy, page, limit } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }
    
    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { speaker: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 9;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions = { date: 1 }; // default sorting: nearest date first
    if (sortBy === 'dateDesc') {
      sortOptions = { date: -1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: 1 };
    } else if (sortBy === 'capacity') {
      sortOptions = { capacity: -1 };
    }

    const events = await Event.find(query)
      .populate('department', 'name')
      .populate('organizer', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalEvents = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      totalPages: Math.ceil(totalEvents / limitNum),
      currentPage: pageNum,
      totalEvents,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('department', 'name')
      .populate('organizer', 'name email')
      .populate('sponsors');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
const createEvent = async (req, res, next) => {
  try {
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
      faqs
    } = req.body;

    const departmentObj = await Department.findOne({ name: departmentName });
    if (!departmentObj) {
      return res.status(404).json({ success: false, message: 'Academic department not found' });
    }

    let bannerUrl = '';
    if (req.file) {
      bannerUrl = await uploadImage(req.file);
    }

    const rulesArr = rules ? JSON.parse(rules) : [];
    const faqsArr = faqs ? JSON.parse(faqs) : [];

    const newEvent = await Event.create({
      title,
      description,
      category,
      department: departmentObj._id,
      speaker,
      venue,
      date,
      time,
      capacity: parseInt(capacity),
      availableSeats: parseInt(capacity),
      registrationDeadline,
      banner: bannerUrl,
      rules: rulesArr,
      faqs: faqsArr,
      organizer: req.user.id,
      status: 'Registration Open', // Default to open for registration
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only allow organizer or Admin to edit
    if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized modification attempt' });
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
      status
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
      const parsedCapacity = parseInt(capacity);
      const diff = parsedCapacity - event.capacity;
      event.capacity = parsedCapacity;
      event.availableSeats = Math.max(0, event.availableSeats + diff);
    }

    if (rules) event.rules = JSON.parse(rules);
    if (faqs) event.faqs = JSON.parse(faqs);

    if (req.file) {
      event.banner = await uploadImage(req.file);
    }

    const updatedEvent = await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized deletion attempt' });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Recommendations for Current User
// @route   GET /api/events/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const recommendedEvents = await getAIRecommendations(req.user.id);
    res.status(200).json({ success: true, events: recommendedEvents });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Event Status
// @route   PATCH /api/events/:id/status
const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id && !['Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized status modification' });
    }

    event.status = status;
    await event.save();

    res.status(200).json({ success: true, message: `Event status set to ${status}`, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle event wishlist status for student
// @route   POST /api/events/:id/wishlist
const toggleWishlist = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
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

    res.status(200).json({
      success: true,
      message: isWished ? 'Added to wishlist' : 'Removed from wishlist',
      isWished,
      wishlist
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRecommendations,
  updateEventStatus,
  toggleWishlist
};

