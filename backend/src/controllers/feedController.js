const Post = require('../models/Post');
const User = require('../models/User');
const { generateFeed } = require('../services/feedEngine');
const logger = require('../utils/logger');

const getFeed = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 20);
    const type = req.query.type || null;
    const tags = req.query.tags
      ? req.query.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      : [];

    const user = await User.findById(req.user._id)
      .select('interests')
      .lean();

    const matchStage = {
      ...(type ? { type } : {}),
      ...(tags.length > 0 ? { tags: { $in: tags } } : {}),
    };

    const posts = await Post.aggregate([
      { $match: matchStage },
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
          isTrending: {
            $ifNull: ['$isTrending', false],
          },
        },
      },
      {
        $project: {
          comments: 0,
          embedding: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 200 },
    ]);

    const rankedFeed = generateFeed(posts, user || { interests: [] }, limit);

    res.json({
      posts: rankedFeed,
      count: rankedFeed.length,
    });
  } catch (error) {
    logger.error('Error generating feed:', error);
    res.status(500).json({ error: 'Error fetching feed', details: error.message });
  }
};

module.exports = {
  getFeed,
};
