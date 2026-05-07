const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const {
  getProfile,
  updateProfile,
  getUserPosts,
  getActivityHistory,
  addActivity,
  getSuggestedUsers,
  followUser,
  unfollowUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/profile/:id?', getProfile);

router.post('/:id/follow', followUser);

router.delete('/:id/follow', unfollowUser);

router.get('/:id/posts', getUserPosts);

router.put('/profile', validationRules.updateProfile, validate, updateProfile);

router.get('/activity', getActivityHistory);

router.post('/activity', addActivity);

router.get('/suggested', getSuggestedUsers);

module.exports = router;
