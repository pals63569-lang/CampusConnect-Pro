const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");
const ApiResponse = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return ApiResponse.error(res, "Not authorized, no token provided", [], 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return ApiResponse.error(res, "User session not found", [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return ApiResponse.error(res, "Authentication token has expired", [], 401);
    }
    return ApiResponse.error(res, "Not authorized, token failed", [], 401);
  }
};

module.exports = { protect };

