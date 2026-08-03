const AuditLog = require('../models/AuditLog');
const logger = require('../../utils/logger');

/**
 * Middleware function to record audit logs for mutating API operations (POST, PUT, PATCH, DELETE).
 * @param {String} action Action name (e.g. 'CREATE_EVENT', 'UPDATE_PROFILE', 'DELETE_USER')
 * @param {String} resource Resource name (e.g. 'Event', 'User', 'Announcement')
 */
const auditLog = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const userId = req.user ? req.user.id : null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        const resourceId = req.params.id || req.body.id || req.body.eventId || '';

        AuditLog.create({
          user: userId,
          action,
          resource,
          resourceId,
          ipAddress,
          userAgent,
          details: {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
          },
        }).catch((err) => {
          logger.error(`Failed to write Audit Log: ${err.message}`);
        });
      }
    });

    next();
  };
};

module.exports = auditLog;
