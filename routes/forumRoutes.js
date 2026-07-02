const express = require('express');
const router = express.Router();
const {
  createPost,
  getPostsByEvent,
  likePost,
  replyToPost,
  togglePinPost,
  deletePost,
  deleteComment,
  markFacultyAnswer,
} = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/posts', protect, createPost);
router.get('/event/:eventId', protect, getPostsByEvent);
router.post('/posts/:id/like', protect, likePost);
router.post('/posts/:id/reply', protect, replyToPost);
router.patch('/:id/pin', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), togglePinPost);

router.delete('/posts/:id', protect, deletePost);
router.delete('/replies/:id', protect, deleteComment);
router.patch('/replies/:id/faculty-answer', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), markFacultyAnswer);

module.exports = router;
