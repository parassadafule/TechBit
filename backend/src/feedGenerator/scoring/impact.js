// Impact scoring via GitHub oracles and attestations
import { mockGitHubStats, mockUsers } from '../../mockData.js';

export function calculateImpact(post) {
  // Calculate impact based on GitHub metrics and author reputation
  let impactScore = 0.3; // Base score
  
  // GitHub metrics contribution
  if (post.repo && mockGitHubStats[post.repo]) {
    const stats = mockGitHubStats[post.repo];
    
    // Stars indicate project quality and recognition
    impactScore += (stats.stars * 0.001);
    
    // Forks suggest practical utility
    impactScore += (stats.forks * 0.0008);
    
    // Contributors indicate collaborative impact
    if (stats.contributors) {
      impactScore += (stats.contributors * 0.01);
    }
    
    // Recent updates boost relevance
    if (stats.lastUpdate) {
      const updateDate = new Date(stats.lastUpdate);
      const now = new Date();
      const daysSinceUpdate = (now - updateDate) / (1000 * 60 * 60 * 24);
      const freshnessBonus = Math.max(0, 0.1 * (1 - daysSinceUpdate / 7)); // Decay over a week
      impactScore += freshnessBonus;
    }
    
    // Penalize for many open issues (maintenance concerns)
    impactScore -= Math.min(stats.issues * 0.008, 0.15);
  }
  
  // Author reputation contribution
  if (post.author && mockUsers[post.author]) {
    const authorInfo = mockUsers[post.author];
    impactScore += (authorInfo.reputation || 0) * 0.4; // Heavily weight author reputation
    
    // Follower count indicates influence
    if (authorInfo.followers) {
      impactScore += Math.min((authorInfo.followers / 10000) * 0.2, 0.2);
    }
  }
  
  // Social engagement signals
  if (post.likes) {
    impactScore += Math.min((post.likes / 1000) * 0.15, 0.15);
  }
  
  if (post.shares) {
    impactScore += Math.min((post.shares / 100) * 0.1, 0.1);
  }
  
  return Math.min(Math.max(impactScore, 0), 1.0); // Clamp between 0 and 1
}