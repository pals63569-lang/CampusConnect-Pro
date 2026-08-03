const HttpStatusCodes = require('../constants/httpStatusCodes');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR, errors = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
