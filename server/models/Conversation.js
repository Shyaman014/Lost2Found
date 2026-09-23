import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      unique: true, // Only one conversation per claim
    },
    participants: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      validate: [arrayLimit, 'A conversation must have exactly two participants'],
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

function arrayLimit(val) {
  return val.length === 2;
}

// Indexes for faster lookups
conversationSchema.index({ participants: 1 });
conversationSchema.index({ item: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
