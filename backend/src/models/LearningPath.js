const mongoose = require('mongoose');

const learningPathStepSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
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

const generatedTaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    estimatedHours: {
      type: Number,
      default: 1,
      min: 1,
      max: 40,
    },
    resourceQuery: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    deliverable: {
      type: String,
      trim: true,
      maxlength: 220,
    },
  },
  { _id: false },
);

const milestoneSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    week: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    objective: {
      type: String,
      trim: true,
      maxlength: 260,
    },
    tasks: {
      type: [generatedTaskSchema],
      default: [],
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
    clientId: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 140,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    level: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    durationWeeks: {
      type: Number,
      default: 4,
      min: 1,
      max: 52,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    assumptions: {
      type: [String],
      default: [],
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    completedTasks: {
      type: Map,
      of: Boolean,
      default: {},
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
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
learningPathSchema.index({ userId: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('LearningPath', learningPathSchema);
