const HttpStatusCodes = require('../constants/httpStatusCodes');

/**
 * Enterprise Response Formatter Utility
 */
class ResponseFormatter {
  /**
   * Send Standard Success Response
   * @param {Object} res Express response object
   * @param {String} message Success message
   * @param {Object|Array|null} data Data payload
   * @param {Object|null} meta Pagination or metadata
   * @param {Number} statusCode HTTP status code (Default: 200)
   */
  static success(res, message = 'Success', data = null, meta = null, statusCode = HttpStatusCodes.OK) {
    const payload = {
      success: true,
      message,
    };

    if (data !== null && data !== undefined) {
      payload.data = data;
    }

    if (meta !== null && meta !== undefined) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send Standard Error Response
   * @param {Object} res Express response object
   * @param {String} message Error message
   * @param {Array} errors Array of field/error details
   * @param {Number} statusCode HTTP status code (Default: 500)
   */
  static error(res, message = 'Internal Server Error', errors = [], statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }
}

module.exports = ResponseFormatter;
