const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizzesByEvent,
  submitQuizAttempt,
  getQuizLeaderboard,
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), createQuiz);
router.get('/event/:eventId', protect, getQuizzesByEvent);
router.post('/:id/submit', protect, submitQuizAttempt);
router.get('/:id/leaderboard', protect, getQuizLeaderboard);

module.exports = router;
