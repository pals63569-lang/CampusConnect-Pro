const AppError = require('./AppError');
const HttpStatusCodes = require('../constants/httpStatusCodes');

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors = []) {
    super(message, HttpStatusCodes.BAD_REQUEST, errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', errors = []) {
    super(message, HttpStatusCodes.UNAUTHORIZED, errors);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', errors = []) {
    super(message, HttpStatusCodes.FORBIDDEN, errors);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errors = []) {
    super(message, HttpStatusCodes.NOT_FOUND, errors);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errors = []) {
    super(message, HttpStatusCodes.CONFLICT, errors);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', errors = []) {
    super(message, HttpStatusCodes.UNPROCESSABLE_ENTITY, errors);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error', errors = []) {
    super(message, HttpStatusCodes.INTERNAL_SERVER_ERROR, errors);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};
