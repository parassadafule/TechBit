const mongoose = require('mongoose');

const semanticChunkSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    contentHash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

semanticChunkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SemanticChunk', semanticChunkSchema);
