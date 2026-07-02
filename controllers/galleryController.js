const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const { uploadImage } = require('../middleware/uploadMiddleware');

// @desc    Get all gallery albums
// @route   GET /api/gallery
const getGallery = async (req, res, next) => {
  try {
    const albums = await Gallery.find().populate('event', 'title date');
    res.status(200).json({ success: true, count: albums.length, albums });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new album
// @route   POST /api/gallery
const createAlbum = async (req, res, next) => {
  const { albumName, description, eventId } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const album = await Gallery.create({
      albumName,
      description,
      event: eventId,
    });

    res.status(201).json({ success: true, message: 'Album created successfully', album });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload photos to an album
// @route   POST /api/gallery/:id/photos
const uploadPhotos = async (req, res, next) => {
  try {
    const album = await Gallery.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }

    const uploadPromises = req.files.map(file => uploadImage(file));
    const urls = await Promise.all(uploadPromises);

    album.photos.push(...urls);
    await album.save();

    res.status(200).json({ success: true, message: 'Photos uploaded successfully', album });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a video link to an album
// @route   POST /api/gallery/:id/videos
const addVideo = async (req, res, next) => {
  const { videoUrl } = req.body;
  try {
    const album = await Gallery.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Please provide a video URL' });
    }

    album.videos.push(videoUrl);
    await album.save();

    res.status(200).json({ success: true, message: 'Video added successfully', album });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGallery,
  createAlbum,
  uploadPhotos,
  addVideo
};

