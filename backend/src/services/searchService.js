const Post = require('../models/Post');
const {
  getEmbedding,
  normalizeEmbeddingText,
  DEFAULT_EMBEDDING_INPUT_LIMIT,
} = require('../utils/embedding');
const logger = require('../utils/logger');

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findSimilarPostsByEmbedding(embedding = [], options = {}) {
  const {
    limit = 3,
    excludePostId = null,
  } = options;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    return [];
  }

  const posts = await Post.find({
    embedding: { $exists: true, $ne: [] },
    ...(excludePostId ? { _id: { $ne: excludePostId } } : {}),
  })
    .select('userId title content tldr tags type createdAt embedding')
    .select('+embedding')
    .lean();

  return posts
    .map((post) => ({
      ...post,
      score: cosineSimilarity(embedding, post.embedding || []),
    }))
    .filter((post) => Number.isFinite(post.score) && post.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ embedding: removedEmbedding, ...post }) => post);
}

async function semanticSearch(query, options = {}) {
  const {
    limit = 3,
    excludePostId = null,
  } = options;

  const normalizedQuery = normalizeEmbeddingText(query, DEFAULT_EMBEDDING_INPUT_LIMIT);
  if (!normalizedQuery) {
    return [];
  }

  try {
    const embedding = await getEmbedding(normalizedQuery, {
      maxLength: DEFAULT_EMBEDDING_INPUT_LIMIT,
    });

    const semanticResults = await findSimilarPostsByEmbedding(embedding, {
      limit,
      excludePostId,
    });

    if (semanticResults.length > 0) {
      return semanticResults;
    }
  } catch (error) {
    logger.warn('Semantic search embedding failed, falling back to keyword search', {
      message: error.message,
    });
  }

  return Post.find({ $text: { $search: normalizedQuery } })
    .select('userId title content tldr tags type createdAt')
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
}

module.exports = {
  cosineSimilarity,
  findSimilarPostsByEmbedding,
  semanticSearch,
};
