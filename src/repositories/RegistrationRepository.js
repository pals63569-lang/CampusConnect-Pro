const BaseRepository = require('./BaseRepository');
const Registration = require('../../models/Registration');

class RegistrationRepository extends BaseRepository {
  constructor() {
    super(Registration);
  }

  async findByStudentAndEvent(studentId, eventId) {
    return await this.model.findOne({ student: studentId, event: eventId });
  }

  async findActiveRegistration(studentId, eventId) {
    return await this.model.findOne({
      student: studentId,
      event: eventId,
      status: { $ne: 'Cancelled' },
    });
  }
}

module.exports = new RegistrationRepository();
