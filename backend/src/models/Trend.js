const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedTopic: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      enum: ['github', 'stackoverflow', 'reddit', 'hackernews'],
    },
    score: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    data: {
      type: Object,
      default: {},
    },
    category: { type: String },
    delta: { type: Number, default: 0 },
    rank: { type: Number },
    confidence: { type: String, enum: ['A', 'B', 'C', 'D'] },
    momentum: { type: String },
    momentumEmoji: { type: String },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

trendSchema.index({ normalizedTopic: 1 }, { unique: true, sparse: true });
trendSchema.index({ source: 1, finalScore: -1 });
trendSchema.index({ fetchedAt: -1 });

trendSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Trend', trendSchema);
