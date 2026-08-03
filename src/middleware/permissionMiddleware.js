const ApiResponse = require('../utils/responseFormatter');
const Role = require('../../models/Role');

/**
 * Higher-order middleware function to verify if the authenticated user possesses a given permission.
 * Super Admin bypasses permission checks automatically.
 * @param {String} permissionName Required permission key (e.g., 'manage_events', 'approve_requests')
 */
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', [], 401);
    }

    if (req.user.role === 'Super Admin') {
      return next();
    }

    try {
      const userRole = await Role.findOne({ name: req.user.role }).populate('permissions');
      if (!userRole) {
        return ApiResponse.error(res, `Forbidden: Role (${req.user.role}) has no configured permissions`, [], 403);
      }

      const hasRequiredPerm = userRole.permissions.some((perm) => perm.name === permissionName);
      if (!hasRequiredPerm) {
        return ApiResponse.error(
          res,
          `Forbidden: You lack the required permission (${permissionName}) for this action`,
          [],
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { hasPermission };
