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
  toggleFeaturedEvent,
  toggleTrendingEvent,
  getSearchSuggestions,
  getUserEventStatus,
  getSimilarEvents,
  reportEvent,
} = require('../src/controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../utils/validators/commonValidator');
const { eventQuerySchema } = require('../utils/validators/eventValidator');

router.get('/', validate({ query: eventQuerySchema }), getEvents);
router.get('/suggestions', getSearchSuggestions);
router.get('/recommendations', protect, getRecommendations);
router.get('/:id', validate({ params: idParamSchema }), getEventById);

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
  validate({ params: idParamSchema }),
  upload.single('banner'),
  updateEvent
);

router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  validate({ params: idParamSchema }),
  deleteEvent
);

router.patch(
  '/:id/status',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  validate({ params: idParamSchema }),
  updateEventStatus
);

router.patch(
  '/:id/featured',
  protect,
  authorize('Admin', 'Super Admin'),
  validate({ params: idParamSchema }),
  toggleFeaturedEvent
);

router.patch(
  '/:id/trending',
  protect,
  authorize('Admin', 'Super Admin'),
  validate({ params: idParamSchema }),
  toggleTrendingEvent
);

router.post(
  '/:id/wishlist',
  protect,
  authorize('Student'),
  validate({ params: idParamSchema }),
  toggleWishlist
);

router.get('/:id/user-status', protect, validate({ params: idParamSchema }), getUserEventStatus);
router.get('/:id/similar', validate({ params: idParamSchema }), getSimilarEvents);
router.post('/:id/report', protect, validate({ params: idParamSchema }), reportEvent);

module.exports = router;
