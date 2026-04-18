const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    tldr: {
      type: String,
      trim: true,
      maxlength: 800,
    },
    blogUrl: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    type: {
      type: String,
      required: true,
      enum: ['blog', 'repo', 'video', 'podcast'],
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    embedding: {
      type: [Number],
      default: [],
      select: false, // Don't include embeddings in standard payloads
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ title: 'text', content: 'text', tldr: 'text' }); // Full-text search
postSchema.index({ tags: 1 }); // Multikey index for tag filtering
postSchema.index({ type: 1, createdAt: -1 }); // Compound for feed queries
postSchema.index({ userId: 1, createdAt: -1 }); // User posts with date sorting
postSchema.index({ createdAt: -1 }); // Global date sorting
postSchema.index({ likes: -1, shares: -1 }); // Trending posts


postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true,
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
