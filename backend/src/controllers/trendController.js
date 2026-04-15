const trendService = require('../services/trendService');
const logger = require('../utils/logger');

function normalizeTrendResponse(trend) {
  return {
    _id: trend._id,
    topic: trend.topic,
    source: trend.source,
    score: trend.score,
    finalScore: trend.finalScore,
    description: trend.description,
    url: trend.url,
    createdAt: trend.createdAt,
    fetchedAt: trend.fetchedAt,
    data: trend.data || {},
  };
}

const getTrends = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const source = req.query.source || '';
    const trends = await trendService.getLatestTrends({ limit, source });

    res.json({
      trends: trends.map(normalizeTrendResponse),
      count: trends.length,
    });
  } catch (error) {
    logger.error('Error getting trends:', error);
    res.status(500).json({ error: 'Error fetching trends' });
  }
};

const refreshTrends = async (req, res) => {
  try {
    const allTrends = await trendService.refreshTrends();

    res.json({
      trends: allTrends.map(normalizeTrendResponse),
      count: allTrends.length,
      refreshed: true,
    });
  } catch (error) {
    logger.error('Error refreshing trends:', error);
    res.status(500).json({ error: 'Error fetching trends' });
  }
};

module.exports = {
  getTrends,
  refreshTrends,
};
