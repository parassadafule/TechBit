const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const { getFeed: getRankedFeed } = require('../controllers/feedController');
const {
  uploadPost,
  createPost,
  getPost,
  deletePost,
  likePost,
  sharePost,
} = require('../controllers/postController');

const router = express.Router();

// Public access for shared links
router.get('/public/:id', validationRules.mongoId, validate, getPost);

router.use(ensureAuthenticated);

router.post('/upload', validationRules.uploadPost, validate, uploadPost);

router.post('/', validationRules.createPost, validate, createPost);

router.get('/feed', getRankedFeed);

router.get('/:id', validationRules.mongoId, validate, getPost);

router.delete('/:id', validationRules.mongoId, validate, deletePost);

router.post('/:id/like', validationRules.mongoId, validate, likePost);

router.post('/:id/share', validationRules.mongoId, validate, sharePost);

module.exports = router;
