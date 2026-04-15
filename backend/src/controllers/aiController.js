const Post = require('../models/Post');
const ragService = require('../services/ragService');
const platformService = require('../services/platformService');
const logger = require('../utils/logger');

const safeAsync = async (fn, fallback = null, logMsg = '') => {
  try {
    return await fn();
  } catch (err) {
    if (logMsg) logger.warn(logMsg, { error: err.message });
    return fallback;
  }
};

const buildUrlContextForSummary = async (url, type = 'blog') => {
  const prompt = `You are preparing a concise knowledge context.

URL: ${url}
Type: ${type}

Generate 180-350 word neutral summary.`;

  const text = await safeAsync(
    () => ragService.llm.call(prompt),
    '',
    'URL context generation failed'
  );

  return text?.trim().length > 40
    ? text.trim()
    : `Source URL: ${url}\n\nReview source for accuracy.`;
};

const validateInputs = async (inputs) => {
  const result = [];

  for (const item of inputs) {
    let { content, url, type = 'blog', modality = 'text' } = item || {};

    if (url && !content) {
      content = await safeAsync(
        () => buildUrlContextForSummary(url, type),
        null
      );
    }

    if (!content || content.trim().length < 20) continue;

    result.push({ content, url: url || null, type, modality });
  }

  return result;
};


const summarize = async (req, res) => {
  try {
    let { content, url, type = 'blog' } = req.body;

    if (url && !content) {
      content = await buildUrlContextForSummary(url, type);
    }

    if (!content) {
      return res.status(400).json({ error: 'Content or URL required' });
    }

    const result = await ragService.generateSummary(content, url);

    res.json({
      summary: result.summary,
      tags: result.tags,
      provenance: result.provenance,
      fallback: result.fallback || false,
    });
  } catch (err) {
    logger.error('summarize error', { error: err.message });
    res.status(500).json({ error: 'Error generating summary' });
  }
};

const summarizeMultimodal = async (req, res) => {
  try {
    const { inputs = [], focus = '' } = req.body;

    if (!inputs.length) {
      return res.status(400).json({ error: 'At least one input required' });
    }

    const normalized = await validateInputs(inputs);

    if (!normalized.length) {
      return res.status(400).json({ error: 'No valid input content' });
    }

    const result = await safeAsync(
      () => ragService.generateMultiModalSummary(normalized, focus),
      null,
      'Multimodal RAG failed'
    );

    if (!result) {
      const combined = normalized.map(i => i.content).join(' ');
      const summary = combined.split(/[.!?]/).slice(0, 5).join('. ') + '.';

      return res.json({
        summary: summary + '\n\n*Fallback summary*',
        keyPoints: [],
        sources: normalized.map(i => i.url).filter(Boolean),
        modalities: normalized.map(i => i.modality),
        focus: focus || 'General',
        fallback: true,
      });
    }

    res.json({
      summary: result.summary,
      keyPoints: result.keyPoints || [],
      sources: result.sources || [],
      modalities: result.modalities || [],
      focus: focus || 'General',
      fallback: result.fallback || false,
    });
  } catch (err) {
    logger.error('summarizeMultimodal error', { error: err.message });
    res.status(500).json({ error: 'Error generating multimodal summary' });
  }
};

const queryAgent = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user?._id;

    const User = require('../models/User');
    const user = userId
      ? await User.findById(userId).select('interests')
      : null;

    const interests = user?.interests || [];

    let posts =
      (await safeAsync(() =>
        Post.find({ $text: { $search: query } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(5)
      )) ||
      (interests.length &&
        (await safeAsync(() =>
          Post.find({ tags: { $in: interests } }).limit(5)
        ))) ||
      (await safeAsync(async () => {
        const results = await ragService.semanticSearch(query, 5);
        const ids = results.map(r => r.metadata?.postId).filter(Boolean);
        return ids.length ? Post.find({ _id: { $in: ids } }) : [];
      })) ||
      (await Post.find().sort({ createdAt: -1 }).limit(5));

    const docs = posts.map(p => ({
      content: p.content || '',
      metadata: {
        title: p.title || 'Untitled',
        source: p.blogUrl || 'Internal',
      },
    }));

    const response = await safeAsync(
      () => ragService.generateRAGResponse(query, interests, docs),
      null
    );

    if (!response) {
      return res.json({
        query,
        answer: 'Service unavailable. Check sources.',
        citations: docs.slice(0, 3),
        confidence: 0,
        fallback: true,
      });
    }

    res.json({
      query,
      answer: response.answer,
      citations: response.citations || [],
      confidence: response.confidence || 0,
      fallback: response.fallback || false,
    });
  } catch (err) {
    logger.error('queryAgent error', { error: err.message });
    res.status(500).json({ error: 'Error generating response' });
  }
};

const getDeveloperBriefing = async (req, res) => {
  try {
    const topics = (req.query.topics || '').split(',').filter(Boolean);
    const refresh = req.query.refresh === 'true';
    const days = Number(req.query.days) || 3;

    const briefing = await safeAsync(
      () =>
        platformService.getDeveloperBriefing({
          topics,
          refreshTrends: refresh,
          days,
        }),
      {
        summary: 'Service unavailable',
        trends: [],
        highlights: [],
        resources: [],
        fallback: true,
      }
    );

    res.json(briefing);
  } catch (err) {
    logger.error('briefing error', { error: err.message });
    res.status(500).json({ error: 'Error generating briefing' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const User = require('../models/User');

    const user = await User.findById(userId).select('interests goals');

    const query = [...(user.interests || []), user.goals?.career || 'developer'].join(' ');

    let posts =
      (await safeAsync(async () => {
        const results = await ragService.semanticSearch(query, 10);
        const ids = results.map(r => r.metadata?.postId).filter(Boolean);
        return Post.find({ _id: { $in: ids } });
      })) ||
      (await Post.find({ tags: { $in: user.interests || [] } })) ||
      (await Post.find().sort({ likes: -1 }).limit(5));

    res.json({
      recommendations: posts.slice(0, 5),
      reason: 'Based on your interests',
    });
  } catch (err) {
    logger.error('recommendations error', { error: err.message });
    res.status(500).json({ error: 'Error generating recommendations' });
  }
};

module.exports = {
  summarize,
  summarizeMultimodal,
  queryAgent,
  getRecommendations,
  getDeveloperBriefing,
};