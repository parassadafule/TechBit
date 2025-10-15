// import { AtpAgent } from '@atproto/api'; // Placeholder
import { calculateNovelty, calculateNoveltyAsync } from './scoring/novelty.js';
import { calculateImpact } from './scoring/impact.js';
import { mockPosts, mockUsers } from '../mockData.js';

export function createFeedGenerator(agent) {
  // Custom feed logic
  return {
    async getFeed(params = {}) {
      const { limit = 10, offset = 0, sortBy = 'score', filterTags = [] } = params;
      
      // Fetch posts (using mock data)
      let posts = [...mockPosts];
      
      // Apply tag filtering if specified
      if (filterTags.length > 0) {
        posts = posts.filter(post => 
          post.tags && post.tags.some(tag => filterTags.includes(tag))
        );
      }
      
      // Score and rank each post (await ML novelty when available)
      const scoredPosts = await Promise.all(posts.map(async (post) => {
        const [noveltyScore, impactScore] = await Promise.all([
          calculateNoveltyAsync(post),
          Promise.resolve(calculateImpact(post))
        ]);
        const totalScore = noveltyScore + impactScore;
        return {
          post: {
            ...post,
            authorInfo: mockUsers[post.author] || null
          },
          scores: {
            novelty: noveltyScore.toFixed(2),
            impact: impactScore.toFixed(2),
            total: totalScore.toFixed(2)
          },
          score: totalScore
        };
      }));
      
      // Sort by specified criteria
      if (sortBy === 'score') {
        scoredPosts.sort((a, b) => b.score - a.score);
      } else if (sortBy === 'timestamp') {
        scoredPosts.sort((a, b) => new Date(b.post.timestamp) - new Date(a.post.timestamp));
      } else if (sortBy === 'likes') {
        scoredPosts.sort((a, b) => (b.post.likes || 0) - (a.post.likes || 0));
      }
      
      // Apply pagination
      const paginatedPosts = scoredPosts.slice(offset, offset + limit);
      
      return { 
        feed: paginatedPosts,
        metadata: {
          total: scoredPosts.length,
          limit,
          offset,
          sortBy,
          filterTags
        }
      };
    },
    
    async getPostById(postId) {
      const post = mockPosts.find(p => p.id === postId);
      if (!post) {
        throw new Error(`Post with id ${postId} not found`);
      }
      
      return {
        post: {
          ...post,
          authorInfo: mockUsers[post.author] || null
        },
        scores: {
          novelty: calculateNovelty(post).toFixed(2),
          impact: calculateImpact(post).toFixed(2)
        }
      };
    },
    
    async getPostsByAuthor(author) {
      const authorPosts = mockPosts.filter(p => p.author === author);
      return {
        posts: authorPosts,
        authorInfo: mockUsers[author] || null,
        count: authorPosts.length
      };
    },
    
    async getTrendingTags() {
      const tagCounts = {};
      mockPosts.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
      
      return { trending: sortedTags };
    }
  };
}