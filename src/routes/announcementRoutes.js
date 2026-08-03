const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../../middleware/authMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', protect, hasPermission('manage_notices'), createAnnouncement);
router.delete('/:id', protect, hasPermission('manage_notices'), deleteAnnouncement);

module.exports = router;
