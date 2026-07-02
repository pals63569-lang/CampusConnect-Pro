const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRecommendations,
  updateEventStatus,
  toggleWishlist,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/', getEvents);
router.get('/recommendations', protect, getRecommendations);
router.get('/:id', getEventById);

router.post(
  '/',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  upload.single('banner'),
  createEvent
);

router.put(
  '/:id',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  upload.single('banner'),
  updateEvent
);

router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  deleteEvent
);

router.patch(
  '/:id/status',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  updateEventStatus
);

router.post(
  '/:id/wishlist',
  protect,
  authorize('Student'),
  toggleWishlist
);

module.exports = router;
