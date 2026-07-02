const DiscussionPost = require('../models/DiscussionPost');
const Comment = require('../models/Comment');

// @desc    Create a discussion post
// @route   POST /api/forum/posts
const createPost = async (req, res, next) => {
  const { eventId, title, content } = req.body;
  try {
    const post = await DiscussionPost.create({
      event: eventId,
      student: req.user.id,
      title,
      content,
    });
    res.status(201).json({ success: true, message: 'Question posted successfully', post });
  } catch (error) {
    next(error);
  }
};

// @desc    Get discussion posts for an event
// @route   GET /api/forum/event/:eventId
const getPostsByEvent = async (req, res, next) => {
  try {
    const posts = await DiscussionPost.find({ event: req.params.eventId })
      .populate('student', 'name role profilePic')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'name role profilePic' }
      })
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a post
// @route   POST /api/forum/posts/:id/like
const likePost = async (req, res, next) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likeIdx = post.likes.indexOf(req.user.id);
    if (likeIdx > -1) {
      // Unlike
      post.likes.splice(likeIdx, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();
    res.status(200).json({ success: true, likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a post
// @route   POST /api/forum/posts/:id/reply
const replyToPost = async (req, res, next) => {
  const { content } = req.body;
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      discussionPost: post._id,
      user: req.user.id,
      content,
    });

    post.replies.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name role profilePic');

    res.status(201).json({ success: true, message: 'Reply submitted successfully', reply: populatedComment });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin or Unpin post (Faculty/Admin only)
// @route   PATCH /api/forum/posts/:id/pin
const togglePinPost = async (req, res, next) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.status(200).json({ success: true, message: post.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully', post });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a discussion post
// @route   DELETE /api/forum/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await DiscussionPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.student.toString() !== req.user.id && !['Admin', 'Super Admin', 'Faculty Coordinator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized post deletion' });
    }

    await Comment.deleteMany({ discussionPost: post._id });
    await post.deleteOne();

    res.status(200).json({ success: true, message: 'Post and replies deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reply/comment
// @route   DELETE /api/forum/replies/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    if (comment.user.toString() !== req.user.id && !['Admin', 'Super Admin', 'Faculty Coordinator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized reply deletion' });
    }

    await DiscussionPost.findByIdAndUpdate(comment.discussionPost, {
      $pull: { replies: comment._id }
    });

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Reply deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark reply as Faculty Answer
// @route   PATCH /api/forum/replies/:id/faculty-answer
const markFacultyAnswer = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    comment.isFacultyAnswer = !comment.isFacultyAnswer;
    await comment.save();

    res.status(200).json({
      success: true,
      message: comment.isFacultyAnswer ? 'Marked as faculty answer' : 'Removed faculty answer tag',
      comment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPostsByEvent,
  likePost,
  replyToPost,
  togglePinPost,
  deletePost,
  deleteComment,
  markFacultyAnswer
};

