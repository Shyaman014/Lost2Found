import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Please specify if the item is lost or found'],
      enum: ['lost', 'found'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'electronics',
        'documents',
        'wallet',
        'keys',
        'bags',
        'clothing',
        'books',
        'stationery',
        'jewelry',
        'accessories',
        'other'
      ],
      lowercase: true,
    },
    location: {
      type: String,
      required: [true, 'Please specify the location'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide the date'],
    },
    time: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    identifyingDetails: {
      type: String,
      trim: true,
    },
    contactPreference: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'claimed', 'returned'],
      default: 'active',
    },
    image: {
      url: String,
      publicId: String,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema);

export default Item;
