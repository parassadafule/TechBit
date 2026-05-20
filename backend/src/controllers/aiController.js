const Post = require('../models/Post');
const ragService = require('../services/ragService');
const platformService = require('../services/platformService');
const { semanticSearch } = require('../services/searchService');
const crypto = require('crypto');
const {
  conversations,
  ensureConversation,
  getChatHistory,
  saveChatHistory,
} = require('../services/chatMemory');
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

const toChunkDoc = (chunk) => ({
  content: chunk.content || chunk.pageContent || '',
  metadata: {
    postId: chunk.metadata?.postId || null,
    title: chunk.metadata?.title || 'Untitled',
    source: chunk.metadata?.url || chunk.sourceUrl || 'Internal',
    url: chunk.metadata?.url || chunk.sourceUrl || null,
    tags: chunk.metadata?.tags || [],
    type: chunk.metadata?.type || null,
  },
});

const toPostDoc = (post) => ({
  content: post.content || post.tldr || '',
  metadata: {
    postId: post._id?.toString?.() || post._id || null,
    title: post.title || 'Untitled',
    source: post.blogUrl || 'Internal',
    url: post.blogUrl || null,
    tags: post.tags || [],
    type: post.type || null,
  },
});

const mergeUniqueDocs = (...groups) => {
  const merged = [];
  const seen = new Set();

  groups.flat().filter(Boolean).forEach((doc) => {
    const key = [
      doc.metadata?.postId || '',
      doc.metadata?.url || '',
      doc.metadata?.title || '',
      (doc.content || '').slice(0, 120),
    ].join('|');

    if (!key.trim() || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(doc);
  });

  return merged;
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
    const message = String(req.body?.message || req.body?.query || '').trim();
    let conversationId = String(req.body?.conversationId || '').trim();
    const userId = req.user?._id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    conversationId = ensureConversation(conversationId) || crypto.randomUUID();
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }

    const existingHistory = getChatHistory(conversationId);

    const User = require('../models/User');
    const user = userId
      ? await User.findById(userId).select('interests')
      : null;

    const interests = user?.interests || [];

    const [
      chunkResults,
      postResults,
      interestPosts,
      recentPosts,
    ] = await Promise.all([
      safeAsync(() => ragService.semanticSearch(message, 5), [], 'Chunk semantic search failed'),
      safeAsync(() => semanticSearch(message, { limit: 5 }), [], 'Post semantic search failed'),
      interests.length
        ? safeAsync(
          () => Post.find({ tags: { $in: interests } })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
          [],
          'Interest-based fallback search failed'
        )
        : Promise.resolve([]),
      safeAsync(
        () => Post.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        [],
        'Recent post fallback search failed'
      ),
    ]);

    const docs = mergeUniqueDocs(
      chunkResults.map(toChunkDoc),
      postResults.map(toPostDoc),
      interestPosts.map(toPostDoc),
      recentPosts.map(toPostDoc),
    ).slice(0, 8);

    const response = await safeAsync(
      () => ragService.generateRAGResponse(message, interests, docs, existingHistory),
      null
    );

    if (!response) {
      return res.json({
        conversationId,
        message,
        answer: docs.length
          ? 'I could not generate a strong answer right now, but I found some related sources you can review.'
          : 'I could not find enough relevant information to answer that yet.',
        confidence: 0,
        fallback: true,
      });
    }

    const updatedHistory = [...existingHistory, { role: 'user', content: message }, { role: 'assistant', content: String(response.answer || '') }].slice(-10);
    saveChatHistory(conversationId, updatedHistory);

    res.json({
      conversationId,
      message,
      answer: response.answer,
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