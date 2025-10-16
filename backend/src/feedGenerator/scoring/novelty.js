
import { techTrends } from '../../mockData.js';
import { tryCallMlService } from '../../utils/index.js';

export function calculateNovelty(post) {
  
  
  let noveltyScore = 0.5; 
  
  
  if (post.tags && post.tags.length > 0) {
    let tagScore = 0;
    post.tags.forEach(tag => {
      if (techTrends[tag]) {
        tagScore += techTrends[tag] * 0.3; 
      }
    });
    noveltyScore += Math.min(tagScore, 0.4); 
  }
  
  
  const textLength = post.text ? post.text.length : 0;
  noveltyScore += Math.min(textLength / 500, 0.15); 
  
  
  if (post.timestamp) {
    const postDate = new Date(post.timestamp);
    const now = new Date();
    const hoursSincePost = (now - postDate) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 0.2 * (1 - hoursSincePost / 24)); 
    noveltyScore += recencyBonus;
  }
  
  
  if (post.comments || post.shares) {
    const engagementScore = ((post.comments || 0) * 0.002) + ((post.shares || 0) * 0.003);
    noveltyScore += Math.min(engagementScore, 0.15);
  }
  
  const heuristicScore = Math.min(Math.max(noveltyScore, 0), 1.0);

  
  
  
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
    
    const mlScore = result.score;
    const bounded = Math.min(Math.max(mlScore, 0), 1);
    return bounded;
  }
  return heuristic;
}