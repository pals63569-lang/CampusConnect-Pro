const express = require('express');
const router = express.Router();
const {
  getGallery,
  createAlbum,
  uploadPhotos,
  addVideo,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/', getGallery);
router.post('/', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), createAlbum);
router.post('/:id/photos', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), upload.array('photos', 10), uploadPhotos);
router.post('/:id/videos', protect, authorize('Admin', 'Super Admin', 'Faculty Coordinator'), addVideo);

module.exports = router;
