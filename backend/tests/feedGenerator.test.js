import { createFeedGenerator } from '../src/feedGenerator/generator.js';
import { calculateNovelty } from '../src/feedGenerator/scoring/novelty.js';
import { calculateImpact } from '../src/feedGenerator/scoring/impact.js';
import { mockPosts } from '../src/mockData.js';

describe('Feed Generator', () => {
  let feedGenerator;

  beforeEach(() => {
    feedGenerator = createFeedGenerator(null);
  });

  test('should return feed with scored posts', async () => {
    const result = await feedGenerator.getFeed({});
    
    expect(result).toHaveProperty('feed');
    expect(result).toHaveProperty('metadata');
    expect(Array.isArray(result.feed)).toBe(true);
    expect(result.feed.length).toBeGreaterThan(0);
  });

  test('should rank posts by score in descending order', async () => {
    const result = await feedGenerator.getFeed({ sortBy: 'score' });
    
    for (let i = 0; i < result.feed.length - 1; i++) {
      expect(result.feed[i].score).toBeGreaterThanOrEqual(result.feed[i + 1].score);
    }
  });

  test('should apply pagination correctly', async () => {
    const limit = 3;
    const result = await feedGenerator.getFeed({ limit, offset: 0 });
    
    expect(result.feed.length).toBeLessThanOrEqual(limit);
    expect(result.metadata.limit).toBe(limit);
  });

  test('should filter posts by tags', async () => {
    const filterTags = ['blockchain'];
    const result = await feedGenerator.getFeed({ filterTags });
    
    result.feed.forEach(item => {
      expect(item.post.tags.some(tag => filterTags.includes(tag))).toBe(true);
    });
  });

  test('should get post by ID', async () => {
    const postId = '1';
    const result = await feedGenerator.getPostById(postId);
    
    expect(result.post.id).toBe(postId);
    expect(result).toHaveProperty('scores');
  });

  test('should throw error for non-existent post ID', async () => {
    await expect(feedGenerator.getPostById('999')).rejects.toThrow();
  });

  test('should get posts by author', async () => {
    const author = 'techguru';
    const result = await feedGenerator.getPostsByAuthor(author);
    
    expect(result.posts).toBeDefined();
    result.posts.forEach(post => {
      expect(post.author).toBe(author);
    });
  });

  test('should get trending tags', async () => {
    const result = await feedGenerator.getTrendingTags();
    
    expect(result).toHaveProperty('trending');
    expect(Array.isArray(result.trending)).toBe(true);
    expect(result.trending.length).toBeGreaterThan(0);
  });
});

describe('Novelty Scoring', () => {
  test('should calculate novelty score between 0 and 1', () => {
    mockPosts.forEach(post => {
      const score = calculateNovelty(post);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  test('should give higher score for trending tags', () => {
    const postWithTrending = {
      text: 'Quantum computing breakthrough',
      tags: ['quantum-computing'],
      timestamp: new Date().toISOString()
    };
    
    const postWithoutTrending = {
      text: 'Random post',
      tags: ['random-tag'],
      timestamp: new Date().toISOString()
    };
    
    const trendingScore = calculateNovelty(postWithTrending);
    const nonTrendingScore = calculateNovelty(postWithoutTrending);
    
    expect(trendingScore).toBeGreaterThan(nonTrendingScore);
  });

  test('should give recency bonus to new posts', () => {
    const newPost = {
      text: 'New post',
      tags: ['test'],
      timestamp: new Date().toISOString()
    };
    
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2);
    const oldPost = {
      text: 'Old post',
      tags: ['test'],
      timestamp: oldDate.toISOString()
    };
    
    const newScore = calculateNovelty(newPost);
    const oldScore = calculateNovelty(oldPost);
    
    expect(newScore).toBeGreaterThan(oldScore);
  });
});

describe('Impact Scoring', () => {
  test('should calculate impact score between 0 and 1', () => {
    mockPosts.forEach(post => {
      const score = calculateImpact(post);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  test('should give higher score for posts with GitHub stats', () => {
    const postWithRepo = mockPosts[0]; // Has repo with stats
    const postWithoutRepo = {
      text: 'Post without repo',
      author: 'unknown'
    };
    
    const withRepoScore = calculateImpact(postWithRepo);
    const withoutRepoScore = calculateImpact(postWithoutRepo);
    
    expect(withRepoScore).toBeGreaterThan(withoutRepoScore);
  });

  test('should factor in author reputation', () => {
    const highRepPost = {
      text: 'Post by high rep author',
      author: 'quantumphys' // High reputation
    };
    
    const lowRepPost = {
      text: 'Post by low rep author',
      author: 'p2penthusiast' // Lower reputation
    };
    
    const highScore = calculateImpact(highRepPost);
    const lowScore = calculateImpact(lowRepPost);
    
    expect(highScore).toBeGreaterThan(lowScore);
  });

  test('should consider social engagement', () => {
    const highEngagement = {
      text: 'Popular post',
      likes: 500,
      shares: 100
    };
    
    const lowEngagement = {
      text: 'Unpopular post',
      likes: 10,
      shares: 2
    };
    
    const highScore = calculateImpact(highEngagement);
    const lowScore = calculateImpact(lowEngagement);
    
    expect(highScore).toBeGreaterThan(lowScore);
  });
});