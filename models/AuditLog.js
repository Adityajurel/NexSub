const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorEmail: {
      type: String,
      default: 'System'
    },
    actorName: {
      type: String,
      default: 'System'
    },
    actorRole: {
      type: String,
      default: 'System'
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
