const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { emitNotification, emitNewComment } = require('../socket/socketHandler');
const logger = require('../utils/logger');

const getComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ postId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ postId });

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error getting comments:', error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
};

const createComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      postId,
      userId,
      text,
    });

    await comment.populate('userId', 'username email');

    if (post.userId.toString() !== userId.toString()) {
      const notification = await Notification.create({
        userId: post.userId,
        type: 'comment',
        message: `${req.user.username} commented on your post`,
        relatedId: post._id,
      });

      emitNotification(post.userId.toString(), notification);
    }

    emitNewComment(postId, comment);

    logger.info(`Comment created on post ${postId} by user ${userId}`);

    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ error: 'Error creating comment' });
  }
};


const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    comment.text = text;
    await comment.save();

    await comment.populate('userId', 'username email');

    res.json(comment);
  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({ error: 'Error updating comment' });
  }
};


const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Comment.findByIdAndDelete(commentId);

    logger.info(`Comment deleted: ${commentId}`);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Error deleting comment' });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
