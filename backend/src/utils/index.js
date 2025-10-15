import fetch from 'node-fetch';

export async function callMlService(path, body, options = {}) {
  const baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  const url = `${baseUrl}${path}`;
  const timeoutMs = options.timeoutMs || 2500;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`ML service error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function tryCallMlService(path, body, fallbackValue) {
  try {
    const json = await callMlService(path, body);
    return json;
  } catch (_e) {
    return fallbackValue;
  }
}

// Utility functions for Techbit backend

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate time ago from timestamp
 */
export function timeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

/**
 * Validate post object structure
 */
export function validatePost(post) {
  const required = ['id', 'text', 'author', 'timestamp'];
  const missing = required.filter(field => !post[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Sanitize text input
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(post) {
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const shares = post.shares || 0;
  
  // Simple engagement score
  const totalEngagement = likes + (comments * 2) + (shares * 3);
  return totalEngagement;
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Merge and deduplicate arrays
 */
export function mergeUnique(arr1, arr2, key = 'id') {
  const merged = [...arr1, ...arr2];
  const unique = merged.reduce((acc, item) => {
    const existingItem = acc.find(i => i[key] === item[key]);
    if (!existingItem) {
      acc.push(item);
    }
    return acc;
  }, []);
  return unique;
}

/**
 * Parse query parameters for filtering
 */
export function parseFilterParams(query) {
  const filters = {};
  
  if (query.tags) {
    filters.tags = query.tags.split(',').map(t => t.trim());
  }
  
  if (query.author) {
    filters.author = query.author;
  }
  
  if (query.minScore) {
    filters.minScore = parseFloat(query.minScore);
  }
  
  if (query.startDate) {
    filters.startDate = new Date(query.startDate);
  }
  
  if (query.endDate) {
    filters.endDate = new Date(query.endDate);
  }
  
  return filters;
}

/**
 * Sleep/delay utility for async operations
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry logic for async operations
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Calculate percentile from array of numbers
 */
export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Group items by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Paginate array
 */
export function paginate(array, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return {
    data: array.slice(offset, offset + limit),
    metadata: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit)
    }
  };
}
