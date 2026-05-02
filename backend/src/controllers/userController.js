const User = require('../models/User');
const Post = require('../models/Post');
const { serializePosts } = require('../utils/postResponse');
const logger = require('../utils/logger');


const getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const contributionsCount = await Post.countDocuments({ userId });

    const recentPosts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type tags createdAt');

    res.json({
      ...user.toObject(),
      contributionsCount,
      recentPosts,
    });
  } catch (error) {
    logger.error('Error getting profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};


const updateProfile = async (req, res) => {
  try {
    const {
      name,
      username,
      interests,
      goals,
      bio,
      location,
      website,
    } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name !== undefined) updateData.name = String(name || '').trim();
    if (username !== undefined) updateData.username = String(username || '').trim();
    if (interests) {
      updateData.interests = Array.from(new Set(
        interests
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )).slice(0, 20);
    }

    if (goals) updateData.goals = { ...req.user.goals, ...goals };
    if (bio !== undefined) updateData.bio = String(bio || '').trim();
    if (location !== undefined) updateData.location = String(location || '').trim();
    if (website !== undefined) updateData.website = String(website || '').trim();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (name !== undefined || username !== undefined || interests || goals || bio !== undefined || location !== undefined || website !== undefined) {
      logger.info(`Profile updated for user ${user.email}, learning path regeneration needed`);
    }

    res.json(user);
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};


const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email avatarUrl')
        .populate('commentsCount')
        .select('-embedding'),
      Post.countDocuments({ userId }),
    ]);

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
    logger.error('Error getting user posts:', error);
    res.status(500).json({ error: 'Error fetching user posts' });
  }
};


const getActivityHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('activityHistory');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activities = user.activityHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);

    const postIds = activities.map((a) => a.postId).filter(Boolean);
    const posts = await Post.find({ _id: { $in: postIds } }).select('title type tags');

    const postsMap = {};
    posts.forEach((post) => {
      postsMap[post._id.toString()] = post;
    });

    const enrichedActivities = activities.map((activity) => ({
      ...activity.toObject(),
      post: activity.postId ? postsMap[activity.postId.toString()] : null,
    }));

    res.json({
      activities: enrichedActivities,
      total: user.activityHistory.length,
      page,
      limit,
    });
  } catch (error) {
    logger.error('Error getting activity history:', error);
    res.status(500).json({ error: 'Error fetching activity history' });
  }
};


const addActivity = async (req, res) => {
  try {
    const { action, postId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.activityHistory.push({
      action,
      postId,
      timestamp: new Date(),
    });

    if (user.activityHistory.length > 100) {
      user.activityHistory = user.activityHistory.slice(-100);
    }

    await user.save();

    res.json({ message: 'Activity recorded', activity: user.activityHistory[user.activityHistory.length - 1] });
  } catch (error) {
    logger.error('Error adding activity:', error);
    res.status(500).json({ error: 'Error recording activity' });
  }
};


const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const currentUser = await User.findById(userId).select('interests');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let suggestedUsers;

    if (currentUser.interests && currentUser.interests.length > 0) {
      suggestedUsers = await User.aggregate([
        {
          $match: {
            _id: { $ne: userId },
          },
        },
        {
          $addFields: {
            commonInterests: {
              $size: {
                $setIntersection: ['$interests', currentUser.interests],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'posts',
          },
        },
        {
          $addFields: {
            contributionsCount: { $size: '$posts' },
          },
        },
        {
          $sort: { commonInterests: -1, contributionsCount: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            username: 1,
            email: 1,
            interests: 1,
            goals: 1,
            contributionsCount: 1,
            commonInterests: 1,
          },
        },
      ]);
    } else {
      suggestedUsers = await User.aggregate([
        {
          $match: {
            _id: { $ne: userId },
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'posts',
          },
        },
        {
          $addFields: {
            contributionsCount: { $size: '$posts' },
          },
        },
        {
          $sort: { contributionsCount: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            username: 1,
            email: 1,
            interests: 1,
            goals: 1,
            contributionsCount: 1,
          },
        },
      ]);
    }

    res.json({ suggestedUsers });
  } catch (error) {
    logger.error('Error getting suggested users:', error);
    res.status(500).json({ error: 'Error fetching suggested users' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserPosts,
  getActivityHistory,
  addActivity,
  getSuggestedUsers,
};
