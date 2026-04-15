const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    goals: {
      type: Object,
      required: true,
    },
    items: [
      {
        step: {
          type: Number,
          required: true,
        },
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
          required: true,
        },
        type: {
          type: String,
          enum: ['blog', 'repo', 'video', 'podcast'],
        },
        reason: {
          type: String,
          trim: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

learningPathSchema.index({ userId: 1 });
learningPathSchema.index({ generatedAt: -1 });

learningPathSchema.virtual('progress').get(function () {
  if (this.items.length === 0) return 0;
  const completed = this.items.filter((item) => item.completed).length;
  return Math.round((completed / this.items.length) * 100);
});

learningPathSchema.set('toJSON', { virtuals: true });
learningPathSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LearningPath', learningPathSchema);
