const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { emitNotification, emitPostCreated } = require('../socket/socketHandler');
const { serializePost, serializePosts } = require('../utils/postResponse');
const {
  createPost,
  createPostFromUrl,
  updatePost: updatePostService,
} = require('../services/postService');


const uploadPost = async (req, res) => {
  try {
    const { url, type } = req.body;
    const userId = req.user._id;

    if (!url || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: { url: 'string', type: 'blog|repo|video|podcast' },
      });
    }

    const post = await createPostFromUrl({ url, type, userId });
    logger.info('Post created from URL', { postId: post._id, userId });
    const notification = await Notification.create({
      userId,
      type: 'new_post',
      message: `Your post "${post.title}" was published successfully`,
      relatedId: post._id,
    });
    emitNotification(userId.toString(), notification);
    emitPostCreated(userId.toString(), post);
    res.status(201).json(post);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logger.error('Error uploading post from URL', {
      error: error.message,
      statusCode,
    });
    res.status(statusCode).json({
      error: error.message,
      details: error.details,
    });
  }
};


const createPostHandler = async (req, res) => {
  try {
    const { title, content, type, tags = [], sourceUrl = null } = req.body;
    const userId = req.user._id;

    const post = await createPost({
      title,
      content,
      type,
      userId,
      tags,
      sourceUrl,
    });

    logger.info('Post created manually', { postId: post._id, userId });
    const notification = await Notification.create({
      userId,
      type: 'new_post',
      message: `Your post "${post.title}" was published successfully`,
      relatedId: post._id,
    });
    emitNotification(userId.toString(), notification);
    emitPostCreated(userId.toString(), post);
    res.status(201).json(post);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logger.error('Error creating post', {
      error: error.message,
      statusCode,
    });
    res.status(statusCode).json({
      error: error.message,
    });
  }
};


const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const tags = req.query.tags ? req.query.tags.split(',') : null;
    const sort = req.query.sort || 'latest';

    const query = {};
    if (type) query.type = type;
    if (tags) query.tags = { $in: tags };

    logger.info(`Getting feed - page: ${page}, limit: ${limit}, type: ${type}, tags: ${tags}, sort: ${sort}`);

    const userId = req.user?._id;
    let posts;

    if (userId) {
      const user = await User.findById(userId).select('interests');

      if (user && user.interests.length > 0) {
        const pipeline = [
          { $match: query },
          {
            $addFields: {
              relevanceScore: {
                $size: {
                  $setIntersection: ['$tags', user.interests],
                },
              },
            },
          },
        ];

        if (sort === 'trending') {
          pipeline.push({
            $addFields: {
              trendingScore: { $add: ['$likes', '$shares'] },
            },
          });
          pipeline.push({ $sort: { trendingScore: -1, relevanceScore: -1, createdAt: -1 } });
        } else {
          pipeline.push({ $sort: { relevanceScore: -1, createdAt: -1 } });
        }

        pipeline.push(
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'author',
            },
          },
          { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              userId: '$author',
            },
          },
          {
            $project: {
              author: 0,
              embedding: 0,
              relevanceScore: 0,
              trendingScore: 0,
            },
          },
        );

        posts = await Post.aggregate(pipeline);
      } else {
        let sortOptions = { createdAt: -1 };
        if (sort === 'trending') {
          sortOptions = { likes: -1, shares: -1, createdAt: -1 };
        }
        posts = await Post.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username email avatarUrl')
          .populate('commentsCount')
          .select('-embedding');
      }
    } else {
      let sortOptions = { createdAt: -1 };
      if (sort === 'trending') {
        sortOptions = { likes: -1, shares: -1, createdAt: -1 };
      }
      posts = await Post.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email avatarUrl')
        .populate('commentsCount')
        .select('-embedding');
    }

    const total = await Post.countDocuments(query);

    logger.info(`Found ${posts.length} posts, total: ${total}`);

    const tagFacets = await Post.aggregate([
      { $match: query },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      posts: serializePosts(posts, req.user?._id),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      facets: {
        tags: tagFacets.map((f) => ({ tag: f._id, count: f.count })),
      },
    });
  } catch (error) {
    logger.error('Error getting feed:', error);
    res.status(500).json({ error: 'Error fetching feed', message: error.message });
  }
};


const getPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId)
      .populate('userId', 'username email avatarUrl')
      .populate('commentsCount')
      .select('-embedding');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.user) {
      const user = await User.findById(req.user._id);
      user.activityHistory.push({
        action: 'view',
        postId: post._id,
        timestamp: new Date(),
      });
      if (user.activityHistory.length > 100) {
        user.activityHistory = user.activityHistory.slice(-100);
      }
      await user.save();
    }

    res.json(serializePost(post, req.user?._id));
  } catch (error) {
    logger.error('Error getting post:', error);
    res.status(500).json({ error: 'Error fetching post' });
  }
};


const updatePostHandler = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await updatePostService(postId, userId, req.body);
    logger.info('Post updated', { postId, userId });
    res.json(post);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logger.error('Error updating post', {
      error: error.message,
      statusCode,
    });
    res.status(statusCode).json({
      error: error.message,
    });
  }
};


const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Post.findByIdAndDelete(postId);

    logger.info(`Post deleted: ${postId}`);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post' });
  }
};


const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).select('likes likedBy userId');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const alreadyLiked = post.likedBy.some(
      (likedUserId) => likedUserId.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(
        (likedUserId) => likedUserId.toString() !== userId.toString(),
      );
      post.likes = Math.max((post.likes || 0) - 1, 0);
    } else {
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    const user = await User.findById(userId);
    if (user && !alreadyLiked) {
      user.activityHistory.push({
        action: 'like',
        postId: post._id,
        timestamp: new Date(),
      });
      await user.save();
    }

    if (!alreadyLiked && post.userId.toString() !== userId.toString()) {
      const notification = await Notification.create({
        userId: post.userId,
        type: 'like',
        message: `${req.user.username} liked your post`,
        relatedId: post._id,
      });
      emitNotification(post.userId.toString(), notification);
    }

    res.json({
      likes: post.likes,
      likedByUser: !alreadyLiked,
    });
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(500).json({ error: 'Error liking post' });
  }
};


const sharePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = await User.findById(userId);
    user.activityHistory.push({
      action: 'share',
      postId: post._id,
      timestamp: new Date(),
    });
    await user.save();

    if (post.userId.toString() !== userId.toString()) {
      const notification = await Notification.create({
        userId: post.userId,
        type: 'share',
        message: `${req.user.username} shared your post`,
        relatedId: post._id,
      });
      emitNotification(post.userId.toString(), notification);
    }

    res.json({ shares: post.shares });
  } catch (error) {
    logger.error('Error sharing post:', error);
    res.status(500).json({ error: 'Error sharing post' });
  }
};

module.exports = {
  uploadPost,
  createPost: createPostHandler,
  getFeed,
  getPost,
  updatePost: updatePostHandler,
  deletePost,
  likePost,
  sharePost,
};
