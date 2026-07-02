const Feedback = require('../models/Feedback');
const Attendance = require('../models/Attendance');

// @desc    Submit event feedback
// @route   POST /api/feedback
const submitFeedback = async (req, res, next) => {
  const { eventId, rating, comments, isAnonymous } = req.body;
  try {
    // Only students who attended can submit feedback
    const attended = await Attendance.findOne({ student: req.user.id, event: eventId });
    if (!attended) {
      return res.status(403).json({
        success: false,
        message: 'Feedback submission is restricted to verified event attendees'
      });
    }

    // Check duplicate feedback
    const existingFeedback = await Feedback.findOne({ student: req.user.id, event: eventId });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this event' });
    }

    const feedback = await Feedback.create({
      event: eventId,
      student: req.user.id,
      rating: parseInt(rating),
      comments,
      isAnonymous: isAnonymous === true || isAnonymous === 'true',
    });

    res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback analysis for an event
// @route   GET /api/feedback/event/:eventId
const getEventFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.eventId })
      .populate('student', 'name profilePic role');

    // Calculate analytics
    let totalRating = 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const anonymizedFeedbacks = feedbacks.map(fb => {
      const fbObj = fb.toObject();
      totalRating += fb.rating;
      ratingBreakdown[fb.rating] += 1;

      if (fb.isAnonymous) {
        fbObj.student = { name: 'Anonymous Student', profilePic: '', role: 'Student' };
      }
      return fbObj;
    });

    const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      averageRating: parseFloat(averageRating),
      ratingBreakdown,
      feedbacks: anonymizedFeedbacks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback,
};
