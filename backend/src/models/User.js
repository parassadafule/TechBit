const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    oauthProvider: {
      type: String,
      required: true,
      enum: ['google', 'github'],
    },
    oauthId: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    website: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    likedTags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    recentSearches: [
      {
        type: String,
        trim: true,
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    activityHistory: [
      {
        action: {
          type: String,
          enum: ['view', 'like', 'share', 'comment', 'complete'],
        },
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    goals: {
      skillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate',
      },
      career: {
        type: String,
        default: 'full-stack-developer',
      },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true });
userSchema.index({ interests: 'text' });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

userSchema.virtual('contributionsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'userId',
  count: true,
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
