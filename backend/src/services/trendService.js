const Trend = require('../models/Trend');
const unifiedTrendEngine = require('./trendEngine');
const logger = require('../utils/logger');

class TrendService {
  normalizeSource(source = '') {
    const normalizedSource = String(source || '').trim().toLowerCase();
    return normalizedSource === 'dev.to' ? 'devto' : normalizedSource;
  }

  async saveTrends(trends = []) {
    if (!Array.isArray(trends) || trends.length === 0) {
      return [];
    }

    const fetchedAt = new Date();
    const operations = trends.map((trend) => ({
      updateOne: {
        filter: { normalizedTopic: trend.normalizedTopic },
        update: {
          $set: {
            topic: trend.topic,
            normalizedTopic: trend.normalizedTopic,
            source: this.normalizeSource(trend.source),
            score: trend.score,
            finalScore: trend.finalScore,
            description: trend.description,
            url: trend.url,
            createdAt: trend.createdAt,
            fetchedAt,
            updatedAt: fetchedAt,
            data: trend.data || {},
          },
          $setOnInsert: {
            createdAt: trend.createdAt,
          },
        },
        upsert: true,
      },
    }));

    await Trend.bulkWrite(operations, { ordered: false });
    logger.info(`Saved ${trends.length} unified trends`);
    return trends;
  }

  async getLatestTrends({ limit = 50, source = '' } = {}) {
    const normalizedSource = this.normalizeSource(source);
    const query = normalizedSource ? { source: normalizedSource } : {};

    return Trend.find(query)
      .sort({ finalScore: -1, fetchedAt: -1 })
      .limit(Number(limit) || 50)
      .lean();
  }

  async refreshTrends({ source = '' } = {}) {
    const requestedSource = this.normalizeSource(source);
    const trends = await unifiedTrendEngine.fetchAllTrends();

    const filteredTrends = requestedSource
      ? trends.filter((trend) => this.normalizeSource(trend.source) === requestedSource)
      : trends;

    await this.saveTrends(filteredTrends);
    return filteredTrends;
  }
}

module.exports = new TrendService();