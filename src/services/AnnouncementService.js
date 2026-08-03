const announcementRepository = require('../repositories/AnnouncementRepository');
const { NotFoundError } = require('../errors/DomainErrors');

class AnnouncementService {
  async createAnnouncement(data, userId) {
    const announcement = await announcementRepository.create({
      ...data,
      createdBy: userId,
    });
    return announcement;
  }

  async getAnnouncementsForUser(user) {
    const role = user ? user.role : 'Student';
    const dept = user ? user.department : null;
    return await announcementRepository.findPublishedAnnouncements(role, dept);
  }

  async getAnnouncementById(id) {
    const announcement = await announcementRepository.findById(id, 'createdBy');
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }
    return announcement;
  }

  async deleteAnnouncement(id) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }
    await announcementRepository.deleteById(id);
    return true;
  }
}

module.exports = new AnnouncementService();
