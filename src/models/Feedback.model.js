import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name too long'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [100, 'Role too long'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required'],
      trim: true,
      maxlength: [2000, 'Feedback must be under 2000 characters'],
    },
    // Admin moderation
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Only approved feedbacks can be featured as public reviews
    featured: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes too long'],
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ featured: 1 });
feedbackSchema.index({ createdAt: -1 });

// Auto-unfeature when rejected
feedbackSchema.pre('save', function () {
  if (this.status === 'rejected') this.featured = false;
});

export default mongoose.model('Feedback', feedbackSchema);