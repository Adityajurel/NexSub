const AuditLog = require('../../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, actorRole, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorRole) filter.actorRole = actorRole;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs
};
