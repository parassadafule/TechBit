const cron = require('node-cron');
const trendService = require('../services/trendService');
const LearningPath = require('../models/LearningPath');
const User = require('../models/User');
const ragService = require('../services/ragService');
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

  cron.schedule(process.env.LEARNING_PATH_REGEN_INTERVAL || '0 0 * * *', async () => {
    logger.info('Starting learning path regeneration cron job');
    try {
      const users = await User.find().select('_id interests goals');

      let count = 0;
      for (const user of users) {
        try {
          const existingPath = await LearningPath.findOne({ userId: user._id })
            .sort({ generatedAt: -1 });

          if (!existingPath || 
              (new Date() - existingPath.generatedAt) > 7 * 24 * 60 * 60 * 1000) {
            
            const Post = require('../models/Post');
            const profileText = `${user.interests.join(' ')} ${user.goals.career}`;
            
            const vectorResults = await ragService.semanticSearch(profileText, 10);
            const postIds = vectorResults
              .map((r) => r.metadata?.postId)
              .filter(Boolean);

            const posts = await Post.find({ _id: { $in: postIds } })
              .select('title type tags');

            if (posts.length > 0) {
              const steps = await ragService.generateLearningPath(user, posts);

              await LearningPath.create({
                userId: user._id,
                goals: user.goals,
                items: steps,
                generatedAt: new Date(),
              });

              count++;
            }
          }
        } catch (error) {
          logger.error(`Error regenerating path for user ${user._id}:`, error);
        }
      }

      logger.info(`Learning path regeneration completed. Regenerated ${count} paths`);
    } catch (error) {
      logger.error('Error in learning path regeneration cron job:', error);
    }
  });

  logger.info('Cron jobs initialized');
}

module.exports = { initializeCronJobs };
