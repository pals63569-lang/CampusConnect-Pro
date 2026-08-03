const eventService = require('../services/EventService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const EventDTO = require('../dtos/EventDTO');
const HttpStatusCodes = require('../constants/httpStatusCodes');

// @desc    Get all events
// @route   GET /api/v1/events
const getEvents = asyncHandler(async (req, res) => {
  const { events, pagination } = await eventService.getEvents(req.query);
  return ResponseFormatter.success(
    res,
    'Events fetched successfully',
    EventDTO.toListResponse(events),
    pagination
  );
});

// @desc    Get single event by ID
// @route   GET /api/v1/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  return ResponseFormatter.success(res, 'Event details fetched successfully', {
    event: EventDTO.toResponse(event),
  });
});

// @desc    Create a new event
// @route   POST /api/v1/events
const createEvent = asyncHandler(async (req, res) => {
  const newEvent = await eventService.createEvent(req.body, req.user, req.file);
  return ResponseFormatter.success(
    res,
    'Event created successfully',
    { event: EventDTO.toResponse(newEvent) },
    null,
    HttpStatusCodes.CREATED
  );
});

// @desc    Update an event
// @route   PUT /api/v1/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const updatedEvent = await eventService.updateEvent(req.params.id, req.body, req.user, req.file);
  return ResponseFormatter.success(res, 'Event updated successfully', {
    event: EventDTO.toResponse(updatedEvent),
  });
});

// @desc    Delete an event
// @route   DELETE /api/v1/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.user);
  return ResponseFormatter.success(res, 'Event deleted successfully');
});

// @desc    Get AI Recommendations
// @route   GET /api/v1/events/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const events = await eventService.getRecommendations(req.user.id);
  return ResponseFormatter.success(res, 'AI Recommendations fetched', { events });
});

// @desc    Update event status
// @route   PATCH /api/v1/events/:id/status
const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await eventService.updateEventStatus(req.params.id, req.body.status, req.user);
  return ResponseFormatter.success(res, `Event status updated to ${req.body.status}`, {
    event: EventDTO.toResponse(event),
  });
});

// @desc    Toggle featured event status
// @route   PATCH /api/v1/events/:id/featured
const toggleFeaturedEvent = asyncHandler(async (req, res) => {
  const event = await eventService.toggleFeaturedEvent(req.params.id);
  return ResponseFormatter.success(res, `Featured status updated to ${event.isFeatured}`, {
    event: EventDTO.toResponse(event),
  });
});

// @desc    Toggle trending event status
// @route   PATCH /api/v1/events/:id/trending
const toggleTrendingEvent = asyncHandler(async (req, res) => {
  const event = await eventService.toggleTrendingEvent(req.params.id);
  return ResponseFormatter.success(res, `Trending status updated to ${event.isTrending}`, {
    event: EventDTO.toResponse(event),
  });
});

// @desc    Get search suggestions
// @route   GET /api/v1/events/suggestions
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await eventService.getSearchSuggestions(req.query.q);
  return ResponseFormatter.success(res, 'Search suggestions fetched', { suggestions });
});

// @desc    Get user event status
// @route   GET /api/v1/events/:id/user-status
const getUserEventStatus = asyncHandler(async (req, res) => {
  const status = await eventService.getUserEventStatus(req.params.id, req.user.id);
  return ResponseFormatter.success(res, 'User event status fetched', status);
});

// @desc    Get similar events
// @route   GET /api/v1/events/:id/similar
const getSimilarEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getSimilarEvents(req.params.id);
  return ResponseFormatter.success(res, 'Similar events fetched', {
    events: EventDTO.toListResponse(events),
  });
});

// @desc    Toggle event wishlist status for student
// @route   POST /api/v1/events/:id/wishlist
const toggleWishlist = asyncHandler(async (req, res) => {
  const result = await eventService.toggleWishlist(req.params.id, req.user.id);
  return ResponseFormatter.success(
    res,
    result.isWished ? 'Added to wishlist' : 'Removed from wishlist',
    result
  );
});

// @desc    Report an event
// @route   POST /api/v1/events/:id/report
const reportEvent = asyncHandler(async (req, res) => {
  const { reason, comments } = req.body;
  const report = await eventService.reportEvent(req.params.id, req.user.id, reason, comments);
  return ResponseFormatter.success(
    res,
    'Event reported successfully to administrators',
    { report },
    null,
    HttpStatusCodes.CREATED
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
  toggleFeaturedEvent,
  toggleTrendingEvent,
  getSearchSuggestions,
  getUserEventStatus,
  getSimilarEvents,
  toggleWishlist,
  reportEvent,
};
