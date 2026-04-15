const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validate, validationRules } = require('../middleware/validator');
const {
  summarize,
  summarizeMultimodal,
  queryAgent,
  getRecommendations,
  getDeveloperBriefing,
} = require('../controllers/aiController');

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/summarize', aiLimiter, validationRules.summarize, validate, summarize);

router.post('/summarize-multimodal', aiLimiter, validationRules.summarizeMultimodal, validate, summarizeMultimodal);

router.post('/query', aiLimiter, validationRules.aiQuery, validate, queryAgent);

router.get('/recommendations', aiLimiter, getRecommendations);

router.get('/briefing', aiLimiter, getDeveloperBriefing);

module.exports = router;
