/**
 * Express middleware for parsing standard query parameters:
 * - Pagination: page, limit, skip
 * - Sorting: sort (e.g. -createdAt,title)
 * - Field selection: fields (e.g. title,date)
 * - Text search: q
 */
const queryFeaturesMiddleware = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  let sort = {};
  if (req.query.sort) {
    const fields = req.query.sort.split(',');
    fields.forEach((field) => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });
  } else {
    sort = { createdAt: -1 };
  }

  let select = '';
  if (req.query.fields) {
    select = req.query.fields.split(',').join(' ');
  }

  const searchQuery = req.query.q || req.query.search || '';

  req.pagination = { page, limit, skip };
  req.sortOptions = sort;
  req.selectOptions = select;
  req.searchQuery = searchQuery;

  next();
};

module.exports = queryFeaturesMiddleware;
