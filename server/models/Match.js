import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasons: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['potential', 'dismissed'],
      default: 'potential',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index — prevents duplicate match documents for the same pair
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

// Additional query indexes
matchSchema.index({ lostItem: 1, status: 1 });
matchSchema.index({ foundItem: 1, status: 1 });
matchSchema.index({ score: -1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;
