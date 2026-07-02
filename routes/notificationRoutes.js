const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  createAnnouncement,
  getAnnouncements,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markNotificationRead);
router.post(
  '/announce',
  protect,
  authorize('Admin', 'Super Admin', 'Faculty Coordinator'),
  createAnnouncement
);
router.get('/announcements', getAnnouncements);

module.exports = router;
