const BaseRepository = require('./BaseRepository');
const User = require('../../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  async findByEmailWithPassword(email) {
    return await this.model.findOne({ email }).populate('department');
  }

  async updateRefreshToken(userId, refreshToken) {
    return await this.model.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }
}

module.exports = new UserRepository();
