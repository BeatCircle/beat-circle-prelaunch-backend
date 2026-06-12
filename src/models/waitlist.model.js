import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ['artist', 'producer', 'music_fan', 'brand_investor'],
      required: [true, 'User type is required'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    stageName: {
      type: String,
      trim: true,
      maxlength: [80, 'Stage name too long'],
    },
    primaryGenre: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    musicLink: {
      type: String,
      trim: true,
    },
    // Admin-managed fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Notes too long'],
    },
  },
  { timestamps: true }
);

// Indexes for fast admin queries
waitlistSchema.index({ userType: 1 });
waitlistSchema.index({ status: 1 });
waitlistSchema.index({ createdAt: -1 });

export default mongoose.model('Waitlist', waitlistSchema);
