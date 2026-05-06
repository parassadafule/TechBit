const mongoose = require('mongoose');
const Post = require('../models/Post');
const logger = require('../utils/logger');
const { getEmbedding, normalizeEmbeddingText } = require('../utils/embedding');

const VECTOR_INDEX_NAME = 'embedding_index';
const DEFAULT_NUM_CANDIDATES = 100;
const DEFAULT_LIMIT = 3;

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const length = Math.min(a.length, b.length);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < length; index += 1) {
    dotProduct += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function runAtlasVectorSearch(queryEmbedding, limit, numCandidates = DEFAULT_NUM_CANDIDATES) {
  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates,
        limit,
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        title: 1,
        content: 1,
        tldr: 1,
        blogUrl: 1,
        tags: 1,
        type: 1,
        likes: 1,
        createdAt: 1,
        updatedAt: 1,
        provenance: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  return Post.aggregate(pipeline);
}

async function runManualVectorSearch(queryEmbedding, limit) {
  const posts = await Post.find({
    embedding: { $exists: true, $ne: [] },
  })
    .select('+embedding')
    .lean();

  return posts
    .map((post) => ({
      ...post,
      score: cosineSimilarity(queryEmbedding, post.embedding || []),
    }))
    .filter((post) => Number.isFinite(post.score) && post.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ embedding, ...post }) => post);
}

async function runTextSearch(query, limit) {
  const normalizedQuery = normalizeEmbeddingText(query);
  if (!normalizedQuery) {
    return [];
  }

  return Post.find({ $text: { $search: normalizedQuery } })
    .select('-embedding')
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
}

async function findRelatedPosts(query, options = {}) {
  const {
    limit = DEFAULT_LIMIT,
    numCandidates = DEFAULT_NUM_CANDIDATES,
    excludePostId = null,
  } = options;

  const normalizedQuery = normalizeEmbeddingText(query);
  if (!normalizedQuery) {
    return [];
  }

  let queryEmbedding = [];
  try {
    queryEmbedding = await getEmbedding(normalizedQuery);
  } catch (error) {
    logger.warn('Query embedding generation failed, falling back to keyword search', {
      message: error.message,
    });
    const fallbackResults = await runTextSearch(normalizedQuery, limit + (excludePostId ? 1 : 0));
    return filterExcludedPost(fallbackResults, excludePostId).slice(0, limit);
  }

  try {
    const atlasResults = await runAtlasVectorSearch(
      queryEmbedding,
      excludePostId ? limit + 1 : limit,
      numCandidates,
    );

    return filterExcludedPost(atlasResults, excludePostId).slice(0, limit);
  } catch (error) {
    logger.warn('MongoDB Atlas vector search unavailable, falling back to manual cosine similarity', {
      message: error.message,
      index: VECTOR_INDEX_NAME,
    });
  }

  try {
    const manualResults = await runManualVectorSearch(queryEmbedding, excludePostId ? limit + 1 : limit);
    const filteredManualResults = filterExcludedPost(manualResults, excludePostId).slice(0, limit);
    if (filteredManualResults.length > 0) {
      return filteredManualResults;
    }
  } catch (error) {
    logger.warn('Manual cosine similarity fallback failed, falling back to text search', {
      message: error.message,
    });
  }

  const textResults = await runTextSearch(normalizedQuery, excludePostId ? limit + 1 : limit);
  return filterExcludedPost(textResults, excludePostId).slice(0, limit);
}

function filterExcludedPost(posts = [], excludePostId = null) {
  if (!excludePostId) {
    return posts;
  }

  const excludedId = mongoose.Types.ObjectId.isValid(excludePostId)
    ? new mongoose.Types.ObjectId(excludePostId).toString()
    : String(excludePostId);

  return posts.filter((post) => post?._id?.toString() !== excludedId);
}

module.exports = {
  VECTOR_INDEX_NAME,
  cosineSimilarity,
  findRelatedPosts,
  runAtlasVectorSearch,
};
