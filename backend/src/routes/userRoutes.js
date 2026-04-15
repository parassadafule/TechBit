const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const {
  getProfile,
  updateProfile,
  getActivityHistory,
  addActivity,
  getSuggestedUsers,
  getBookmarks,
  toggleBookmark,
} = require('../controllers/userController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/profile/:id?', getProfile);

router.put('/profile', validationRules.updateProfile, validate, updateProfile);

router.get('/activity', getActivityHistory);

router.post('/activity', addActivity);

router.get('/suggested', getSuggestedUsers);

router.get('/bookmarks', getBookmarks);

router.post('/bookmarks/:postId', toggleBookmark);

module.exports = router;
