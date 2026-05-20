const LearningPath = require('../models/LearningPath');
const User = require('../models/User');
const ragService = require('../services/ragService');
const { vectorSearchPosts } = require('../services/searchService');
const logger = require('../utils/logger');

const PATH_LIMIT = 10;
const MIN_DURATION_WEEKS = 1;
const MAX_DURATION_WEEKS = 52;

function normalizeGoal(goal = '') {
  return String(goal || '').trim().slice(0, 200);
}

function normalizeInterests(interests = []) {
  if (!Array.isArray(interests)) {
    return [];
  }

  return interests
    .map((interest) => String(interest || '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeDurationWeeks(durationWeeks) {
  const parsed = Number(durationWeeks);
  if (!Number.isFinite(parsed)) {
    return 4;
  }

  return Math.min(MAX_DURATION_WEEKS, Math.max(MIN_DURATION_WEEKS, Math.round(parsed)));
}

function extractJsonObject(text = '') {
  const raw = String(text || '').trim();
  if (!raw) {
    return null;
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function normalizeGeneratedPath(candidate, goal, durationWeeks) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const milestones = Array.isArray(candidate.milestones) ? candidate.milestones : [];
  const normalizedMilestones = milestones
    .map((milestone, milestoneIndex) => {
      const tasks = Array.isArray(milestone.tasks) ? milestone.tasks : [];
      const normalizedTasks = tasks
        .map((task, taskIndex) => ({
          id: String(task.id || `${milestoneIndex + 1}-${taskIndex + 1}`),
          title: String(task.title || '').trim().slice(0, 120),
          description: String(task.description || '').trim().slice(0, 300),
          estimatedHours: Math.max(1, Math.min(40, Number(task.estimatedHours) || 1)),
          resourceQuery: String(task.resourceQuery || task.resource || '').trim().slice(0, 160),
          deliverable: String(task.deliverable || '').trim().slice(0, 220),
        }))
        .filter((task) => task.title);

      return {
        id: String(milestone.id || `week-${milestoneIndex + 1}`),
        week: Math.max(1, Math.min(durationWeeks, Number(milestone.week) || milestoneIndex + 1)),
        title: String(milestone.title || `Week ${milestoneIndex + 1}`).trim().slice(0, 120),
        objective: String(milestone.objective || '').trim().slice(0, 260),
        tasks: normalizedTasks,
      };
    })
    .filter((milestone) => milestone.tasks.length > 0);

  if (normalizedMilestones.length === 0) {
    return null;
  }

  const totalHours = normalizedMilestones.reduce(
    (sum, milestone) => sum + milestone.tasks.reduce((taskSum, task) => taskSum + task.estimatedHours, 0),
    0,
  );

  return {
    id: `${slugify(goal) || 'learning-path'}-${Date.now()}`,
    title: String(candidate.title || `${goal} Learning Path`).trim().slice(0, 140),
    topic: goal,
    level: String(candidate.level || 'beginner-to-intermediate').trim().slice(0, 80),
    durationWeeks,
    totalHours: Number(candidate.totalHours) || totalHours,
    assumptions: Array.isArray(candidate.assumptions)
      ? candidate.assumptions.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
      : [],
    milestones: normalizedMilestones,
    createdAt: new Date().toISOString(),
  };
}

function buildLearningPathPrompt({ goal, durationWeeks, interests }) {
  return `You are generating a personalized developer learning path for TechBit.

Return ONLY valid JSON. Do not use markdown, code fences, comments, prose, trailing commas, or extra keys.

User selected topic:
${goal}

Requested duration:
${durationWeeks} week${durationWeeks === 1 ? '' : 's'}

User interests to personalize examples and project choices:
${interests.length ? interests.join(', ') : 'No saved interests provided'}

Edge-case rules:
- If the topic is broad, split it into realistic fundamentals, practice, and a small capstone.
- If the topic is narrow, keep the path focused and avoid unrelated filler.
- If the topic includes multiple technologies, order prerequisites before integrations.
- If the topic is ambiguous, choose the most common software-development interpretation and add one assumption.
- If duration is short, reduce scope instead of overloading the user.
- If duration is long, add depth, projects, review, and spaced practice.
- Do not invent exact URLs. Use resourceQuery strings the app can search later.
- Avoid unsafe, illegal, credential-stealing, malware, or privacy-invasive tasks. For security topics, keep activities defensive and lab-only.
- Every task must be learnable, checkable, and phrased as an action.
- Use concise language. No task title may exceed 12 words.
- estimatedHours must be an integer from 1 to 12.
- Create 1 milestone per week. Each milestone must contain 3 to 5 tasks.
- The total workload should be realistic: 4 to 8 hours per week unless the topic genuinely needs less.

Required JSON shape:
{
  "title": "string",
  "level": "beginner | intermediate | advanced | beginner-to-intermediate | intermediate-to-advanced",
  "durationWeeks": ${durationWeeks},
  "totalHours": 0,
  "assumptions": ["string"],
  "milestones": [
    {
      "id": "week-1",
      "week": 1,
      "title": "string",
      "objective": "string",
      "tasks": [
        {
          "id": "1-1",
          "title": "string",
          "description": "string",
          "estimatedHours": 1,
          "resourceQuery": "string",
          "deliverable": "string"
        }
      ]
    }
  ]
}`;
}

function computeCurrentStep(steps = []) {
  const nextPendingStep = steps.find((step) => step.status === 'pending');
  return nextPendingStep ? nextPendingStep.order : steps.length + 1;
}

function serializeLearningPath(path) {
  if (!path) {
    return null;
  }

  const source = typeof path.toObject === 'function' ? path.toObject() : path;
  const completedTasks = normalizeCompletedTaskMap(source.completedTasks);

  return {
    ...source,
    id: source.clientId || source.id || source._id?.toString(),
    completedTasks,
  };
}

function normalizeCompletedTaskMap(value) {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (typeof value.toObject === 'function') {
    return value.toObject();
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }

  return {};
}

function countGeneratedTasks(path) {
  return (path.milestones || []).reduce(
    (sum, milestone) => sum + (Array.isArray(milestone.tasks) ? milestone.tasks.length : 0),
    0,
  );
}

function isGeneratedPathComplete(path, completedTasks = {}) {
  const total = countGeneratedTasks(path);
  if (!total) {
    return false;
  }

  const completed = (path.milestones || []).reduce((sum, milestone) => {
    const milestoneTasks = Array.isArray(milestone.tasks) ? milestone.tasks : [];
    return sum + milestoneTasks.filter((task) => completedTasks[`${milestone.id}:${task.id}`]).length;
  }, 0);

  return completed >= total;
}

async function finishLearningPathIfComplete(learningPath, completedTasks) {
  if (!isGeneratedPathComplete(learningPath, completedTasks)) {
    return null;
  }

  if (!learningPath.completedAt) {
    learningPath.completedAt = new Date();
  }

  const topic = normalizeGoal(learningPath.topic || learningPath.goal);
  if (!topic) {
    await learningPath.save();
    return null;
  }

  await learningPath.save();

  return User.findByIdAndUpdate(
    learningPath.userId,
    {
      $addToSet: { interests: topic },
      $pull: { currentlyLearning: topic },
    },
    { new: true, runValidators: true },
  );
}

async function createLearningPath(req, res) {
  try {
    const userId = req.user._id;
    const generatedPath = req.body.path && typeof req.body.path === 'object'
      ? normalizeGeneratedPath(req.body.path, req.body.path.topic || req.body.goal, req.body.path.durationWeeks || req.body.durationWeeks)
      : null;

    if (generatedPath) {
      const learningPath = await LearningPath.findOneAndUpdate(
        {
          userId,
          clientId: generatedPath.id,
        },
        {
          $set: {
            goal: generatedPath.topic,
            clientId: generatedPath.id,
            title: generatedPath.title,
            topic: generatedPath.topic,
            level: generatedPath.level,
            durationWeeks: generatedPath.durationWeeks,
            totalHours: generatedPath.totalHours,
            assumptions: generatedPath.assumptions,
            milestones: generatedPath.milestones,
            completedTasks: req.body.path.completedTasks || {},
            approvedAt: req.body.path.approvedAt || new Date(),
            completedAt: null,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      );

      const topic = normalizeGoal(generatedPath.topic);
      if (topic) {
        await User.updateOne({ _id: userId }, { $addToSet: { currentlyLearning: topic } });
      }

      return res.status(201).json(serializeLearningPath(learningPath));
    }

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

async function generateLearningPathDraft(req, res) {
  try {
    const goal = normalizeGoal(req.body.goal);
    const durationWeeks = normalizeDurationWeeks(req.body.durationWeeks);
    const requestInterests = normalizeInterests(req.body.interests);

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const interests = requestInterests.length
      ? requestInterests
      : normalizeInterests(req.user?.interests || []);

    const prompt = buildLearningPathPrompt({ goal, durationWeeks, interests });
    const aiResponse = await ragService.generate(prompt);
    const parsed = extractJsonObject(aiResponse);
    const path = normalizeGeneratedPath(parsed, goal, durationWeeks);

    if (!path) {
      return res.status(502).json({
        error: 'AI did not return a valid learning path. Please try a more specific topic.',
      });
    }

    return res.json({
      path,
      prompt,
    });
  } catch (error) {
    logger.error('Error generating learning path draft:', error);
    return res.status(500).json({ error: 'Error generating learning path draft' });
  }
}

async function getLearningPath(req, res) {
  try {
    const learningPaths = await LearningPath.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('steps.postId', 'title tldr type tags blogUrl');

    if (!learningPaths.length) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    return res.json({ paths: learningPaths.map(serializeLearningPath) });
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

    if (learningPath.milestones?.length) {
      const completedTasks = req.body.completedTasks && typeof req.body.completedTasks === 'object'
        ? Object.fromEntries(
          Object.entries(req.body.completedTasks).map(([key, value]) => [key, Boolean(value)]),
        )
        : normalizeCompletedTaskMap(learningPath.completedTasks);

      if (req.body.taskKey) {
        completedTasks[req.body.taskKey] = Boolean(req.body.completed);
      }

      learningPath.completedTasks = completedTasks;
      const updatedUser = await finishLearningPathIfComplete(learningPath, completedTasks);

      if (!updatedUser) {
        await learningPath.save();
      }

      return res.json({
        path: serializeLearningPath(learningPath),
        user: updatedUser || undefined,
      });
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

async function deleteLearningPath(req, res) {
  try {
    const learningPath = await LearningPath.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const topic = normalizeGoal(learningPath.topic || learningPath.goal);
    if (topic && !learningPath.completedAt) {
      await User.updateOne({ _id: req.user._id }, { $pull: { currentlyLearning: topic } });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting learning path:', error);
    return res.status(500).json({ error: 'Error deleting learning path' });
  }
}

module.exports = {
  generateLearningPathDraft,
  createLearningPath,
  getLearningPath,
  completeLearningPathStep,
  updateLearningPathFeedback,
  deleteLearningPath,
};
