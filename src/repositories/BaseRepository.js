/**
 * Base Repository class providing common Mongoose abstraction methods.
 */
class BaseRepository {
  /**
   * @param {mongoose.Model} model Mongoose Model
   */
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, populate = '', select = '') {
    return await this.model.findById(id).populate(populate).select(select);
  }

  async findOne(query, populate = '', select = '') {
    return await this.model.findOne(query).populate(populate).select(select);
  }

  async find(query = {}, sort = '-createdAt', skip = 0, limit = 10, populate = '', select = '') {
    return await this.model
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select)
      .lean();
  }

  async findOneAndUpdate(query, update, options = { new: true }) {
    return await this.model.findOneAndUpdate(query, update, options);
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await this.model.countDocuments(query);
  }
}

module.exports = BaseRepository;
