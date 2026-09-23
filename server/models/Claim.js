import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evidence: {
      message: {
        type: String,
        required: [true, 'Please provide a message explaining your claim'],
        trim: true,
        minlength: [10, 'Message is too short'],
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
      },
      specificDetails: {
        type: [String],
        validate: {
          validator: function (v) {
            return v && v.length > 0 && v.length <= 10;
          },
          message: 'Please provide between 1 and 10 specific details.',
        },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
claimSchema.index({ item: 1 });
claimSchema.index({ claimant: 1 });
claimSchema.index({ status: 1, createdAt: 1 });
claimSchema.index({ createdAt: -1 });

// Prevent a user from having multiple active/approved claims on the same item.
// (They can submit a new one if their previous one was rejected or cancelled).
claimSchema.index(
  { item: 1, claimant: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: ['pending', 'approved'] } 
    } 
  }
);

const Claim = mongoose.model('Claim', claimSchema);

export default Claim;
