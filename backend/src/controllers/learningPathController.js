const LearningPath = require('../models/LearningPath');
const ragService = require('../services/ragService');
const { vectorSearchPosts } = require('../services/searchService');
const logger = require('../utils/logger');

const PATH_LIMIT = 10;

function normalizeGoal(goal = '') {
  return String(goal || '').trim().slice(0, 200);
}

function computeCurrentStep(steps = []) {
  const nextPendingStep = steps.find((step) => step.status === 'pending');
  return nextPendingStep ? nextPendingStep.order : steps.length + 1;
}

async function createLearningPath(req, res) {
  try {
    const userId = req.user._id;
    const goal = normalizeGoal(req.body.goal);

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const goalEmbedding = await ragService.embed(goal);
    const vectorResults = await vectorSearchPosts(goalEmbedding, { limit: PATH_LIMIT });
    const orderedPosts = vectorResults
      .filter((post) => post?._id)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
      .slice(0, PATH_LIMIT);

    if (orderedPosts.length === 0) {
      return res.status(404).json({ error: 'No relevant posts found for this goal' });
    }

    await LearningPath.deleteMany({ userId });

    const learningPath = await LearningPath.create({
      userId,
      goal,
      steps: orderedPosts.map((post, index) => ({
        postId: post._id,
        order: index + 1,
        status: 'pending',
      })),
      currentStep: 1,
    });

    const populatedPath = await LearningPath.findById(learningPath._id)
      .populate('steps.postId', 'title tldr type tags blogUrl');

    res.status(201).json(populatedPath);
  } catch (error) {
    logger.error('Error creating learning path:', error);
    res.status(500).json({ error: 'Error creating learning path' });
  }
}

async function getLearningPath(req, res) {
  try {
    const learningPath = await LearningPath.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('steps.postId', 'title tldr type tags blogUrl');

    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    return res.json(learningPath);
  } catch (error) {
    logger.error('Error fetching learning path:', error);
    return res.status(500).json({ error: 'Error fetching learning path' });
  }
}

async function completeLearningPathStep(req, res) {
  try {
    const learningPath = await LearningPath.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('steps.postId', 'title tldr type tags blogUrl');

    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const currentStep = learningPath.steps.find((step) => step.order === learningPath.currentStep);

    if (!currentStep) {
      return res.status(400).json({ error: 'No pending step available to complete' });
    }

    currentStep.status = 'completed';
    learningPath.currentStep = computeCurrentStep(learningPath.steps);
    await learningPath.save();
    await learningPath.populate('steps.postId', 'title tldr type tags blogUrl');

    return res.json(learningPath);
  } catch (error) {
    logger.error('Error completing learning path step:', error);
    return res.status(500).json({ error: 'Error completing learning path step' });
  }
}

async function updateLearningPathFeedback(req, res) {
  try {
    const { postId, helpful } = req.body;
    const learningPath = await LearningPath.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('steps.postId', 'title tldr type tags blogUrl');

    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'helpful must be true or false' });
    }

    const step = learningPath.steps.find((entry) => entry.postId?._id?.toString() === postId.toString());
    if (!step) {
      return res.status(404).json({ error: 'Step not found for the provided postId' });
    }

    step.helpful = helpful;
    await learningPath.save();
    await learningPath.populate('steps.postId', 'title tldr type tags blogUrl');

    return res.json(learningPath);
  } catch (error) {
    logger.error('Error updating learning path feedback:', error);
    return res.status(500).json({ error: 'Error updating learning path feedback' });
  }
}

module.exports = {
  createLearningPath,
  getLearningPath,
  completeLearningPathStep,
  updateLearningPathFeedback,
};
