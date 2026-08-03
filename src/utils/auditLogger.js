const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Log structured audit events to MongoDB and Winston logger.
 */
const logAuditEvent = async ({ user, action, resource, resourceId, req, details = {} }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress) : '';
    const userAgent = req ? (req.headers['user-agent'] || '') : '';

    const auditData = {
      user: user ? (user._id || user.id || user) : null,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : '',
      ipAddress,
      userAgent,
      details,
    };

    logger.info(`[AUDIT] Action: ${action} | Resource: ${resource} | User: ${user ? (user._id || user.id) : 'ANONYMOUS'}`);

    if (process.env.NODE_ENV !== 'test') {
      await AuditLog.create(auditData);
    }
  } catch (err) {
    logger.error(`Failed to record audit log event: ${err.message}`, { error: err });
  }
};

module.exports = { logAuditEvent };
