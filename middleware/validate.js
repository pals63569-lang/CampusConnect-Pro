const ApiResponse = require("../utils/apiResponse");

/**
 * Higher-order middleware function for validating Express requests using Zod schemas.
 * @param {Object} schema Object containing optional Zod schemas for body, query, and params.
 * @example validate({ body: registerSchema, params: idParamSchema })
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error.name === "ZodError" || error.issues) {
        const formattedErrors = (error.issues || []).map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return ApiResponse.error(res, "Validation Error", formattedErrors, 400);
      }
      next(error);
    }
  };
};

module.exports = validate;
