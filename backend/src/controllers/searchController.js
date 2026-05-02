const Post = require('../models/Post');
const { semanticSearch } = require('../services/searchService');
const { serializePosts } = require('../utils/postResponse');
const logger = require('../utils/logger');


const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    const results = await semanticSearch(q, {
      limit: 3,
      currentUserId: req.user?._id,
    });

    res.json({
      results,
      count: results.length,
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
