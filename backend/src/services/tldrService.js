const ragService = require('./ragService');
const { findSimilarPostsByEmbedding } = require('./searchService');
const logger = require('../utils/logger');

const TLDR_MIN_LENGTH = 80;
const TLDR_MAX_LENGTH = 800;


function buildContextFromPosts(posts = []) {
  if (!posts || posts.length === 0) {
    return 'No related context available.';
  }

  return posts
    .filter(post => post && post.title && post.content)
    .map((post, index) => [
      `[Context ${index + 1}]`,
      `Title: ${post.title}`,
      `Summary: ${(post.content || '').slice(0, 500)}`,
    ].join('\n'))
    .join('\n\n');
}


function buildFallbackTLDR(title = '', content = '') {
  const titleStr = String(title || '').trim();
  const contentStr = String(content || '').trim();

  if (!contentStr) {
    return 'Browse to learn more about this development resource.';
  }

  const sentences = contentStr
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return contentStr.slice(0, TLDR_MAX_LENGTH);
  }

  let tldr = '';

  const keyPoints = [];
  for (let i = 1; i < Math.min(sentences.length, 6); i++) {
    const sentence = sentences[i];
    if (sentence.length > 30 && sentence.length < 200) {
      keyPoints.push(`• ${sentence}`);
    }
  }

  if (keyPoints.length > 0) {
    tldr += keyPoints.slice(0, 4).join('\n');
  } else if (sentences.length > 1) {
    tldr += sentences.slice(1, 4).map(s => `• ${s}`).join('\n');
  }

  tldr = tldr
    .replace(/\n\n+/g, '\n\n') // Normalize multiple newlines
    .trim();

  return tldr;
}


// function cleanTLDR(text = '') {
//   let cleaned = String(text || '')
//     .trim()
//     .replace(/^["'`]+|["'`]+$/g, '') // Remove leading/trailing quotes
//     .replace(/\n/g, ' ') // Remove newlines
//     .replace(/\s+/g, ' ') // Normalize spaces
//     .replace(/^(TLDR|TL;DR|Summary|Abstract):\s*/i, '') // Remove prefix headers
//     .trim();

//   return cleaned;
// }


async function generateTLDR({ 
  title = '', 
  content = '', 
  embedding = [],
  type = 'blog'
} = {}) {
  const normalizedContent = String(content || '').trim();
  const normalizedTitle = String(title || '').trim();

  if (!normalizedContent || normalizedContent.length < TLDR_MIN_LENGTH) {
    logger.debug('Content too short for TLDR generation, using fallback', {
      contentLength: normalizedContent.length,
      minLength: TLDR_MIN_LENGTH,
    });
    return buildFallbackTLDR(normalizedTitle, normalizedContent);
  }

  try {
    let context = 'No related context available.';
    if (Array.isArray(embedding) && embedding.length > 0) {
      try {
        const similarPosts = await findSimilarPostsByEmbedding(embedding, { limit: 3 });
        context = buildContextFromPosts(similarPosts);
      } catch (ctxError) {
        logger.warn('Failed to fetch similar posts context', {
          error: ctxError.message,
        });
      }
    }

    const prompt = buildTLDRPrompt(normalizedTitle, normalizedContent, context, type);

    let response;
    try {
      response = await ragService.llm.call(prompt, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'TechBit-Backend/1.0',
        },
      });
    } catch (llmError) {
      logger.warn('LLM call failed for TLDR, using fallback', { error: llmError.message });
      return buildFallbackTLDR(normalizedTitle, normalizedContent);
    }

    let tldr = (response && (typeof response === 'string' ? response : response.text)) || '';

    if (!tldr || tldr.length < TLDR_MIN_LENGTH) {
      logger.warn('Generated TLDR too short, using fallback', {
        generatedLength: tldr.length,
        minLength: TLDR_MIN_LENGTH,
      });
      return buildFallbackTLDR(normalizedTitle, normalizedContent);
    }

      

    logger.debug('TLDR generated successfully', {
      titleLength: normalizedTitle.length,
      contentLength: normalizedContent.length,
      tldrLength: tldr.length,
    });

    return tldr;
  } catch (error) {
    logger.warn('TLDR generation failed, using fallback', {
      error: error.message,
      hasContent: !!normalizedContent,
    });
    return buildFallbackTLDR(normalizedTitle, normalizedContent);
  }
}


function buildTLDRPrompt(title, content, context, type) {
  const typeGuide = {
    blog: 'key technical concepts, insights, and architectural ideas',
    repo: 'main features, capabilities, tech stack, and developer use cases',
    video: 'core learning outcomes, demonstrations, and practical takeaways',
    podcast: 'main discussion points, expert insights, and actionable advice',
  }[type] || 'main value and key insights';

  return `You are a highly efficient technical summarizer. Your task is to extract a TL;DR from the provided content.

STRICT INSTRUCTIONS:
- Create 3 to 5 bullet points only.
- Each bullet must be one clear, concise sentence.
- Rewrite everything in your own words — do not copy phrases.
- Focus only on the most important ideas from the content.
- Prioritize developer value and practical takeaways.
- Focus on: ${typeGuide}

CONTENT TO SUMMARIZE:
Title: ${title}
${content || context}

OUTPUT FORMAT (exactly like this, nothing else):

• First key point in one sentence.
• Second key point in one sentence.
• Third key point in one sentence.
• ...`;
}

module.exports = {
  generateTLDR,
  buildFallbackTLDR,
};
