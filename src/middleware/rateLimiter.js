const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${req.ip} on ${req.originalUrl}`);
      return res.status(429).json({
        success: false,
        message,
        data: null,
        errors: [{ message }],
      });
    },
  });
};

const globalLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  'Too many requests from this IP. Please try again after 15 minutes.'
);

const loginLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again after 15 minutes.'
);

const otpLimiter = createLimiter(
  10 * 60 * 1000,
  5,
  'Too many OTP requests. Please try again after 10 minutes.'
);

const aiLimiter = createLimiter(
  1 * 60 * 1000,
  15,
  'Too many AI requests. Please slow down.'
);

const passwordResetLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Too many password reset requests. Please try again after 15 minutes.'
);

module.exports = {
  globalLimiter,
  loginLimiter,
  otpLimiter,
  aiLimiter,
  passwordResetLimiter,
};
