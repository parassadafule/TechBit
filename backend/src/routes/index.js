const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const searchRoutes = require('./searchRoutes');
const commentRoutes = require('./commentRoutes');
const aiRoutes = require('./aiRoutes');
const learningPathRoutes = require('./learningPathRoutes');
const trendRoutes = require('./trendRoutes');
const notificationRoutes = require('./notificationRoutes');
const feedRoutes = require('./feedRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/search', searchRoutes);
router.use('/comments', commentRoutes);
router.use('/ai', aiRoutes);
router.use('/learning-path', learningPathRoutes);
router.use('/trends', trendRoutes);
router.use('/notifications', notificationRoutes);
router.use('/feed', feedRoutes);

module.exports = router;
