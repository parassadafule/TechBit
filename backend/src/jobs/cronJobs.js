const cron = require('node-cron');
const trendService = require('../services/trendService');
const logger = require('../utils/logger');


function initializeCronJobs() {
  cron.schedule(process.env.TREND_FETCH_INTERVAL || '*/30 * * * *', async () => {
    logger.info('Starting trend fetch cron job');
    try {
      const allTrends = await trendService.refreshTrends();

      logger.info(`Trend fetch completed. Fetched ${allTrends.length} trends`);
    } catch (error) {
      logger.error('Error in trend fetch cron job:', error);
    }
  });
  logger.info('Cron jobs initialized');
}

module.exports = { initializeCronJobs };
