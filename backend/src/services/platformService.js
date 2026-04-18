const Post = require('../models/Post');
const trendService = require('./trendService');

class PlatformService {
  async getDeveloperBriefing({ topics = [], userInterests = [], refreshTrends = false, days = 3 } = {}) {
    const combinedTopics = [...new Set([...topics, ...userInterests].filter(Boolean))];

    if (refreshTrends) {
      await trendService.refreshTrends();
    }

    const trends = await trendService.getLatestTrends({ limit: 12 });

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Math.max(1, days));

    const query = {
      createdAt: { $gte: fromDate },
      ...(combinedTopics.length > 0
        ? {
            $or: [
              { tags: { $in: combinedTopics } },
              { title: { $regex: combinedTopics.join('|'), $options: 'i' } },
            ],
          }
        : {}),
    };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title tldr blogUrl type tags createdAt');

    const spotlight = trends.slice(0, 3).map((trend) => ({
      title: trend.topic,
      source: trend.source,
      summary: trend.description || `Trending on ${trend.source}`,
      score: trend.finalScore || trend.score || 0,
    }));

    const quickReads = posts.slice(0, 5).map((post) => ({
      id: post._id,
      title: post.title,
      summary: post.tldr || 'Short context card generated from your recent relevant resources.',
      type: post.type,
      tags: post.tags || [],
      url: post.blogUrl || null,
      createdAt: post.createdAt,
    }));

    return {
      topics: combinedTopics,
      generatedAt: new Date().toISOString(),
      spotlight,
      quickReads,
      recommendations: [
        'Start with the spotlight trends to identify what is currently relevant.',
        'Use quick reads to build context before deep dives into full resources.',
        'Regenerate your learning path after completing at least two resources this week.',
      ],
    };
  }
}

module.exports = new PlatformService();
