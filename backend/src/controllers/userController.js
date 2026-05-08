const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { serializePosts } = require('../utils/postResponse');
const { emitNotification } = require('../socket/socketHandler');
const logger = require('../utils/logger');


const getProfile = async (req, res) => {
  try {
    const identifier = req.params.id || req.user._id;

    if (!identifier || identifier === 'undefined') {
      return res.status(400).json({ error: 'User ID required' });
    }

    const identifierStr = String(identifier);
    const isObjectId = mongoose.Types.ObjectId.isValid(identifierStr);
    const user = isObjectId
      ? await User.findById(identifierStr).select('-__v')
      : await User.findOne({ username: identifierStr }).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user._id;
    const contributionsCount = await Post.countDocuments({ userId: userId });

    const recentPosts = await Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type tags createdAt');

    const followersCount = Array.isArray(user.followers) ? user.followers.length : 0;
    const followingCount = Array.isArray(user.following) ? user.following.length : 0;
    const currentUserId = req.user?._id?.toString?.();
    const isFollowing = currentUserId
      ? (user.followers || []).some((followerId) => followerId.toString() === currentUserId)
      : false;
    const isFollowedBy = currentUserId
      ? (user.following || []).some((followingId) => followingId.toString() === currentUserId)
      : false;

    res.json({
      ...user.toObject(),
      contributionsCount,
      recentPosts,
      followersCount,
      followingCount,
      isFollowing,
      isFollowedBy,
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

    const currentUser = await User.findById(userId).select('interests following');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const excludedUserIds = [userId, ...(currentUser.following || [])];

    let suggestedUsers;

    if (currentUser.interests && currentUser.interests.length > 0) {
      suggestedUsers = await User.aggregate([
        {
          $match: {
            _id: { $nin: excludedUserIds },
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
            _id: { $nin: excludedUserIds },
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

const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadyFollowing = (currentUser.following || []).some(
      (followedUserId) => followedUserId.toString() === targetUserId.toString(),
    );

    if (!alreadyFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: currentUser._id },
          { $addToSet: { following: targetUser._id } },
        ),
        User.updateOne(
          { _id: targetUser._id },
          { $addToSet: { followers: currentUser._id } },
        ),
      ]);

      const notification = await Notification.create({
        userId: targetUser._id,
        type: 'follow',
        message: `${req.user.username} started following you`,
        relatedId: currentUser._id,
      });

      emitNotification(targetUser._id.toString(), notification);
    }

    const [updatedCurrentUser, updatedTargetUser] = await Promise.all([
      User.findById(currentUser._id).select('following'),
      User.findById(targetUser._id).select('followers'),
    ]);

    return res.json({
      success: true,
      isFollowing: true,
      followersCount: updatedTargetUser?.followers?.length || 0,
      followingCount: updatedCurrentUser?.following?.length || 0,
    });
  } catch (error) {
    logger.error('Error following user:', error);
    return res.status(500).json({ error: 'Error following user' });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Promise.all([
      User.updateOne(
        { _id: currentUser._id },
        { $pull: { following: targetUser._id } },
      ),
      User.updateOne(
        { _id: targetUser._id },
        { $pull: { followers: currentUser._id } },
      ),
    ]);

    const [updatedCurrentUser, updatedTargetUser] = await Promise.all([
      User.findById(currentUser._id).select('following'),
      User.findById(targetUser._id).select('followers'),
    ]);

    return res.json({
      success: true,
      isFollowing: false,
      followersCount: updatedTargetUser?.followers?.length || 0,
      followingCount: updatedCurrentUser?.following?.length || 0,
    });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Error unfollowing user' });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('followers');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followerIds = Array.isArray(user.followers) ? user.followers : [];
    const total = followerIds.length;
    const pageIds = followerIds.slice(skip, skip + limit);
    const users = await User.find({ _id: { $in: pageIds } })
      .select('name username avatarUrl')
      .sort({ username: 1 });

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting followers:', error);
    return res.status(500).json({ error: 'Error fetching followers' });
  }
};

const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('following');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followingIds = Array.isArray(user.following) ? user.following : [];
    const total = followingIds.length;
    const pageIds = followingIds.slice(skip, skip + limit);
    const users = await User.find({ _id: { $in: pageIds } })
      .select('name username avatarUrl')
      .sort({ username: 1 });

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting following:', error);
    return res.status(500).json({ error: 'Error fetching following' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserPosts,
  getActivityHistory,
  addActivity,
  getSuggestedUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
