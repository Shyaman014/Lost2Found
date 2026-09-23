import mongoose from 'mongoose';

const AUDIT_ACTIONS = [
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'USER_ROLE_CHANGED',
  'ITEM_REMOVED',
  'ITEM_RESTORED',
  'ITEM_FLAGGED',
  'REPORT_REVIEWED',
  'REPORT_DISMISSED',
  'REPORT_ACTION_TAKEN',
  'CLAIM_REVIEWED',
  'ADMIN_ACTION',
];

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'item', 'claim', 'report'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Human-readable snapshot so the log is self-contained even if target is later deleted
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
export { AUDIT_ACTIONS };
