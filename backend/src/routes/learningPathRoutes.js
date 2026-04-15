const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validator');
const {
  getLearningPath,
  regenerateLearningPath,
  completePathItem,
} = require('../controllers/learningPathController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', getLearningPath);

router.post('/regenerate', validationRules.regenerateLearningPath, validate, regenerateLearningPath);

router.post('/:pathId/complete/:step', completePathItem);

module.exports = router;
