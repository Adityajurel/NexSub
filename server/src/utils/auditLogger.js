const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  actor = null,
  action,
  entityType,
  entityId = '',
  description = '',
  beforeState = null,
  afterState = null,
  req = null
}) => {
  try {
    let actorId = actor?._id || null;
    let actorEmail = actor?.email || 'System';
    let actorName = actor?.name || 'System';
    let actorRole = actor?.role || 'System';

    let ipAddress = '';
    let userAgent = '';

    if (req) {
      if (!actor && req.user) {
        actorId = req.user._id;
        actorEmail = req.user.email;
        actorName = req.user.name;
        actorRole = req.user.role;
      }
      ipAddress = req.ip || req.connection?.remoteAddress || '';
      userAgent = req.headers?.['user-agent'] || '';
    }

    await AuditLog.create({
      actorId,
      actorEmail,
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : '',
      description,
      beforeState,
      afterState,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('[AuditLog Error] Failed to write audit log:', err.message);
  }
};

module.exports = { logAudit };
