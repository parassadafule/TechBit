const Post = require('../models/Post');
const Trend = require('../models/Trend');
const {
  getEmbedding,
  normalizeEmbeddingText,
  DEFAULT_EMBEDDING_INPUT_LIMIT,
} = require('../utils/embedding');
const logger = require('../utils/logger');

const MAX_CANDIDATES = 50;
const MAX_POST_SCAN = 200;
const MAX_TREND_SCAN = 100;
const DIVERSITY_TAG_LIMIT = 2;
const VECTOR_INDEX_NAME = process.env.MONGODB_ATLAS_VECTOR_SEARCH_INDEX || 'embedding_index';

function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim();
}

function clamp(value, min = 0, max = 1) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getLikesCount(post = {}) {
  if (Array.isArray(post.likes)) {
    return post.likes.length;
  }

  return Number(post.likes || 0);
}

function getCommentsCount(post = {}) {
  if (Array.isArray(post.comments)) {
    return post.comments.length;
  }

  if (Number.isFinite(post.commentsCount)) {
    return Number(post.commentsCount);
  }

  return Number(post.commentCount || 0);
}

function getUserPreferenceText(user = {}) {
  return [
    ...(Array.isArray(user.interests) ? user.interests : []),
    ...(Array.isArray(user.recentSearches) ? user.recentSearches : []),
    ...(Array.isArray(user.likedTags) ? user.likedTags : []),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
}

async function buildUserEmbedding(user = {}) {
  const preferenceText = getUserPreferenceText(user);
  if (!preferenceText) {
    return [];
  }

  try {
    return await getEmbedding(
      normalizeEmbeddingText(preferenceText, DEFAULT_EMBEDDING_INPUT_LIMIT),
      { maxLength: DEFAULT_EMBEDDING_INPUT_LIMIT },
    );
  } catch (error) {
    logger.warn('Unable to build user embedding for personalized feed', {
      error: error.message,
    });
    return [];
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function getCandidatePostIdsFromVectorStore(userEmbedding = [], limit = MAX_CANDIDATES) {
  if (!Array.isArray(userEmbedding) || userEmbedding.length === 0) {
    return [];
  }

  try {
    const candidatePosts = await Post.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: userEmbedding,
          numCandidates: Math.max(limit * 20, 100),
          limit,
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    return candidatePosts.map((post) => post._id?.toString()).filter(Boolean);
  } catch (error) {
    logger.warn('Feed vector search unavailable, falling back to broader post scan', {
      error: error.message,
      index: VECTOR_INDEX_NAME,
    });
    return [];
  }
}

async function fetchCandidatePosts(options = {}) {
  const {
    type = null,
    tags = [],
    limit = MAX_POST_SCAN,
    postIds = [],
  } = options;

  const matchStage = {
    ...(type ? { type } : {}),
    ...(Array.isArray(tags) && tags.length > 0 ? { tags: { $in: tags } } : {}),
    ...(Array.isArray(postIds) && postIds.length > 0 ? { _id: { $in: postIds } } : {}),
  };

  const posts = await Post.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: {
        path: '$author',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'postId',
        as: 'comments',
      },
    },
    {
      $addFields: {
        commentsCount: { $size: '$comments' },
      },
    },
    {
      $addFields: {
        userId: {
          _id: '$author._id',
          username: '$author.username',
          email: '$author.email',
          avatarUrl: '$author.avatarUrl',
        },
      },
    },
    {
      $project: {
        comments: 0,
        author: 0,
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
  ]);

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return posts;
  }

  const orderMap = new Map(postIds.map((postId, index) => [String(postId), index]));
  return posts.sort((left, right) => {
    const leftIndex = orderMap.get(String(left._id)) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(String(right._id)) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

async function fetchTrends() {
  const trends = await Trend.find({})
    .sort({ fetchedAt: -1, finalScore: -1, score: -1 })
    .limit(MAX_TREND_SCAN)
    .lean();

  const maxTrendScore = trends.reduce((max, trend) => {
    const score = Number(trend.data?.score ?? trend.finalScore ?? trend.score ?? 0);
    return Math.max(max, score);
  }, 1);

  return {
    maxTrendScore,
    trends: trends.map((trend) => ({
      ...trend,
      normalizedTopic: normalizeText(trend.topic || trend.normalizedTopic),
      rawScore: Number(trend.data?.score ?? trend.finalScore ?? trend.score ?? 0),
    })),
  };
}

function calculateSemanticScore(post = {}, userEmbedding = []) {
  if (!Array.isArray(userEmbedding) || userEmbedding.length === 0) {
    return 0;
  }

  if (!Array.isArray(post.embedding) || post.embedding.length === 0) {
    return 0;
  }

  return clamp(cosineSimilarity(userEmbedding, post.embedding));
}

function calculateTrendingScore(post = {}, trends = [], maxTrendScore = 1) {
  const tags = Array.isArray(post.tags) ? post.tags.map(normalizeText).filter(Boolean) : [];
  if (tags.length === 0 || trends.length === 0) {
    return 0;
  }

  const matchedScore = trends.reduce((max, trend) => {
    const topic = trend.normalizedTopic;
    if (!topic) {
      return max;
    }

    const matched = tags.some((tag) => tag === topic || tag.includes(topic) || topic.includes(tag));
    if (!matched) {
      return max;
    }

    return Math.max(max, trend.rawScore);
  }, 0);

  return clamp(matchedScore / Math.max(maxTrendScore, 1));
}

function calculateEngagementScore(post = {}, maxEngagement = 1) {
  const rawScore = (getLikesCount(post) * 2) + (getCommentsCount(post) * 3);
  return clamp(rawScore / Math.max(maxEngagement, 1));
}

function calculateRecencyScore(post = {}) {
  const createdAt = new Date(post.createdAt || Date.now());
  const ageHours = Math.max((Date.now() - createdAt.getTime()) / 3600000, 0);
  return clamp(1 - (Math.min(ageHours, 48) / 48));
}

function getLikedTagBoost(post = {}, user = {}) {
  const likedTags = new Set(
    (Array.isArray(user.likedTags) ? user.likedTags : [])
      .map(normalizeText)
      .filter(Boolean)
  );

  if (likedTags.size === 0) {
    return 0;
  }

  const matched = (Array.isArray(post.tags) ? post.tags : [])
    .map(normalizeText)
    .some((tag) => likedTags.has(tag));

  return matched ? 0.1 : 0;
}

function applyDiversity(scoredPosts = [], limit = 20) {
  const tagUsage = new Map();
  const selected = [];
  const deferred = [];

  for (const post of scoredPosts) {
    const tags = Array.isArray(post.tags)
      ? post.tags.map(normalizeText).filter(Boolean)
      : [];

    const repeatedTag = tags.find((tag) => (tagUsage.get(tag) || 0) >= DIVERSITY_TAG_LIMIT);
    if (repeatedTag) {
      deferred.push(post);
      continue;
    }

    selected.push(post);
    tags.forEach((tag) => {
      tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
    });

    if (selected.length >= limit) {
      return selected.slice(0, limit);
    }
  }

  for (const post of deferred) {
    if (selected.length >= limit) {
      break;
    }
    selected.push(post);
  }

  return selected.slice(0, limit);
}

async function getPersonalizedFeed(user = {}, limit = 20, options = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const normalizedTags = Array.isArray(options.tags)
    ? options.tags.map(normalizeText).filter(Boolean)
    : [];

  const userEmbedding = await buildUserEmbedding(user);
  const vectorCandidateIds = await getCandidatePostIdsFromVectorStore(userEmbedding, MAX_CANDIDATES);

  let posts = await fetchCandidatePosts({
    type: options.type || null,
    tags: normalizedTags,
    limit: vectorCandidateIds.length > 0 ? MAX_CANDIDATES : MAX_POST_SCAN,
    postIds: vectorCandidateIds,
  });

  if (posts.length === 0 && vectorCandidateIds.length > 0) {
    posts = await fetchCandidatePosts({
      type: options.type || null,
      tags: normalizedTags,
      limit: MAX_POST_SCAN,
    });
  }

  const { trends, maxTrendScore } = await fetchTrends();
  const maxEngagement = posts.reduce((max, post) => {
    const score = (getLikesCount(post) * 2) + (getCommentsCount(post) * 3);
    return Math.max(max, score);
  }, 1);

  const rankedPosts = posts
    .map((post) => {
      const semantic = calculateSemanticScore(post, userEmbedding);
      const trend = calculateTrendingScore(post, trends, maxTrendScore);
      const engagement = calculateEngagementScore(post, maxEngagement);
      const recency = calculateRecencyScore(post);
      const likedTagBoost = getLikedTagBoost(post, user);
      const randomness = Math.random() * 0.05;

      const weightedScore = userEmbedding.length > 0
        ? (semantic * 0.5) + (trend * 0.2) + (engagement * 0.15) + (recency * 0.15)
        : (engagement * 0.5) + (recency * 0.3) + (trend * 0.2);

      return {
        ...post,
        feedScore: Number((weightedScore + likedTagBoost + randomness).toFixed(6)),
        scoreBreakdown: {
          semantic,
          trend,
          engagement,
          recency,
          likedTagBoost,
        },
      };
    })
    .sort((left, right) => right.feedScore - left.feedScore);

  return applyDiversity(rankedPosts, safeLimit);
}

module.exports = {
  buildUserEmbedding,
  cosineSimilarity,
  calculateSemanticScore,
  calculateTrendingScore,
  calculateEngagementScore,
  calculateRecencyScore,
  getPersonalizedFeed,
};
