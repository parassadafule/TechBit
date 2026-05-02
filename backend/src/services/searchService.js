const Post = require('../models/Post');
const {
  getEmbedding,
  normalizeEmbeddingText,
  DEFAULT_EMBEDDING_INPUT_LIMIT,
} = require('../utils/embedding');
const { serializePosts } = require('../utils/postResponse');
const logger = require('../utils/logger');

const VECTOR_INDEX_NAME = process.env.MONGODB_ATLAS_VECTOR_SEARCH_INDEX || 'embedding_index';
const VECTOR_CANDIDATE_LIMIT = 100;

async function vectorSearchPosts(queryEmbedding = [], options = {}) {
  const { limit = 3 } = options;

  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: Math.max(limit * 20, VECTOR_CANDIDATE_LIMIT),
        limit: Math.max(limit + 5, 10),
      },
    },
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
        score: { $meta: 'vectorSearchScore' },
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
        embedding: 0,
      },
    },
  ];

  return Post.aggregate(pipeline);
}

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
    currentUserId = null,
  } = options;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    return [];
  }

  const posts = await Post.find({
    embedding: { $exists: true, $ne: [] },
    ...(excludePostId ? { _id: { $ne: excludePostId } } : {}),
  })
    .populate('userId', 'username email avatarUrl')
    .populate('commentsCount')
    .select('userId title content tldr tags type blogUrl createdAt likes likedBy shares embedding')
    .select('+embedding')
    .lean();

  const scoredPosts = posts
    .map((post) => ({
      ...post,
      score: cosineSimilarity(embedding, post.embedding || []),
    }))
    .filter((post) => Number.isFinite(post.score) && post.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return serializePosts(scoredPosts, currentUserId);
}

async function semanticSearch(query, options = {}) {
  const {
    limit = 3,
    excludePostId = null,
    currentUserId = null,
  } = options;

  const normalizedQuery = normalizeEmbeddingText(query, DEFAULT_EMBEDDING_INPUT_LIMIT);
  if (!normalizedQuery) {
    return [];
  }

  try {
    const embedding = await getEmbedding(normalizedQuery, {
      maxLength: DEFAULT_EMBEDDING_INPUT_LIMIT,
    });

    try {
      const vectorResults = await vectorSearchPosts(embedding, { limit });
      const filteredVectorResults = vectorResults
        .filter((post) => !excludePostId || post._id.toString() !== excludePostId.toString())
        .slice(0, limit);

      if (filteredVectorResults.length > 0) {
        return serializePosts(filteredVectorResults, currentUserId);
      }
    } catch (vectorError) {
      logger.warn('MongoDB vector search unavailable, falling back to manual similarity', {
        message: vectorError.message,
        index: VECTOR_INDEX_NAME,
      });
    }

    const semanticResults = await findSimilarPostsByEmbedding(embedding, {
      limit,
      excludePostId,
      currentUserId,
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
    .populate('userId', 'username email avatarUrl')
    .populate('commentsCount')
    .select('userId title content tldr tags type blogUrl createdAt likes likedBy shares')
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean()
    .then((posts) => serializePosts(posts, currentUserId));
}

module.exports = {
  cosineSimilarity,
  findSimilarPostsByEmbedding,
  semanticSearch,
  vectorSearchPosts,
};
