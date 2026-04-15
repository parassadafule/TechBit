const axios = require('axios');
const logger = require('./logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest';
const EMBEDDING_TIMEOUT_MS = parseInt(process.env.OLLAMA_EMBEDDING_TIMEOUT_MS, 10) || 30000;
const DEFAULT_EMBEDDING_INPUT_LIMIT = 4000;

function normalizeEmbeddingText(text = '', maxLength = DEFAULT_EMBEDDING_INPUT_LIMIT) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getEmbeddingModelCandidates() {
  const candidates = [OLLAMA_EMBEDDING_MODEL];

  if (OLLAMA_EMBEDDING_MODEL.endsWith(':latest')) {
    candidates.push(OLLAMA_EMBEDDING_MODEL.replace(/:latest$/, ''));
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function requestEmbedding(model, prompt) {
  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/embeddings`,
    {
      model,
      prompt,
    },
    {
      timeout: EMBEDDING_TIMEOUT_MS,
    },
  );

  const embedding = response.data?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error('Ollama embeddings API returned an invalid embedding payload');
  }

  return embedding;
}

async function getEmbedding(text, options = {}) {
  const normalizedText = normalizeEmbeddingText(
    text,
    options.maxLength || DEFAULT_EMBEDDING_INPUT_LIMIT,
  );

  if (!normalizedText) {
    return [];
  }

  let lastError = null;

  
  try {
    for (const model of getEmbeddingModelCandidates()) {
      try {
        return await requestEmbedding(model, normalizedText);
      } catch (error) {
        lastError = error;
        logger.warn('Embedding model attempt failed', {
          model,
          attempt,
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
        });
      }
    }
  } catch (error) {
    lastError = error;
  }
  if (attempt < 2) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.warn('Failed to generate embedding from local Ollama', {
    message: lastError?.response?.data?.error || lastError?.message,
    status: lastError?.response?.status,
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_EMBEDDING_MODEL,
  });

  const normalizedError = new Error(
    lastError?.response?.data?.error
      || lastError?.message
      || 'Unable to generate embedding from local Ollama',
  );
  normalizedError.status = lastError?.response?.status;
  normalizedError.baseUrl = OLLAMA_BASE_URL;
  normalizedError.model = OLLAMA_EMBEDDING_MODEL;
  throw normalizedError;
}

module.exports = {
  getEmbedding,
  normalizeEmbeddingText,
  DEFAULT_EMBEDDING_INPUT_LIMIT,
};
