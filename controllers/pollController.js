const Poll = require('../models/Poll');

// @desc    Create a poll for an event
// @route   POST /api/polls
const createPoll = async (req, res, next) => {
  const { eventId, question, options } = req.body;
  try {
    const formattedOptions = options.map(opt => ({ text: opt, votesCount: 0 }));
    const poll = await Poll.create({
      event: eventId,
      question,
      options: formattedOptions,
    });
    res.status(201).json({ success: true, message: 'Poll created successfully', poll });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active polls for an event
// @route   GET /api/polls/event/:eventId
const getPollsByEvent = async (req, res, next) => {
  try {
    const polls = await Poll.find({ event: req.params.eventId });
    
    // Format to indicate if current user has already voted
    const formattedPolls = polls.map(poll => {
      const pollObj = poll.toObject();
      const hasVoted = poll.votes.some(v => v.student.toString() === req.user.id);
      const userVote = poll.votes.find(v => v.student.toString() === req.user.id);
      
      pollObj.hasVoted = hasVoted;
      pollObj.userVote = userVote ? userVote.optionText : null;
      // Hide individual voting array list from client for privacy
      delete pollObj.votes;
      return pollObj;
    });

    res.status(200).json({ success: true, polls: formattedPolls });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote in a poll
// @route   POST /api/polls/:id/vote
const voteInPoll = async (req, res, next) => {
  const { optionText } = req.body;
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ success: false, message: 'Poll is closed' });
    }

    // Check duplicate vote
    const alreadyVoted = poll.votes.some(v => v.student.toString() === req.user.id);
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted in this poll' });
    }

    const option = poll.options.find(opt => opt.text === optionText);
    if (!option) {
      return res.status(400).json({ success: false, message: 'Invalid voting option selected' });
    }

    // Register vote
    option.votesCount += 1;
    poll.votes.push({
      student: req.user.id,
      optionText
    });

    await poll.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      poll: {
        _id: poll._id,
        question: poll.question,
        options: poll.options,
        hasVoted: true,
        userVote: optionText
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoll,
  getPollsByEvent,
  voteInPoll,
};
