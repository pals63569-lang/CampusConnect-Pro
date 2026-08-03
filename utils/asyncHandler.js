/**
 * Async Route Handler Wrapper
 * Catches any uncaught Promise rejections and forwards to express global error handler middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
