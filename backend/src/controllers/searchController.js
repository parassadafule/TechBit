const Post = require('../models/Post');
const { semanticSearch } = require('../services/searchService');
const { serializePosts } = require('../utils/postResponse');
const logger = require('../utils/logger');

const normalizeSearchList = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const matchesSearchFilters = (post, { tags = [], type = ''} = {}) => {
  if (type && String(post.type || '').toLowerCase() !== type) {
    return false;
  }

  if (tags.length === 0) {
    return true;
  }

  const postTags = Array.isArray(post.tags)
    ? post.tags.map((tag) => String(tag).trim().toLowerCase())
    : [];

  return tags.every((tag) => postTags.includes(tag));
};

const keywordSearch = async (query, limit, currentUserId) => {
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    return [];
  }

  const posts = await Post.find({ $text: { $search: normalizedQuery } })
    .populate('userId', 'username email avatarUrl')
    .populate('commentsCount')
    .select('userId title content tldr tags type blogUrl createdAt likes likedBy')
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

  return serializePosts(posts, currentUserId);
};


const searchPosts = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const tags = normalizeSearchList(req.query.tags);
    const type = String(req.query.type || '').trim().toLowerCase();
    const semantic = req.query.semantic === true || req.query.semantic === 'true';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    if (!query && tags.length === 0 && !type) {
      return res.json({
        results: [],
        count: 0,
      });
    }

    let results = [];

    if (query) {
      results = semantic
        ? await semanticSearch(query, {
          limit: Math.max(limit * 5, 50),
          currentUserId: req.user?._id,
        })
        : await keywordSearch(query, Math.max(limit * 5, 50), req.user?._id);

      results = results.filter((post) => matchesSearchFilters(post, { tags, type }));
    } else {
      const filter = {};

      if (type) {
        filter.type = type;
      }

      if (tags.length > 0) {
        filter.tags = { $all: tags };
      }

      const posts = await Post.find(filter)
        .populate('userId', 'username email avatarUrl')
        .populate('commentsCount')
        .select('-embedding')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      results = serializePosts(posts, req.user?._id);
    }

    const limitedResults = results.slice(0, limit);

    res.json({
      results: limitedResults,
      count: limitedResults.length,
    });
  } catch (error) {
    logger.error('Error searching posts:', error);
    res.status(500).json({ error: 'Error searching posts', details: error.message });
  }
};


const filterByTags = async (req, res) => {
  try {
    const tags = req.query.tags ? req.query.tags.split(',').map((t) => t.trim()) : [];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (tags.length === 0) {
      return res.status(400).json({ error: 'At least one tag required' });
    }

    const posts = await Post.find({ tags: { $all: tags } })
      .populate('userId', 'username email avatarUrl')
      .populate('commentsCount')
      .select('-embedding')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ tags: { $all: tags } });

    res.json({
      posts: serializePosts(posts, req.user?._id),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error filtering by tags:', error);
    res.status(500).json({ error: 'Error filtering posts' });
  }
};


const getRelatedPosts = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).select('title tags content');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const relatedPosts = await semanticSearch(`${post.title || ''}\n\n${post.content || ''}`, {
      limit: 5,
      excludePostId: postId,
      currentUserId: req.user?._id,
    });

    res.json({ relatedPosts });
  } catch (error) {
    logger.error('Error getting related posts:', error);
    res.status(500).json({ error: 'Error getting related posts' });
  }
};

module.exports = {
  searchPosts,
  filterByTags,
  getRelatedPosts,
};
