import mongoose from 'mongoose';

const VALID_REASONS = [
  'spam',
  'fake_report',
  'inappropriate_content',
  'suspicious_activity',
  'duplicate',
  'harassment',
  'other',
];

const VALID_TARGET_TYPES = ['item', 'user'];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: VALID_TARGET_TYPES,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Polymorphic ref — refPath is not used because the ref changes
    },
    reason: {
      type: String,
      enum: VALID_REASONS,
      required: [true, 'Please provide a reason for the report'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: 1 });
reportSchema.index({ createdAt: -1 });

// Prevent a user from filing duplicate pending reports for the same target
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
export { VALID_REASONS, VALID_TARGET_TYPES };
