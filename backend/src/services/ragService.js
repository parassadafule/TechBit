const { Ollama } = require('@langchain/community/llms/ollama');
const { OllamaEmbeddings } = require('@langchain/community/embeddings/ollama');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { RetrievalQAChain } = require('langchain/chains');
const { PromptTemplate } = require('@langchain/core/prompts');
const crypto = require('crypto');
const axios = require('axios');
const SemanticChunk = require('../models/SemanticChunk');
const { getEmbedding } = require('../utils/embedding');
const logger = require('../utils/logger');

class RAGService {
  constructor() {
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest';
    this.chatModel = process.env.OLLAMA_CHAT_MODEL || 'phi3:latest';
    this.chunkSize = parseInt(process.env.CHUNK_SIZE) || 500;
    this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP) || 50;
    this.topK = parseInt(process.env.TOP_K_RETRIEVAL) || 5;

    this.embeddings = new OllamaEmbeddings({
      baseUrl: this.ollamaBaseUrl,
      model: this.embeddingModel,
    });

    this.llm = new Ollama({
      baseUrl: this.ollamaBaseUrl,
      model: this.chatModel,
      temperature: 0.2,
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
  }

  
  async getOllamaStatus() {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`, {
        timeout: 5000,
      });

      const models = (response.data?.models || []).map((model) => model.name);

      return {
        reachable: true,
        baseUrl: this.ollamaBaseUrl,
        chatModel: this.chatModel,
        embeddingModel: this.embeddingModel,
        installedModels: models,
        chatModelInstalled: models.includes(this.chatModel),
        embeddingModelInstalled: models.includes(this.embeddingModel),
      };
    } catch (error) {
      return {
        reachable: false,
        baseUrl: this.ollamaBaseUrl,
        chatModel: this.chatModel,
        embeddingModel: this.embeddingModel,
        installedModels: [],
        chatModelInstalled: false,
        embeddingModelInstalled: false,
        error: error.message,
      };
    }
  }

  
  async logOllamaStartupStatus() {
    const status = await this.getOllamaStatus();

    if (!status.reachable) {
      logger.warn('Local Ollama is not reachable. AI features will fall back until Ollama is running.', {
        baseUrl: status.baseUrl,
        chatModel: status.chatModel,
        embeddingModel: status.embeddingModel,
        error: status.error,
      });
      return status;
    }

    if (!status.chatModelInstalled || !status.embeddingModelInstalled) {
      logger.warn('Local Ollama is running but one or more configured models are missing.', {
        baseUrl: status.baseUrl,
        chatModel: status.chatModel,
        embeddingModel: status.embeddingModel,
        chatModelInstalled: status.chatModelInstalled,
        embeddingModelInstalled: status.embeddingModelInstalled,
        installedModels: status.installedModels,
      });
      return status;
    }

    logger.info('Local Ollama is ready for all AI features.', {
      baseUrl: status.baseUrl,
      chatModel: status.chatModel,
      embeddingModel: status.embeddingModel,
    });
    return status;
  }

  
  async generateEmbedding(text) {
    try {
      return await getEmbedding(text);
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  
  async chunkAndEmbed(content, metadata = {}) {
    try {
      const chunks = await this.textSplitter.createDocuments([content], [metadata]);
      return chunks;
    } catch (error) {
      logger.error('Error chunking content:', error);
      throw error;
    }
  }

  
  async addDocuments(documents) {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        return;
      }

      const normalizedDocuments = [];
      for (const doc of documents) {
        const content = doc.pageContent || doc.content || '';
        if (!content.trim()) {
          continue;
        }

        const metadata = doc.metadata || {};
        let embedding = [];
        try {
          embedding = await this.generateEmbedding(content);
        } catch (error) {
          if (!this.isModelUnavailableError(error)) {
            throw error;
          }
          logger.warn('Embedding unavailable while storing semantic chunk. Saving chunk without vector.', {
            message: error.message,
          });
        }
        normalizedDocuments.push({
          postId: metadata.postId || null,
          content,
          embedding,
          metadata,
          sourceUrl: metadata.url || null,
          title: metadata.title || null,
          contentHash: crypto.createHash('sha1').update(`${metadata.postId || 'no-post'}:${content}`).digest('hex'),
        });
      }

      if (normalizedDocuments.length > 0) {
        const postIds = [...new Set(normalizedDocuments.map((doc) => doc.postId).filter(Boolean))];
        if (postIds.length > 0) {
          await SemanticChunk.deleteMany({ postId: { $in: postIds } });
        }
        await SemanticChunk.insertMany(normalizedDocuments, { ordered: false }).catch((error) => {
          logger.warn('Some semantic chunks could not be stored', {
            message: error.message,
          });
        });
        logger.info(`Stored ${normalizedDocuments.length} semantic chunks`);
      }
    } catch (error) {
      logger.error('Error storing semantic chunks:', error);
      throw error;
    }
  }

  
  async semanticSearch(query, k = null) {
    try {
      const topK = k || this.topK;
      const chunksCount = await SemanticChunk.countDocuments();

      if (chunksCount === 0) {
        await this.backfillChunksFromPosts();
      }

      const persistedChunks = await SemanticChunk.find({})
        .select('content metadata embedding')
        .lean();

      if (persistedChunks.length > 0) {
        let queryEmbedding;
        try {
          queryEmbedding = await this.generateEmbedding(query);
        } catch (error) {
          if (this.isModelUnavailableError(error)) {
            logger.warn('Embedding model unavailable for semantic search, falling back to lexical ranking.', {
              message: error.message,
            });
            return persistedChunks
              .filter((chunk) => chunk.content.toLowerCase().includes(query.toLowerCase()))
              .slice(0, topK)
              .map((chunk) => ({
                content: chunk.content,
                metadata: chunk.metadata || {},
                score: 0.1,
              }));
          }
          throw error;
        }

        return persistedChunks
          .map((chunk) => ({
            content: chunk.content,
            metadata: chunk.metadata || {},
            score: this.cosineSimilarity(queryEmbedding, chunk.embedding || []),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      }

      return [];
    } catch (error) {
      logger.error('Error performing semantic search:', error);
      throw error;
    }
  }

  
  async generateSummary(content, url = null) {
    try {
      const chunks = await this.chunkAndEmbed(content, { url });

      const tempVectorStore = await MemoryVectorStore.fromDocuments(chunks, this.embeddings);

      const retriever = tempVectorStore.asRetriever(3);

      const promptTemplate = new PromptTemplate({
        template: `As a developer assistant, summarize this developer content concisely. Tag it semantically for discoverability.
        
Content: {context}

Provide:
1. A concise summary (2-3 sentences)
2. Key topics and tags (comma-separated)
3. Provenance: Source URL

Summary:`,
        inputVariables: ['context'],
      });

      const chain = RetrievalQAChain.fromLLM(this.llm, retriever, {
        prompt: promptTemplate,
      });

      const response = await chain.call({
        query: 'Summarize this content',
      });

      const tags = this.extractTags(content);

      return {
        summary: response.text,
        tags: tags,
        provenance: url ? [{ url, snippet: content.substring(0, 200) }] : [],
        fallback: false,
      };
    } catch (error) {
      if (this.isModelUnavailableError(error)) {
        logger.warn('LLM unavailable for summary. Falling back to extractive summary.', {
          message: error.message,
        });
        return this.buildFallbackSummary(content, url);
      }

      logger.error('Error generating summary:', error);
      throw error;
    }
  }

  
  async generateMultiModalSummary(inputs = [], focus = '') {
    try {
      const normalized = inputs
        .map((item, idx) => ({
          index: idx + 1,
          modality: item.modality || item.type || 'text',
          type: item.type || 'blog',
          url: item.url || null,
          content: item.content || '',
        }))
        .filter((item) => item.content.trim().length > 0);

      if (!normalized.length) {
        return {
          unifiedSummary: 'No content provided to summarize.',
          perItem: [],
          citations: [],
          fallback: true,
        };
      }

      const perItem = normalized.map((item) => {
        const localSummary = this.buildFallbackSummary(item.content, item.url);
        return {
          index: item.index,
          modality: item.modality,
          type: item.type,
          summary: localSummary.summary,
          tags: localSummary.tags,
          provenance: localSummary.provenance,
        };
      });

      const context = normalized
        .map((item) => `[${item.index}] Modality: ${item.modality}; Type: ${item.type}\n${item.content.substring(0, 1800)}`)
        .join('\n\n');

      const prompt = `You are summarizing developer knowledge from mixed modalities (text, video transcript, audio notes, code snippets, blogs, podcasts).

Focus preference: ${focus || 'General developer productivity and understanding'}

Content:
${context}

Produce:
1) A concise unified TLDR (max 6 bullet points)
2) A short "what to learn next" section (3 bullets)
3) Mention references by source numbers like [1], [2]
`;

      let unifiedSummary;
      let fallback = false;
      try {
        unifiedSummary = await this.llm.call(prompt);
      } catch (error) {
        if (!this.isModelUnavailableError(error)) {
          throw error;
        }
        fallback = true;
        unifiedSummary = perItem
          .map((item) => `- [${item.index}] (${item.modality}) ${item.summary.split('\n')[0]}`)
          .join('\n');
      }

      const citations = normalized.map((item) => ({
        index: item.index,
        source: item.url || `${item.modality}-${item.index}`,
        snippet: item.content.substring(0, 160),
      }));

      return {
        unifiedSummary,
        perItem,
        citations,
        fallback,
      };
    } catch (error) {
      logger.error('Error generating multimodal summary:', error);
      throw error;
    }
  }

  
  async generateRAGResponse(query, userInterests = [], retrievedDocs = []) {
    try {
      let searchResults = [];
      try {
        searchResults = await this.semanticSearch(query, this.topK);
      } catch (retrievalError) {
        if (this.isModelUnavailableError(retrievalError)) {
          logger.warn(`[${requestId}] Embeddings unavailable, continuing without vector results`, {
            message: retrievalError.message,
          });
          searchResults = [];
        } else {
          throw retrievalError;
        }
      }

      const allDocs = [...searchResults, ...retrievedDocs];

      const context = allDocs
        .map((doc, idx) => `[${idx + 1}] ${doc.content || doc.pageContent}`)
        .join('\n\n');

      const prompt = `As a developer assistant, answer the following question using the retrieved evidence. Provide a concise, citation-backed response.

Question: ${query}

User Interests: ${userInterests.join(', ') || 'General development'}

Evidence:
${context}`;

      let response;
      try {
        logger.debug(`[${requestId}] Calling LLM...`);
        response = await this.llm.call(prompt);
        logger.debug(`[${requestId}] LLM returned`, {
          responseLength: response?.length || 0,
          responseStart: response?.substring(0, 100) || 'EMPTY',
        });
      } catch (llmError) {
        if (this.isModelUnavailableError(llmError)) {
          logger.warn('LLM unavailable for RAG response. Returning fallback answer.', {
            message: llmError.message,
          });
          return this.buildFallbackRAGResponse(query, userInterests, allDocs);
        }
        throw llmError;
      }

      const citations = this.buildCitations(allDocs);
      logger.debug(`[${requestId}] generateRAGResponse SUCCESS`, {
        citationCount: citations.length,
        responseLength: response?.length || 0,
      });

      return {
        answer: response,
        citations,
        confidence: this.calculateConfidence(searchResults),
        fallback: false,
      };
    } catch (error) {
      logger.error(`[${requestId}] generateRAGResponse FAILED`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  
  async generateLearningPath(userProfile, posts) {
    try {
      const recentActivity = (userProfile.activityHistory || [])
        .slice(-5)
        .map((item) => item.action)
        .join(', ');

      const postsContext = posts
        .map((post, idx) => `[${idx + 1}] Title: ${post.title}\nTags: ${post.tags.join(', ')}\nType: ${post.type}`)
        .join('\n\n');

      const prompt = `Generate a structured learning roadmap for a developer with the following profile:

Skill Level: ${userProfile.goals.skillLevel}
Career Goal: ${userProfile.goals.career}
Interests: ${userProfile.interests.join(', ')}
Recent Activity: ${recentActivity || 'None yet'}

Available Resources:
${postsContext}

Create a 5-step learning path by:
1. Sequencing resources from beginner to advanced
2. Explaining the reason for each step
3. Ensuring logical progression

Format each step as:
Step X: [Resource Number] - Reason: [Why this step]`;

      const response = await this.llm.call(prompt);

      const steps = this.parseLearningPathResponse(response, posts);

      return steps;
    } catch (error) {
      if (this.isModelUnavailableError(error)) {
        logger.warn('LLM unavailable for learning path. Falling back to sequential recommendation.', {
          message: error.message,
        });
        return this.buildFallbackLearningPath(posts);
      }
      logger.error('Error generating learning path:', error);
      throw error;
    }
  }

  async backfillChunksFromPosts() {
    const Post = require('../models/Post');
    const posts = await Post.find({})
      .select('_id content blogUrl title')
      .limit(100);

    for (const post of posts) {
      const existingCount = await SemanticChunk.countDocuments({ postId: post._id });
      if (existingCount > 0) {
        continue;
      }

      try {
        const docs = await this.chunkAndEmbed(post.content, {
          postId: post._id.toString(),
          url: post.blogUrl,
          title: post.title,
        });
        await this.addDocuments(docs);
      } catch (error) {
        logger.warn('Failed to backfill semantic chunks for post', {
          postId: post._id.toString(),
          message: error.message,
        });
      }
    }
  }

  cosineSimilarity(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
      return 0;
    }

    const length = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  buildFallbackLearningPath(posts = []) {
    return posts.slice(0, 5).map((post, index) => ({
      step: index + 1,
      postId: post._id,
      type: post.type,
      reason: index === 0
        ? 'Start with this resource to build core context.'
        : 'Continue with this resource as the next practical step in your roadmap.',
    }));
  }

  
  extractTags(content) {
    const keywords = [
      'react', 'vue', 'angular', 'node', 'express', 'mongodb', 'sql',
      'javascript', 'typescript', 'python', 'java', 'go', 'rust',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'ai', 'ml', 'nlp', 'rag', 'llm',
      'api', 'rest', 'graphql', 'microservices',
      'testing', 'ci/cd', 'devops', 'security',
    ];

    const contentLower = content.toLowerCase();
    const foundTags = keywords.filter((keyword) => contentLower.includes(keyword));

    return foundTags.slice(0, 10); // Limit to 10 tags
  }

  
  calculateConfidence(results) {
    if (results.length === 0) return 0;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    return Math.min(Math.max(avgScore, 0), 1);
  }

  
  buildFallbackSummary(content, url) {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .slice(0, 3);

    const summary = sentences.length > 0
      ? sentences.join(' ')
      : 'A summary is unavailable because local Ollama could not be reached.';

    return {
      summary: `${summary}\n\n*This was generated using a fallback summarizer while local Ollama is offline.*`,
      tags: this.extractTags(content),
      provenance: url ? [{ url, snippet: content.substring(0, 200) }] : [],
      fallback: true,
    };
  }

  
  buildFallbackRAGResponse(query, userInterests, docs) {
    if (!docs || docs.length === 0) {
      return {
        answer: `I wasn't able to reach local Ollama to answer "${query}". Please make sure Ollama is running and the configured model is installed.`,
        citations: [],
        confidence: 0,
        fallback: true,
      };
    }

    const highlights = docs.slice(0, 3).map((doc, idx) => {
      const title = doc.metadata?.title || doc.metadata?.source || `Source ${idx + 1}`;
      const tags = Array.isArray(doc.metadata?.tags) ? doc.metadata.tags.join(', ') : '';
      return `- **${title}**${tags ? ` (tags: ${tags})` : ''}`;
    });

    const interestNote = userInterests.length
      ? ` while keeping your interests in ${userInterests.join(', ')} in mind`
      : '';

    const answer = [
      `I couldn't reach local Ollama${interestNote}, so here's a quick overview based on related resources we already have indexed:`,
      '',
      ...highlights,
      '',
      `Please try again once Ollama is running with "${this.chatModel}" and "${this.embeddingModel}".`,
    ].join('\n');

    return {
      answer,
      citations: this.buildCitations(docs),
      confidence: 0.2,
      fallback: true,
    };
  }

  
  buildCitations(docs = []) {
    const seen = new Set();
    const citations = [];

    docs.forEach((doc, idx) => {
      const url = doc.metadata?.url || doc.metadata?.source || `Source ${idx + 1}`;
      const key = url;

      if (seen.has(key)) {
        return;
      }
      seen.add(key);

      citations.push({
        index: idx + 1,
        source: url,
        snippet: (doc.content || doc.pageContent || '').substring(0, 160),
      });
    });

    return citations;
  }

  
  isModelUnavailableError(error) {
    if (!error) {
      return false;
    }

    const message = (error.message || '').toLowerCase();
    return (
      message.includes('model') && message.includes('not found')
    ) || message.includes('connection refused')
      || message.includes('connect econrefused')
      || message.includes('fetch failed')
      || message.includes('enoent')
      || message.includes('timed out');
  }

  
  parseLearningPathResponse(response, posts) {
    const steps = [];
    const lines = response.split('\n');

    let stepNumber = 1;
    for (const line of lines) {
      const stepMatch = line.match(/Step\s+(\d+):\s*\[?(\d+)\]?\s*-?\s*Reason:\s*(.+)/i);
      if (stepMatch) {
        const resourceIdx = parseInt(stepMatch[2]) - 1;
        if (resourceIdx >= 0 && resourceIdx < posts.length) {
          steps.push({
            step: stepNumber++,
            postId: posts[resourceIdx]._id,
            type: posts[resourceIdx].type,
            reason: stepMatch[3].trim(),
          });
        }
      }
    }

    if (steps.length === 0) {
      posts.slice(0, 5).forEach((post, idx) => {
        steps.push({
          step: idx + 1,
          postId: post._id,
          type: post.type,
          reason: 'Recommended based on your interests and skill level',
        });
      });
    }

    return steps;
  }
}

module.exports = new RAGService();
