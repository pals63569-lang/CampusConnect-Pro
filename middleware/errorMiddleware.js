const logger = require("../utils/logger");
const ApiResponse = require("../utils/apiResponse");
const { AppError } = require("../utils/customErrors");

const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message || "Internal Server Error";
  error.statusCode = err.statusCode || 500;

  // Log error using Winston
  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} - ${error.message}`, {
    requestId: req.id,
    stack: err.stack,
    body: req.body,
    params: req.params,
    user: req.user ? req.user.id : "Anonymous",
  });

  // Zod Validation Error
  if (err.name === "ZodError" || err.issues) {
    const errors = (err.issues || []).map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return ApiResponse.error(res, "Validation Error", errors, 400);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with id: ${err.value}`;
    return ApiResponse.error(res, message, [], 404);
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return ApiResponse.error(res, message, [{ field, message }], 400);
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, "Validation Error", errors, 422);
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return ApiResponse.error(res, "Invalid authentication token", [], 401);
  }

  if (err.name === "TokenExpiredError") {
    return ApiResponse.error(res, "Authentication token has expired", [], 401);
  }

  // Custom Operational Errors (AppError, BadRequest, NotFound, etc.)
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.errors || [], err.statusCode);
  }

  // Fallback for generic unexpected errors
  const statusCode = error.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : error.message;

  return ApiResponse.error(res, message, [], statusCode);
};

module.exports = { errorHandler };

