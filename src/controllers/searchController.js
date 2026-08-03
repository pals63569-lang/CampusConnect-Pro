const searchService = require('../services/SearchService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');

const globalSearch = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  const results = await searchService.globalSearch(q, type);
  return ResponseFormatter.success(res, 'Global search results fetched', results);
});

module.exports = { globalSearch };
