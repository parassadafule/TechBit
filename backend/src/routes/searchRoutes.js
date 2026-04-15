const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const {
  searchPosts,
  filterByTags,
  getRelatedPosts,
} = require('../controllers/searchController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', validationRules.search, validate, searchPosts);

router.get('/tags', validationRules.search, validate, filterByTags);

router.get('/related/:id', validationRules.mongoId, validate, getRelatedPosts);

module.exports = router;
