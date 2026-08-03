/**
 * Reusable Query Feature builder for Mongoose models
 * Supports filtering, searching, sorting, field limiting, and pagination.
 */
class APIFeatures {
  /**
   * @param {mongoose.Query} query Mongoose Query Object
   * @param {Object} queryString Express req.query object
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.paginationMeta = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering for regex comparison operators (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(searchableFields = []) {
    if (this.queryString.search && searchableFields.length > 0) {
      const keyword = this.queryString.search;
      const searchConditions = searchableFields.map((field) => ({
        [field]: { $regex: keyword, $options: 'i' },
      }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  async paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Clone query to count total matching documents
    const countQuery = this.query.model.find(this.query.getFilter());
    const totalItems = await countQuery.countDocuments();
    const totalPages = Math.ceil(totalItems / limit) || 1;

    this.query = this.query.skip(skip).limit(limit);

    this.paginationMeta = {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return this;
  }
}

module.exports = APIFeatures;
