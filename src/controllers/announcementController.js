const announcementService = require('../services/AnnouncementService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const HttpStatusCodes = require('../constants/httpStatusCodes');

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user.id);
  return ResponseFormatter.success(
    res,
    'Announcement published successfully',
    { announcement },
    null,
    HttpStatusCodes.CREATED
  );
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementService.getAnnouncementsForUser(req.user);
  return ResponseFormatter.success(res, 'Announcements fetched successfully', { announcements });
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.id);
  return ResponseFormatter.success(res, 'Announcement fetched', { announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  await announcementService.deleteAnnouncement(req.params.id);
  return ResponseFormatter.success(res, 'Announcement deleted successfully');
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
};
