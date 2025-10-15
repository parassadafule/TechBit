// Fetch GitHub data for impact signals
import { mockGitHubStats } from '../mockData.js';

export async function fetchGitHubStats(repo) {
  // Mock GitHub API call with realistic delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stats = mockGitHubStats[repo];
      if (stats) {
        resolve({
          success: true,
          repo,
          ...stats
        });
      } else {
        // Return default stats for unknown repos
        resolve({ 
          success: true,
          repo,
          forks: 0, 
          stars: 0, 
          issues: 0,
          contributors: 0,
          lastUpdate: null,
          message: 'Repository not found in mock data. Using default values.'
        });
      }
    }, 100); // Simulate API delay
  });
}

export async function fetchMultipleRepos(repos) {
  if (!Array.isArray(repos)) {
    throw new Error('repos must be an array');
  }
  
  const promises = repos.map(repo => fetchGitHubStats(repo));
  const results = await Promise.all(promises);
  
  return {
    success: true,
    count: results.length,
    repositories: results
  };
}

export function getTopRepositories(limit = 5, sortBy = 'stars') {
  const repos = Object.entries(mockGitHubStats).map(([repo, stats]) => ({
    repo,
    ...stats
  }));
  
  // Sort by specified metric
  repos.sort((a, b) => {
    if (sortBy === 'stars') return b.stars - a.stars;
    if (sortBy === 'forks') return b.forks - a.forks;
    if (sortBy === 'contributors') return (b.contributors || 0) - (a.contributors || 0);
    return 0;
  });
  
  return {
    top: repos.slice(0, limit),
    sortBy,
    limit
  };
}

export function calculateRepoHealth(repo) {
  const stats = mockGitHubStats[repo];
  if (!stats) {
    return { error: 'Repository not found' };
  }
  
  // Health score based on various factors
  let healthScore = 50; // Base score
  
  // Stars indicate popularity
  healthScore += Math.min(stats.stars / 10, 20);
  
  // Forks indicate utility
  healthScore += Math.min(stats.forks / 5, 15);
  
  // Contributors indicate active development
  if (stats.contributors) {
    healthScore += Math.min(stats.contributors * 2, 10);
  }
  
  // Issues can indicate problems
  healthScore -= Math.min(stats.issues * 2, 15);
  
  // Recent updates are positive
  if (stats.lastUpdate) {
    const updateDate = new Date(stats.lastUpdate);
    const now = new Date();
    const daysSinceUpdate = (now - updateDate) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 7) {
      healthScore += 10;
    } else if (daysSinceUpdate <= 30) {
      healthScore += 5;
    }
  }
  
  healthScore = Math.min(Math.max(healthScore, 0), 100);
  
  return {
    repo,
    healthScore: healthScore.toFixed(1),
    rating: healthScore >= 80 ? 'Excellent' : 
            healthScore >= 60 ? 'Good' : 
            healthScore >= 40 ? 'Fair' : 'Poor',
    stats
  };
}