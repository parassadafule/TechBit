
import { mockGitHubStats, mockUsers } from '../../mockData.js';

export function calculateImpact(post) {
  
  let impactScore = 0.3; 
  
  
  if (post.repo && mockGitHubStats[post.repo]) {
    const stats = mockGitHubStats[post.repo];
    
    
    impactScore += (stats.stars * 0.001);
    
    
    impactScore += (stats.forks * 0.0008);
    
    
    if (stats.contributors) {
      impactScore += (stats.contributors * 0.01);
    }
    
    
    if (stats.lastUpdate) {
      const updateDate = new Date(stats.lastUpdate);
      const now = new Date();
      const daysSinceUpdate = (now - updateDate) / (1000 * 60 * 60 * 24);
      const freshnessBonus = Math.max(0, 0.1 * (1 - daysSinceUpdate / 7)); 
      impactScore += freshnessBonus;
    }
    
    
    impactScore -= Math.min(stats.issues * 0.008, 0.15);
  }
  
  
  if (post.author && mockUsers[post.author]) {
    const authorInfo = mockUsers[post.author];
    impactScore += (authorInfo.reputation || 0) * 0.4; 
    
    
    if (authorInfo.followers) {
      impactScore += Math.min((authorInfo.followers / 10000) * 0.2, 0.2);
    }
  }
  
  
  if (post.likes) {
    impactScore += Math.min((post.likes / 1000) * 0.15, 0.15);
  }
  
  if (post.shares) {
    impactScore += Math.min((post.shares / 100) * 0.1, 0.1);
  }
  
  return Math.min(Math.max(impactScore, 0), 1.0); 
}