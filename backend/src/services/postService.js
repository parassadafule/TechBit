const Post = require('../models/Post');
const ragService = require('./ragService');
const { generateTLDR, buildFallbackTLDR } = require('./tldrService');
const { getEmbedding, DEFAULT_EMBEDDING_INPUT_LIMIT } = require('../utils/embedding');
const { scrapeUrlMetadata, buildFallbackPostContent } = require('./scrapperService');
const logger = require('../utils/logger');

const TIMEOUTS = {
  SUMMARY: 12000,
  EMBEDDING: 15000,
  TLDR: 15000,
};


function buildPostEmbeddingText(title = '', content = '') {
  return [title, content]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join('\n\n');
}


function runWithTimeout(taskFactory, timeoutMs, fallbackValue) {
  return Promise.race([
    Promise.resolve().then(taskFactory),
    new Promise(resolve => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}


function validatePostInput({ title, content, type }) {
  const titleStr = String(title || '').trim();
  const contentStr = String(content || '').trim();

  if (!titleStr) {
    return 'Title is required and cannot be empty';
  }

  if (!contentStr) {
    return 'Content is required and cannot be empty';
  }

  if (contentStr.length < 20) {
    return 'Content must be at least 20 characters';
  }

  const validTypes = ['blog', 'repo', 'video', 'podcast'];
  if (!validTypes.includes(type)) {
    return `Post type must be one of: ${validTypes.join(', ')}`;
  }

  return null;
}


function queuePostIndexing({ postId, title, content, url }) {
  setImmediate(async () => {
    try {
      const docs = await ragService.chunkAndEmbed(content, {
        postId,
        url,
        title,
      });
      await ragService.addDocuments(docs);
      logger.debug('Post indexed successfully', { postId, docCount: docs.length });
    } catch (error) {
      logger.warn('Background post indexing failed', {
        postId,
        error: error.message,
      });
    }
  });
}


async function generatePostMetadata(title, content, sourceUrl) {
  const embeddingText = buildPostEmbeddingText(title, content);
  const contentSlice = content.slice(0, DEFAULT_EMBEDDING_INPUT_LIMIT);

  const [summaryResult, embeddingResult] = await Promise.allSettled([
    runWithTimeout(
      () => ragService.generateSummary(contentSlice, sourceUrl),
      TIMEOUTS.SUMMARY,
      { summary: content.substring(0, 200), tags: [] }
    ),
    runWithTimeout(
      () => getEmbedding(embeddingText, { maxLength: DEFAULT_EMBEDDING_INPUT_LIMIT }),
      TIMEOUTS.EMBEDDING,
      []
    ),
  ]);

  let ragResult = { summary: content.substring(0, 200), tags: [] };
  let embedding = [];

  if (summaryResult.status === 'fulfilled' && summaryResult.value) {
    ragResult = summaryResult.value;
  } else if (summaryResult.status === 'rejected') {
    logger.warn('RAG summary generation failed, using fallback', {
      error: summaryResult.reason?.message,
    });
  }

  if (embeddingResult.status === 'fulfilled' && Array.isArray(embeddingResult.value)) {
    embedding = embeddingResult.value;
  } else if (embeddingResult.status === 'rejected') {
    logger.warn('Embedding generation failed, using empty embedding', {
      error: embeddingResult.reason?.message,
    });
  }

  return { ragResult, embedding };
}


async function generatePostTLDR(title, content, embedding, type) {
  return runWithTimeout(
    () => generateTLDR({ title, content, embedding, type }),
    TIMEOUTS.TLDR,
    buildFallbackTLDR(title, content)
  );
}

async function generateTags(content) {
  const prompt = `You are a helpful assistant.

STRICT RULES:
- Generate 4 to 5 tags for the following content.
- Return ONLY comma-separated sinle worded tags.
- Tags should be relevant, specific, and useful for categorization.

Content:
${content}
`;

  const res = await ragService.generate(prompt);

  return String(res || '')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}


async function createPost({
  title,
  content,
  type,
  userId,
  tags = [],
  sourceUrl = null,
  summary = null,
}) {
  const validationError = validatePostInput({ title, content, type });
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  logger.info('Creating post', { userId, type, titleLength: title.length });

  try {
    const { ragResult, embedding } = await generatePostMetadata(title, content, sourceUrl);

    let generatedTags = [];
    try {
      generatedTags = await generateTags(content);
    } catch (err) {
      logger.warn('Tag generation failed, continuing without generated tags', { error: err.message });
      generatedTags = [];
    }

    let tldr = '';
    try {
      tldr = await generatePostTLDR(title, content, embedding, type);
    } catch (error) {
      logger.warn('TLDR generation error, post creation will continue', {
        error: error.message,
      });
      tldr = buildFallbackTLDR(title, content);
    }

    const allTags = Array.from(new Set([
      ...tags.filter(t => typeof t === 'string' && t.trim()),
      ...ragResult.tags.filter(t => typeof t === 'string' && t.trim()),
      ...generatedTags.filter(t => typeof t === 'string' && t.trim()),
    ]));

    const postData = {
      userId,
      title: title.trim(),
      content: content.trim(),
      tldr,
      type,
      tags: allTags,
      embedding,
      blogUrl: sourceUrl || null,
    };

    if (summary) {
      postData.summary = summary;
    } else if (ragResult.summary) {
      postData.summary = ragResult.summary;
    }

    const post = await Post.create(postData);
    logger.info('Post created successfully', { postId: post._id.toString(), userId });

    queuePostIndexing({
      postId: post._id.toString(),
      title: post.title,
      content: post.content,
      url: sourceUrl,
    });

    return post.toObject({ transform: (doc, ret) => {
      delete ret.embedding;
      return ret;
    }});
  } catch (error) {
    if (!error.statusCode) {
      logger.error('Unexpected error creating post', {
        error: error.message,
        stack: error.stack,
      });
      error.statusCode = 500;
    }
    throw error;
  }
}


async function createPostFromUrl({
  url,
  type,
  userId,
}) {
  logger.info('Creating post from URL', { url, type, userId });

  try {
    const { title, content } = await generateContentFromUrl(url, type);

    if (!content || content.length < 100) {
      const error = new Error('Unable to generate sufficient content from the provided URL');
      error.statusCode = 422;
      error.details = 'The URL may not contain readable article content. Try again with a different URL or create the post manually.';
      throw error;
    }

    const post = await createPost({
      title,
      content,
      type,
      userId,
      sourceUrl: url,
    });

    logger.info('Post created from URL', { postId: post._id.toString(), url });
    return post;
  } catch (error) {
    if (!error.statusCode) {
      logger.error('Error creating post from URL', {
        url,
        error: error.message,
      });
      error.statusCode = 500;
    }
    throw error;
  }
}


function generateTitleFromUrl(url, type = 'blog') {
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname
      .split('/')
      .filter(Boolean);

    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    const cleaned = lastSegment
      .replace(/[-_]+/g, ' ')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9\s]/gi, '')
      .trim();

    if (cleaned.length > 3) {
      return cleaned
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .slice(0, 500);
    }
  } catch (error) {
    logger.debug('Failed to extract title from URL', { url, error: error.message });
  }

  return `${type.charAt(0).toUpperCase() + type.slice(1)} Resource`;
}


async function generateContentFromUrl(url, type, title = '') {
  const scraped = await scrapeUrlMetadata(url, type);

  const typeHints = {
    blog: 'Focus on concepts, explanations, best practices and technical insights',
    repo: 'Focus on features, capabilities, API, use cases, and implementation details',
    video: 'Focus on learning outcomes, demonstrations, key takeaways, and practical application',
    podcast: 'Focus on discussion topics, speaker insights, actionable advice, and takeaways',
  };

  const effectiveType = scraped.type || type;
  const typeHint = typeHints[effectiveType] || 'Focus on comprehensive technical information';
  const fallbackTitle = title || scraped.title || generateTitleFromUrl(url, effectiveType);

  const groundingContext = [
    `Scraped title: ${scraped.title || 'N/A'}`,
    `Scraped description: ${scraped.description || 'N/A'}`,
    `Author/creator: ${scraped.author || 'N/A'}`,
    `Site/platform: ${scraped.siteName || scraped.platform || 'N/A'}`,
    `Headings: ${(scraped.headings || []).join(' | ') || 'N/A'}`,
    `Tags: ${(scraped.tags || []).join(', ') || 'N/A'}`,
    `Extracted content: ${(scraped.extractedText || '').slice(0, 9000) || 'N/A'}`,
  ].join('\n');

  const prompt = `You are an expert developer content creator for a modern tech social platform (like Dev.to, Hacker News, or LinkedIn for developers).

Your task: Generate a HIGH-QUALITY developer post based on the URL provided. The post should be structured, practical, and immediately valuable to developers.

INPUT
- URL: ${url}
- Type: ${effectiveType}
- Focus: ${typeHint}

SCRAPED GROUNDING DATA (USE THIS AS SOURCE OF TRUTH)
${groundingContext}

OUTPUT FORMAT

Generate the post in this exact markdown structure:

• Overview
(2-3 sentences explaining what this resource is and why it matters to developers)

• Key Takeaways
- Point 1: Specific insight or feature
- Point 2: Specific insight or feature
- Point 3: Specific insight or feature
- Point 4: Specific insight or feature

• Practical Application
(Explain how developers can use this concept, tool, or knowledge in their projects. Be specific with examples or use cases)

• Why It Matters
(Explain the broader impact or value proposition for the developer community)

• Next Steps
- Resource 1 to explore
- Resource 2 to explore
- Resource 3 to explore

RULES
1. DO NOT say "I accessed this URL" or "According to this page"
2. DO NOT hallucinate specific code or technical claims
3. If unsure about details, use phrases like "likely covers" or "typically includes"
4. Keep content PRACTICAL and SPECIFIC, not generic
5. Target audience: senior developers, team leads, architects, developers community
6. Total length: 400-600 words
7. Use markdown formatting with clear sections where appropriate
8. Be concise and scannable (use bullet points)
9. Use scraped data first. Never add facts not implied by scraped data.

Generate the post now:`;

  try {
    logger.debug('Generating content from URL using LLM', { url, type });
    const generated = await ragService.llm.call(prompt);
    const content = (generated || '').trim();

    if (content.length > 0 ) {
      logger.debug('Content generated from URL successfully', { length: content.length });
      return {
        title: fallbackTitle,
        content: content,
      };
    }
  } catch (error) {
    logger.warn('LLM content generation failed for URL', {
      url,
      error: error.message,
    });
  }

  logger.debug('Using fallback content structure for URL post');
  const fallbackContent = buildFallbackPostContent({
    ...scraped,
    title: fallbackTitle,
  }, effectiveType);

  return {
    title: fallbackTitle,
    content: fallbackContent,
  };
}


async function updatePost(postId, userId, updates) {
  logger.info('Updating post', { postId, userId });

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if (post.userId.toString() !== userId.toString()) {
      const error = new Error('You do not have permission to update this post');
      error.statusCode = 403;
      throw error;
    }

    const { title, content, tags, type } = updates;
    if (title !== undefined || content !== undefined || type !== undefined) {
      const validationInput = {
        title: title !== undefined ? title : post.title,
        content: content !== undefined ? content : post.content,
        type: type !== undefined ? type : post.type,
      };
      const validationError = validatePostInput(validationInput);
      if (validationError) {
        const error = new Error(validationError);
        error.statusCode = 400;
        throw error;
      }
    }

    if (title !== undefined) post.title = title;
    if (type !== undefined) post.type = type;
    if (tags !== undefined) {
      post.tags = tags.filter(t => typeof t === 'string' && t.trim());
    }

    if (content !== undefined) {
      post.content = content;
      try {
        const { ragResult, embedding } = await generatePostMetadata(post.title, content, post.blogUrl);
        post.embedding = embedding;
        if (ragResult.summary) {
          post.summary = ragResult.summary;
        }
        const tldr = await generatePostTLDR(post.title, content, embedding, post.type);
        post.tldr = tldr;
      } catch (error) {
        logger.warn('Metadata regeneration failed during post update, post still will be updated', {
          error: error.message,
        });
      }

      queuePostIndexing({
        postId: post._id.toString(),
        title: post.title,
        content: post.content,
        url: post.blogUrl,
      });
    }

    await post.save();
    logger.info('Post updated successfully', { postId, userId });

    return post.toObject({ transform: (doc, ret) => {
      delete ret.embedding;
      return ret;
    }});
  } catch (error) {
    if (!error.statusCode) {
      logger.error('Unexpected error updating post', {
        error: error.message,
        stack: error.stack,
      });
      error.statusCode = 500;
    }
    throw error;
  }
}

module.exports = {
  createPost,
  createPostFromUrl,
  updatePost,
  generateContentFromUrl,
  generateTitleFromUrl,
};