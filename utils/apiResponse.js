/**
 * Standardized API Response Wrapper
 */
class ApiResponse {
  /**
   * Send Success Response
   * @param {Object} res Express response object
   * @param {String} message Success message
   * @param {Object|Array|null} data Data payload
   * @param {Number} statusCode HTTP Status Code (Default: 200)
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const responsePayload = {
      success: true,
      message,
    };

    if (data !== null && data !== undefined) {
      responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
  }

  /**
   * Send Error Response
   * @param {Object} res Express response object
   * @param {String} message Error message
   * @param {Array} errors List of error details / field validation messages
   * @param {Number} statusCode HTTP Status Code (Default: 500)
   */
  static error(res, message = 'Internal Server Error', errors = [], statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }
}

module.exports = ApiResponse;
