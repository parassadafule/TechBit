const LearningPath = require('../models/LearningPath');
const Post = require('../models/Post');
const User = require('../models/User');
const ragService = require('../services/ragService');
const logger = require('../utils/logger');


const getLearningPath = async (req, res) => {
  try {
    const userId = req.user._id;

    let learningPath = await LearningPath.findOne({ userId })
      .sort({ generatedAt: -1 })
      .populate('items.postId', 'title type tags blogUrl');

    if (!learningPath) {
      learningPath = await generateNewPath(userId);
    }

    res.json(formatLearningPathForClient(learningPath));
  } catch (error) {
    logger.error('Error getting learning path:', error);
    res.status(500).json({ error: 'Error fetching learning path' });
  }
};


const regenerateLearningPath = async (req, res) => {
  try {
    const userId = req.user._id;
    const options = req.body || {};

    const learningPath = await generateNewPath(userId, options);

    res.json(formatLearningPathForClient(learningPath));
  } catch (error) {
    logger.error('Error regenerating learning path:', error);
    res.status(500).json({ error: 'Error regenerating learning path' });
  }
};


const completePathItem = async (req, res) => {
  try {
    const { pathId, step } = req.params;
    const userId = req.user._id;

    const learningPath = await LearningPath.findOne({ _id: pathId, userId });
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const item = learningPath.items.find((i) => i.step === parseInt(step));
    if (!item) {
      return res.status(404).json({ error: 'Path item not found' });
    }

    item.completed = true;
    await learningPath.save();

    const user = await User.findById(userId);
    user.activityHistory.push({
      action: 'complete',
      postId: item.postId,
      timestamp: new Date(),
    });
    await user.save();

    res.json({
      message: 'Item marked as complete',
      progress: learningPath.progress,
      item,
      path: formatLearningPathForClient(learningPath).path,
    });
  } catch (error) {
    logger.error('Error completing path item:', error);
    res.status(500).json({ error: 'Error updating learning path' });
  }
};


async function generateNewPath(userId, options = {}) {
  const user = await User.findById(userId).select('interests goals activityHistory');
  if (!user) {
    throw new Error('User not found');
  }

  const effectiveGoals = {
    skillLevel: options.skillLevel || user.goals?.skillLevel || 'intermediate',
    career: options.career || user.goals?.career || 'full-stack-developer',
  };

  const activitySummary = (user.activityHistory || [])
    .slice(-10)
    .map((item) => item.action)
    .join(' ');

  const profileText = [
    user.interests.join(' '),
    effectiveGoals.career,
    effectiveGoals.skillLevel,
    options.targetRole || '',
    options.timePerWeek || '',
    activitySummary,
  ]
    .filter(Boolean)
    .join(' ');

  let vectorResults = [];
  try {
    vectorResults = await ragService.semanticSearch(profileText, 10);
  } catch (error) {
    logger.warn('Semantic search unavailable for learning path generation, using DB fallback', {
      message: error.message,
    });
  }

  const postIds = vectorResults
    .map((r) => r.metadata?.postId)
    .filter(Boolean);

  let posts = await Post.find({ _id: { $in: postIds } })
    .select('title type tags');

  if (posts.length === 0) {
    posts = await Post.find({
      tags: { $in: user.interests || [] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title type tags');
  }

  if (posts.length === 0) {
    posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title type tags');
  }

  if (posts.length === 0) {
    throw new Error('No suitable posts found for learning path');
  }

  const steps = await ragService.generateLearningPath(
    {
      ...user.toObject(),
      goals: effectiveGoals,
      options,
    },
    posts
  );

  const learningPath = await LearningPath.create({
    userId,
    goals: {
      ...effectiveGoals,
      targetRole: options.targetRole || null,
      timePerWeek: options.timePerWeek || null,
    },
    items: steps,
    generatedAt: new Date(),
  });

  await learningPath.populate('items.postId', 'title type tags blogUrl');

  logger.info(`Learning path generated for user ${userId}`);

  return learningPath;
}

function formatLearningPathForClient(learningPath) {
  const items = learningPath?.items || [];

  const steps = items.map((item) => ({
    step: item.step,
    title: item.postId?.title || `Step ${item.step}`,
    description: item.reason || 'Recommended based on your profile and recent activity.',
    reason: item.reason || 'Recommended based on your profile and recent activity.',
    type: item.type || item.postId?.type || 'blog',
    relatedPosts: item.postId
      ? [{
          _id: item.postId._id,
          title: item.postId.title,
          type: item.postId.type,
          tags: item.postId.tags || [],
          blogUrl: item.postId.blogUrl || null,
        }]
      : [],
  }));

  const completedSteps = items
    .filter((item) => item.completed)
    .map((item) => item.step);

  return {
    path: {
      _id: learningPath._id,
      goals: learningPath.goals,
      steps,
      completedSteps,
      progress: learningPath.progress,
      generatedAt: learningPath.generatedAt,
      updatedAt: learningPath.updatedAt,
      insights: {
        totalSteps: steps.length,
        completed: completedSteps.length,
        sourceDiversity: [...new Set(steps.map((step) => step.type))],
      },
    },
  };
}

module.exports = {
  getLearningPath,
  regenerateLearningPath,
  completePathItem,
};
