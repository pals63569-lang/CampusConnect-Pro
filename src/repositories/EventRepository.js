const BaseRepository = require('./BaseRepository');
const Event = require('../../models/Event');

class EventRepository extends BaseRepository {
  constructor() {
    super(Event);
  }

  async incrementViews(eventId) {
    return await this.model
      .findByIdAndUpdate(eventId, { $inc: { views: 1 } }, { new: true })
      .populate('department', 'name')
      .populate('organizer', 'name email')
      .populate('sponsors')
      .lean();
  }

  async decrementSeatsIfAvailable(eventId) {
    return await this.model.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gt: 0 } },
      { $inc: { availableSeats: -1 } },
      { new: true }
    );
  }

  async incrementSeats(eventId) {
    return await this.model.findByIdAndUpdate(
      eventId,
      { $inc: { availableSeats: 1 } },
      { new: true }
    );
  }
}

module.exports = new EventRepository();
