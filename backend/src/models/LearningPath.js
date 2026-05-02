const mongoose = require('mongoose');

const learningPathStepSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    helpful: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false },
);

const learningPathSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    steps: {
      type: [learningPathStepSchema],
      default: [],
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

learningPathSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
