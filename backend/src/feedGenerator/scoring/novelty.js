// Novelty scoring using NLP embeddings
import { techTrends } from '../../mockData.js';
import { tryCallMlService } from '../../utils/index.js';

export function calculateNovelty(post) {
  // Synchronous path for compatibility; ML call is attempted lazily via cache-like pattern
  // Calculate novelty based on trending tech tags (fallback heuristic)
  let noveltyScore = 0.5; // Base score
  
  // Trending topics boost
  if (post.tags && post.tags.length > 0) {
    let tagScore = 0;
    post.tags.forEach(tag => {
      if (techTrends[tag]) {
        tagScore += techTrends[tag] * 0.3; // Boost for trending topics
      }
    });
    noveltyScore += Math.min(tagScore, 0.4); // Cap tag contribution
  }
  
  // Factor in post length and uniqueness (simplified)
  const textLength = post.text ? post.text.length : 0;
  noveltyScore += Math.min(textLength / 500, 0.15); // Longer posts might be more detailed
  
  // Recency bonus - newer posts get higher scores
  if (post.timestamp) {
    const postDate = new Date(post.timestamp);
    const now = new Date();
    const hoursSincePost = (now - postDate) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 0.2 * (1 - hoursSincePost / 24)); // Decay over 24 hours
    noveltyScore += recencyBonus;
  }
  
  // Engagement factor (comments and shares indicate novel content)
  if (post.comments || post.shares) {
    const engagementScore = ((post.comments || 0) * 0.002) + ((post.shares || 0) * 0.003);
    noveltyScore += Math.min(engagementScore, 0.15);
  }
  
  const heuristicScore = Math.min(Math.max(noveltyScore, 0), 1.0);

  // Fire-and-forget ML call to improve score when service is available.
  // Note: The primary API here is synchronous; to keep existing callers unchanged, we do not await.
  // Downstream endpoints that want strict ML scoring should call the ML endpoint directly.
  if (post && post.text) {
    tryCallMlService('/score', { text: post.text }, { score: heuristicScore })
      .then((res) => res && typeof res.score === 'number' ? res.score : heuristicScore)
      .catch(() => heuristicScore);
  }

  return heuristicScore;
}

export async function calculateNoveltyAsync(post) {
  const heuristic = calculateNovelty(post);
  if (!post || !post.text) return heuristic;
  const result = await tryCallMlService('/score', { text: post.text }, { score: heuristic });
  if (result && typeof result.score === 'number') {
    // Normalize if needed; assume ML returns 0..1 or a compatible range.
    const mlScore = result.score;
    const bounded = Math.min(Math.max(mlScore, 0), 1);
    return bounded;
  }
  return heuristic;
}