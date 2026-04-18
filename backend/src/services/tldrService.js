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
    .filter(s => s.length > 10); // Filter out very short sentences

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

    const response = await ragService.llm.invoke(prompt);
    let tldr = response?.text || '';

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
    blog: 'focus on key concepts, insights, and technical ideas',
    repo: 'focus on features, capabilities, and use cases for developers',
    video: 'focus on learning outcomes, demonstrations, and key takeaways',
    podcast: 'focus on discussion points, insights, and actionable advice',
  }[type] || 'focus on the main value proposition and key insights';

  return `You are an expert technical content summarizer creating engaging TL;DRs for developer social feeds.

## TASK
Generate a compelling TL;DR that makes developers curious and wanting to read the full post. This is NOT just the opening lines - create an actual summary highlighting key value, insights, and why it matters.

## INPUT POST

**Content:**
${content}

## RELATED CONTEXT
${context}

## GUIDELINES
1. **Length:** 250-750 characters (5-8 lines)
2. **Structure:** 
   - Main idea (1-2 lines)
   - Key points or insights (5-8 lines as paragraphs)
3. **Focus:** ${typeGuide}
4. **Tone:** 
   - Clear, professional, developer-friendly
   - Conversational, not AI-generated
   - Like Dev.to, Hacker News, or LinkedIn posts
5. **Content Requirements:**
   - Extract the ACTUAL value/insight from the post
   - Highlight concrete benefits or learning outcomes
   - Include why developers should care
   - Use specific technical terms when relevant
6. **AVOID:**
   - Generic phrases like "this post discusses" or "in this article"
   - Emojis and hashtags  
   - Just copying first sentences
   - Vague statements without specifics
7. **GOOD EXAMPLES:**
   - "React Server Components shift rendering to the server, reducing bundle sizes and improving performance. Explains when to use RSCs vs traditional components with real-world trade-offs. Essential for optimizing large-scale React apps."
   - "Novel async/await error handling pattern that catches race conditions most developers miss. Includes practical examples and performance implications. Reduces bugs in concurrent operations by 40%+ in production."
   - "Database indexing strategies that consistently 10x query performance. Covers composite indexes, explain plans, and common mistakes. Real examples with 100K+ row datasets."

## OUTPUT
Return ONLY the TL;DR text. No code blocks, no headers, no markdown formatting beyond bullet points. Create something that makes developers think 'I want to read this.'`;
}

module.exports = {
  generateTLDR,
  buildFallbackTLDR,
};
