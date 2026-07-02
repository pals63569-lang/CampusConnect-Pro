const express = require('express');
const router = express.Router();
const {
  createPoll,
  getPollsByEvent,
  voteInPoll,
} = require('../controllers/pollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), createPoll);
router.get('/event/:eventId', protect, getPollsByEvent);
router.post('/:id/vote', protect, voteInPoll);

module.exports = router;
