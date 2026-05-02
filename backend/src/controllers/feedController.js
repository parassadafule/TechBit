const User = require('../models/User');
const { getPersonalizedFeed } = require('../services/feedEngine');
const { serializePosts } = require('../utils/postResponse');
const logger = require('../utils/logger');

const getFeed = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 20);
    const type = req.query.type || null;
    const tags = req.query.tags
      ? req.query.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      : [];

    const user = await User.findById(req.user._id)
      .select('interests likedTags recentSearches')
      .lean();

    const rankedFeed = await getPersonalizedFeed(user || { interests: [] }, limit, {
      type,
      tags,
    });

    const serializedFeed = serializePosts(rankedFeed, req.user?._id);

    res.json({
      posts: serializedFeed,
      count: serializedFeed.length,
    });
  } catch (error) {
    logger.error('Error generating feed:', error);
    res.status(500).json({ error: 'Error fetching feed', details: error.message });
  }
};

module.exports = {
  getFeed,
};
