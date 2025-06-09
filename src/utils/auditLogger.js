// src/utils/auditLogger.js
import AuditLog from '../models/AuditLog.js';

export async function logAudit({
  req,                // Pass Express req for auto user/ip/ua/session
  action,
  resourceType,
  resourceId,
  details = {},
  before = null,
  after = null,
  fieldsChanged = [],
  extra = {},
}) {
  try {
    // Get user, IP, UA from req if provided
    let user, ipAddress, userAgent, requestId, sessionId, location;
    if (req) {
      user = req.user?._id;
      ipAddress = req.ip || req.headers['x-forwarded-for'];
      userAgent = req.headers['user-agent'];
      requestId = req.headers['x-request-id'];
      sessionId = req.sessionID;
      location = req.geo || undefined; // geo middleware (optional)
    }
    await AuditLog.create({
      action,
      resourceType,
      resourceId,
      user,
      ipAddress,
      userAgent,
      requestId,
      sessionId,
      location,
      details: {
        ...details,
        before,
        after,
        fieldsChanged,
        ...extra,
      },
    });
  } catch (err) {
    // Never block request for logging errors
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('AuditLog error:', err.message);
    }
  }
}
