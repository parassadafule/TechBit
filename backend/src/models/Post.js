const mongoose = require('mongoose');
const SemanticChunk = require('./SemanticChunk');

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
      select: false, 
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
postSchema.index({ likedBy: 1 });


postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true,
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

postSchema.post('findOneAndDelete', async function deletedPostCleanup(doc) {
  if (!doc?._id) {
    return;
  }

  await SemanticChunk.deleteMany({ postId: doc._id });
});

postSchema.post('deleteOne', { document: true, query: false }, async function deletedPostCleanup() {
  await SemanticChunk.deleteMany({ postId: this._id });
});

postSchema.pre('deleteMany', { document: false, query: true }, async function collectDeletedPostIds() {
  const filter = this.getFilter();
  const posts = await this.model.find(filter).select('_id').lean();
  this._deletedPostIds = posts.map((post) => post._id);
});

postSchema.post('deleteMany', { document: false, query: true }, async function deletedPostsCleanup() {
  if (!Array.isArray(this._deletedPostIds) || this._deletedPostIds.length === 0) {
    return;
  }

  await SemanticChunk.deleteMany({ postId: { $in: this._deletedPostIds } });
});

module.exports = mongoose.model('Post', postSchema);
